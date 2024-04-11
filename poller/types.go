package main

type ServerType string

const (
	VanillaServer ServerType = "vanilla"
	ModdedServer  ServerType = "modded"
)

type PartySize int

const (
	SoloPartySize PartySize = 1
	DuoPartySize  PartySize = 2
	TrioPartySize PartySize = 3
)

var partySizeMapping map[string]PartySize = map[string]PartySize{
	"solo": SoloPartySize,
	"duo":  DuoPartySize,
	"trio": TrioPartySize,
}

type State string

const (
	Locked  State = "locked"
	Open    State = "open"
	Full    State = "full"
	Offline State = "offline"
)

var apiStateToState map[string]State = map[string]State{
	"🔴": Locked,
	"🟢": Open,
	"🟠": Full,
	"⚫": Offline,
}

type Server struct {
	ID            string     `json:"id"`
	Name          string     `json:"name"`
	Region        string     `json:"region"`
	PartySize     PartySize  `json:"party_size"`
	Type          ServerType `json:"type"`
	Map           string     `json:"map"`
	State         State      `json:"state"`
	Players       int64      `json:"players"`
	MaxPlayers    int64      `json:"max_players"`
	Uptime        string     `json:"uptime"`
	UptimeMinutes *int64     `json:"uptime_minutes,omitempty"`
	IP            string     `json:"ip"`
}

var RegionMapping map[string]string = map[string]string{
	"NA": "North America",
	"AU": "Australia",
	"EU": "Europe",
}
