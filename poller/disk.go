package main

import (
	"encoding/json"
	"os"
	"time"
)

type StateFile struct {
	LastUpdated int64             `json:"last_updated_ms"`
	Servers     map[string]Server `json:"servers"`
}

func writeStateToFile(state map[string]Server, path string) error {
	f, err := os.CreateTemp("", "")
	if err != nil {
		return err
	}

	err = json.NewEncoder(f).Encode(StateFile{
		LastUpdated: time.Now().UnixMilli(),
		Servers:     state,
	})
	if err != nil {
		f.Close()
		os.Remove(f.Name())
		return err
	}

	f.Close()

	err = os.Rename(f.Name(), path)
	if err != nil {
		os.Remove(f.Name())
	}
	return err
}
