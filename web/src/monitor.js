import NchanSubscriber from 'nchan';

// Handles updating server state from the servers.json and websocket connection.
export default class Monitor extends EventTarget {
  constructor(serverJsonURL, wsURL) {
    super()

    this.syncSource = serverJsonURL;

    this.lastSynced = 0;
    this.resyncing = true;

    this.state = {};

    // set up websocket connection
    this.sub = new NchanSubscriber(wsURL, { subscriber: 'websocket' });
    this.sub.on('message', this.onMessage.bind(this));
    this.sub.on('connect', this.onConnect.bind(this));
    this.sub.on('disconnect', this.onDisconnect.bind(this));
    this.sub.on('error', this.onError.bind(this));

    // start consuming over websocket
    this.sub.start();

    // sync with servers.json
    this.sync();
  }

  onMessage(msg) {
    const data = JSON.parse(msg);

    if(data.id == 'heartbeat') {
      this.dispatchEvent(new CustomEvent('heartbeat'));
      return
    }

    // We discard any updates while resyncing
    if(this.resyncing) { return; }

    // Discard events older than last sync
    if(data.updated_ms < this.lastSynced) { return; }

    if(data.players) {
      this.state[data.id].players = data.players;
    }
    if(data.uptime) {
      this.state[data.id].uptime = data.uptime;
    }
    if(data.state) {
      if(this.state[data.id].state !== 'open' && data.state === 'open') {
        this.dispatchEvent(new CustomEvent('server-restart', { detail: { id: data.id, name: this.state[data.id].name  } }));
      }
      this.state[data.id].state = data.state;
    }

    this.dispatchEvent(new CustomEvent('state-update', { detail: clone(this.state) }));
  }

  onConnect() {
    this.dispatchEvent(new CustomEvent('connected'));
    if(!this.resyncing) {
      this.sync();
    }
  }

  onDisconnect()  {
    this.dispatchEvent(new CustomEvent('disconnected'));
  }

  onError(err, desc) {
    console.error('nchan connection error', err, desc);
    this.dispatchEvent(new CustomEvent('error', { detail: { err, desc } }));
  }

  sync () {
    this.resyncing = true;
    this.dispatchEvent(new CustomEvent('reconnecting'));

    fetch(`${this.syncSource}?_=${Date.now()}`)
      .then((response) => response.json())
      .then((data) => {
        this.state = data.servers;
        this.dispatchEvent(new CustomEvent('state-update', { detail: clone(this.state) }));
        this.lastSynced = data.last_updated_ms;
        this.resyncing = false;
        this.dispatchEvent(new CustomEvent('reconnected'));
      })
      .catch((err) => {
        console.error('Error while syncing', err);
        this.dispatchEvent(new CustomEvent('error', { detail: { err } }));
      });
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
