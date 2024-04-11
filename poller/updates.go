package main

import (
	"time"

	"github.com/rs/zerolog/log"
)

// State change update message sent over websocket
type UpdateMessage struct {
	ID            string  `json:"id"`
	Updated       int64   `json:"updated_ms"`
	State         *State  `json:"state,omitempty"`
	Players       *int64  `json:"players,omitempty"`
	Uptime        *string `json:"uptime,omitempty"`
	UptimeMinutes *int64  `json:"uptime_minutes,omitempty"`
}

// compare server maps and generate update messages for changes
func diffServers(oldState, newState map[string]Server) []UpdateMessage {
	var now int64 = time.Now().UnixMilli()

	var updates []UpdateMessage
	for id, server := range oldState {
		newServer, ok := newState[id]
		if !ok {
			log.Warn().Str("server_id", id).Msg("Server not in new state")
		} else {
			if server.State != newServer.State || server.Players != newServer.Players || server.Uptime != newServer.Uptime {
				msg := UpdateMessage{ID: id, Updated: now}
				if server.State != newServer.State {
					msg.State = ptrTo(newServer.State)
				}
				if server.Players != newServer.Players {
					msg.Players = ptrTo(newServer.Players)
				}
				if server.Uptime != newServer.Uptime {
					msg.Uptime = &newServer.Uptime
				}
				if server.UptimeMinutes != newServer.UptimeMinutes {
					msg.UptimeMinutes = newServer.UptimeMinutes
				}
				updates = append(updates, msg)
			}
		}
	}
	return updates
}

func ptrTo[T any](v T) *T {
	return &v
}
