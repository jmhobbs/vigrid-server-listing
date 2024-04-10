package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/peterbourgon/ff"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

func main() {
	fs := flag.NewFlagSet("vigrid-monitor", flag.ExitOnError)
	var (
		pollingInterval    *time.Duration = fs.Duration("polling-interval", 5*time.Second, "Polling interval for the service")
		endpoint           *string        = fs.String("endpoint", "https://vigrid.ovh/json", "Endpoint to poll")
		stateFilePath      *string        = fs.String("state-file", "servers.json", "File to write the state to")
		publishEndpoint    *string        = fs.String("publish-endpoint", "http://localhost/update", "Endpoint to publish updates to")
		username           *string        = fs.String("username", "", "HTTP basic auth username for the publish endpoint")
		password           *string        = fs.String("password", "", "HTTP basic auth password for the publish endpoint")
		verbose            *bool          = fs.Bool("verbose", false, "Enable verbose logging")
		publishWorkerCount *int           = fs.Int("publish-workers", 10, "Number of workers to publish updates")
		_                                 = fs.String("config", "", "config file (optional)")
	)

	ff.Parse(fs, os.Args[1:],
		ff.WithConfigFileFlag("config"),
		ff.WithConfigFileParser(ff.PlainParser),
	)

	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	if *verbose {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	} else {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	}

	log.Info().
		Str("endpoint", *endpoint).
		Str("publish", *publishEndpoint).
		Dur("interval", *pollingInterval).
		Msg("Starting vigrid-monitor")

	// Get the initial state of the world
	serverState, err := getCurrentState(context.TODO(), *endpoint)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to get initial state")
	}

	err = writeStateToFile(serverState, *stateFilePath)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to write initial state to file")
	}

	statesToDisk := make(chan map[string]Server)
	go stateToDiskConsumer(*stateFilePath, statesToDisk)

	var wg sync.WaitGroup
	updateMessages := make(chan UpdateMessage, *publishWorkerCount)

	// Start workers for posting update messages
	log.Info().Int("workers", *publishWorkerCount).Msg("Starting publish workers")
	for i := 0; i < *publishWorkerCount; i++ {
		wg.Add(1)
		go updatePublishWorker(&wg, updateMessages, *publishEndpoint, *username, *password)
	}

	// Begin polling the service and issue updates
	log.Info().Msg("Starting polling of server state")
	ticker := time.NewTicker(*pollingInterval)
	for {
		select {
		case <-ticker.C:
			// Call the service for updated state
			newState, err := getCurrentState(context.TODO(), *endpoint)
			if err != nil {
				log.Error().Err(err).Msg("Failed to get state")
				continue
			}

			// Send the new state to be written to disk
			select {
			case statesToDisk <- newState:
			case <-time.NewTimer(time.Second).C:
				log.Error().Msg("Write blocked sending new state to disk")
			}

			// Generate diffs for all the servers
			updates := diffServers(serverState, newState)
			for _, update := range updates {
				log.Debug().Str("server_id", update.ID).Msg("Server updated")
				updateMessages <- update
			}
			serverState = newState
		}
	}
}

func stateToDiskConsumer(output string, in chan map[string]Server) {
	for newState := range in {
		if err := writeStateToFile(newState, output); err != nil {
			log.Error().Err(err).Msg("Failed to write state to file")
		} else {
			log.Debug().Msg("Wrote state to file")
		}
	}
	log.Info().Msg("Shutting down state to disk consumer")
}

func updatePublishWorker(wg *sync.WaitGroup, updates chan UpdateMessage, endpoint, username, password string) {
	defer wg.Done()
	var err error
	for msg := range updates {
		err = publishMessage(msg, endpoint, username, password)
		if err != nil {
			log.Error().Err(err).Str("server_id", msg.ID).Msg("Failed to publish update message")
		}
	}
	log.Info().Msg("Shutting down publish worker")
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
