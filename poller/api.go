package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
)

type apiResponse struct {
	Servers [][]any `json:"servers"`
}

// Get the current state from the JSON API and convert it into our format
func getCurrentState(ctx context.Context, endpoint string) (map[string]Server, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	var apiResp apiResponse
	err = json.NewDecoder(resp.Body).Decode(&apiResp)
	if err != nil {
		return nil, err
	}

	state := make(map[string]Server)
	for _, server := range apiResp.Servers {
		region, name, err := parseServerName(server[1].(string))
		if err != nil {
			log.Printf("Error parsing server name: %v", err)
			name = server[1].(string)
			region = ""
		}

		state[server[0].(string)] = Server{
			ID:         server[0].(string),
			Name:       name,
			Region:     region,
			PartySize:  partySizeMapping[server[2].(string)],
			Type:       ModdedServer,
			Map:        server[4].(string),
			State:      apiStateToState[server[5].(string)],
			Players:    int64(server[6].(float64)),
			MaxPlayers: extractMaxPlayerCount(server[7].(string)),
			Uptime:     server[9].(string),
			IP:         server[10].(string),
		}
	}

	return state, nil
}

func extractMaxPlayerCount(in string) int64 {
	var players, maxPlayers int64
	fmt.Sscanf(in, "%d/%d", &players, &maxPlayers)
	return maxPlayers
}

var nameParser *regexp.Regexp = regexp.MustCompile(`^.*\[(.{2})\] +(.*)`)

func parseServerName(name string) (string, string, error) {
	matches := nameParser.FindStringSubmatch(name)
	if len(matches) != 3 {
		return "", "", fmt.Errorf("could not parse server name: %s", name)
	}
	return matches[1], matches[2], nil
}
