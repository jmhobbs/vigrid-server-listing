package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/peterbourgon/ff"
)

func main() {
	fs := flag.NewFlagSet("vigrid-monitor", flag.ExitOnError)
	var (
		pollingInterval *time.Duration = fs.Duration("polling-interval", 5*time.Second, "Polling interval for the service")
		endpoint        *string        = fs.String("endpoint", "https://vigrid.ovh/json", "Endpoint to poll")
		stateFilePath   *string        = fs.String("state-file", "servers.json", "File to write the state to")
		publishEndpoint *string        = fs.String("publish-endpoint", "http://localhost/update", "Endpoint to publish updates to")
		username        *string        = fs.String("username", "", "HTTP basic auth username for the publish endpoint")
		password        *string        = fs.String("password", "", "HTTP basic auth password for the publish endpoint")
		_                              = fs.String("config", "", "config file (optional)")
	)

	ff.Parse(fs, os.Args[1:],
		ff.WithConfigFileFlag("config"),
		ff.WithConfigFileParser(ff.PlainParser),
	)

	fmt.Printf("-> Polling %v every %v, posting updates to %v\n", *endpoint, *pollingInterval, *publishEndpoint)
	fmt.Printf("-> Writing state to %v\n", *stateFilePath)

	// Get the initial state of the world
	serverState, err := getCurrentState(context.TODO(), *endpoint)
	if err != nil {
		log.Fatalf("Failed to get initial state: %v", err)
	}

	err = writeStateToFile(serverState, *stateFilePath)
	if err != nil {
		log.Fatalf("Failed to get initial state: %v", err)
	}

	statesToDisk := make(chan map[string]Server)
	updateMessages := make(chan UpdateMessage, 20)

	go func() {
		for newState := range statesToDisk {
			err := writeStateToFile(newState, *stateFilePath)
			if err != nil {
				log.Printf("Failed to write state to file: %v", err)
			}
		}
	}()

	var wg sync.WaitGroup

	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			var err error
			for msg := range updateMessages {
				err = publishMessage(msg, *publishEndpoint, *username, *password)
				if err != nil {
					log.Printf("Failed to publish update message for %v: %v", msg.ID, err)
				}
			}
		}()
	}

	// Begin polling the service and issue updates
	ticker := time.NewTicker(*pollingInterval)
	for {
		select {
		case <-ticker.C:
			// Call the service for updated state
			newState, err := getCurrentState(context.TODO(), *endpoint)
			if err != nil {
				log.Printf("Failed to get state: %v", err)
				continue
			}
			// Send the new state to be written to disk
			select {
			case statesToDisk <- newState:
			default:
				log.Println("Write blocked sending new state to disk")
			}
			// Generate diffs for all the servers
			updates := diffServers(serverState, newState)
			for _, update := range updates {
				log.Printf("Sending update for server %s", update.ID)
				updateMessages <- update
			}
			serverState = newState
		}
	}
}

func publishMessage(msg UpdateMessage, endpoint, username, password string) error {
	var buf bytes.Buffer
	err := json.NewEncoder(&buf).Encode(msg)
	if err != nil {
		return err
	}

	req, err := http.NewRequest(http.MethodPost, endpoint, &buf)
	if err != nil {
		return err
	}
	req.SetBasicAuth(username, password)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	return nil
}
