// TODO: switch to nchan
export default class Monitor extends EventTarget {
  constructor(serverJsonURL, wsURL) {
    super()

    fetch(`${serverJsonURL.toString()}?_=${Date.now()}`)
      .then((response) => response.json())
      .then((data) => {
        this.state = data.servers;
        this.dispatchEvent(new CustomEvent('state-update', { detail: clone(this.state) }));

        this.ws = new WebSocket(wsURL);
        this.ws.onmessage = (evt) => {
          const data = JSON.parse(evt.data);
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
        };
      });
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
