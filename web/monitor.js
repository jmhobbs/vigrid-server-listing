// TODO: split this off from acutal ui updates, and notification tracking, just do server state
// TODO: use nchan package
class Monitor {
  constructor(serverList, serverJsonURL, wsURL) {
    this.serverList = serverList;
    this.serverList.addEventListener('notify', this.onNotifyToggle.bind(this));

    this.notifications = new Set();

    fetch(serverJsonURL)
      .then((response) => response.json())
      .then((data) => {
        this.state = data.servers;
        this.updateUI();

        this.ws = new WebSocket(wsURL);
        this.ws.onmessage = (evt) => {
          const data = JSON.parse(evt.data);
          if(data.players) {
            this.state[data.id].players = data.players;
          }
          if(data.uptime) {
            this.state[data.id].uptime = data.uptime;
          }
          if(data.state) {
            if(this.state[data.id].state !== 'open' && data.state === 'open') {
              if(this.notifications.has(data.id)) {
                new Notification('Server Restarted', {
                  body: `${this.state[data.id].name} is back online!`
                });
              }
            }
            this.state[data.id].state = data.state;
          }
          this.updateUI();
        };
      });
  }

  updateUI() {
    this.serverList.state = Object.fromEntries(Object.entries(this.state).map(([id, server]) => {
      server.notifications = this.notifications.has(server.id);
      return [id, server];
    }));
  }

  onNotifyToggle(evt) {
    if(this.notifications.has(evt.detail.id)) {
      this.notifications.delete(evt.detail.id);
    } else {
      this.notifications.add(evt.detail.id);
    }
    this.updateUI();
  }
}

