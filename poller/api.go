package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"github.com/rs/zerolog/log"
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
			log.Warn().Str("name", server[1].(string)).Msg("Error parsing server name")
			name = server[1].(string)
			region = ""
		}

		state[server[0].(string)] = Server{
			ID:            server[0].(string),
			Name:          name,
			Region:        region,
			PartySize:     partySizeMapping[server[2].(string)],
			Type:          server[3].(string),
			Map:           server[4].(string),
			State:         apiStateToState[server[5].(string)],
			Players:       int64(server[6].(float64)),
			MaxPlayers:    extractMaxPlayerCount(server[7].(string)),
			Uptime:        server[9].(string),
			UptimeMinutes: parseUptime(server[9].(string)),
			IP:            server[10].(string),
		}
	}

	return state, nil
}

func extractMaxPlayerCount(in string) int64 {
	var players, maxPlayers int64
	fmt.Sscanf(in, "%d/%d", &players, &maxPlayers)
	return maxPlayers
}

var nameParser *regexp.Regexp = regexp.MustCompile(`^<span class="fi fi-(.{2})"></span> ((\[.{2}\])?(.*))`)

func parseServerName(name string) (string, string, error) {
	matches := nameParser.FindStringSubmatch(name)
	if len(matches) != 5 {
		return "", "", fmt.Errorf("could not parse server name: %s", name)
	}
	region := strings.ToUpper(matches[1])
	// class on North America is CA (Canada?)
	if region == "CA" {
		region = "NA"
	}
	return region, strings.TrimSpace(matches[4]), nil
}

func parseUptime(uptime string) *int64 {
	var minutes int64
	if n, _ := fmt.Sscanf(uptime, "%d min", &minutes); n == 1 {
		return &minutes
	}
	return nil
}
