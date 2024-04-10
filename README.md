# VIGRID Server Monitor

This is a setup to add notifications when VIGRID Battle Royale servers restart.

It is vastly over architected, because that is half the fun.

## Design

```
     ┌────────────┐        ┌──────────────┐
     │            │        │              │
┌────│   Poller   │◀───────│  vigrid.ovh  │
│    │            │        │              │
│    └────────────┘        └──────────────┘
│           │
│           │                     ┌────────────────────────────────────────┐
│           │                     │                Browser                 │
│           ▼                     │                                        │
│  ┌─────────────────┐            │                   ┌──────────────────┐ │
│  │                 │            │                   │                  │ │
│  │      nchan      │───────┐    │                ┌─▶│   Server List    │ │
│  │                 │  Websocket │                │  │                  │ │
│  └─────────────────┘       │    │  ┌───────────┐ │  └──────────────────┘ │
│                            ├────┼─▶│  Monitor  │─┤                       │
│  ┌─────────────────┐       │    │  └───────────┘ │  ┌──────────────────┐ │
│  │                 │    fetch   │                │  │                  │ │
└─▶│  servers.json   │───────┘    │                └─▶│  Notifications   │ │
   │                 │            │                   │                  │ │
   └─────────────────┘            │                   └──────────────────┘ │
                                  │                                        │
                                  └────────────────────────────────────────┘
```

### Poller

Poller fetches the server information from [vigrid.ovh](https://vigrid.ovh) every 5 seconds.  It does some work to convert to the format we use, then writes it to a file, `servers.json`.  It takes the previous state and diffs it with the new state, generating update messages.  These are published to [nchan](https://nchan.io/), which sends them out over websocket to browsers.

In the browser we get initial state from `servers.json`, then begin watching for updates over the websocket connection.

### Web

Vanilla web components + events.
