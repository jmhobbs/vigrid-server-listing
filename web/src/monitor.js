import NchanSubscriber from 'nchan';

export default class Monitor extends EventTarget {
  constructor(serverJsonURL, wsURL) {
    super()

    // set up websocket connection
    this.sub = new NchanSubscriber(wsURL, { subscriber: 'websocket' });
    this.sub.on('message', (msg) => {
      const data = JSON.parse(msg);

      if(data.id == 'heartbeat') {
        this.dispatchEvent(new CustomEvent('heartbeat'));
        return
      }
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
    });

    this.sub.on('connect', () => {
      console.log('connected');
      this.dispatchEvent(new CustomEvent('connected'));
    });

    this.sub.on('disconnect', () => {
      console.log('disconnected');
      this.dispatchEvent(new CustomEvent('disconnected'));
    });

    this.sub.on('error', (err, desc) => {
      console.error(err, desc);
      this.dispatchEvent(new CustomEvent('error', { detail: { err, desc } }));
    });

    // TODO: on reconnect, and periodically, resync state with servers.json

    fetch(`${serverJsonURL.toString()}?_=${Date.now()}`)
      .then((response) => response.json())
      .then((data) => {
        this.state = data.servers;
        this.dispatchEvent(new CustomEvent('state-update', { detail: clone(this.state) }));

        // start consuming over websocket
        this.sub.start();
      });
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
