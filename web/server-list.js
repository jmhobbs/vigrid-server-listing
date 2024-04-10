(() => {

  function symbolForStatus(status) {
    let symbol = '❓';
    switch(status) {
      case 'open':
        symbol = '🟢';
        break;
      case 'locked':
        symbol = '🔴';
        break;
      case 'offline':
        symbol = '⚫';
        break;
      case 'full':
        symbol = '🟠';
        break;
    }
    return symbol
  }

  const template = document.createElement('template');

  template.innerHTML = `
  <style>
    .server-list tr :first-child {
        cursor: pointer;
    }
    table {
      border-collapse: collapse;
    }
    td, th {
      padding: 0.5em 1em;
    }
    th {
      background: black;
      color: white;
      text-align: left;
    }
    tbody tr :first-child, tbody tr :nth-child(2) {
      text-align: center;
    }
    tbody tr :nth-child(5) {
     text-align: right;
     padding-right: 0;
    }
    tbody tr :nth-child(6) {
      padding-left: 0;
    }
    tr.open {
      background-color: lightgreen;
      }
    tr.locked {
      background-color: lightcoral;
      }
    tr.offline {
      background-color: gray;
    }
    tr.full {
      background-color: lightgoldenrodyellow;
      }
  </style>
  <table class="server-list">
    <thead>
      <tr>
        <th></th>
        <th>Status</th>
        <th>Region</th>
        <th>Name</th>
        <th colspan="2">Players</th>
        <th>Uptime</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>`;

  class ServerList extends HTMLElement {
    constructor() {
      super();
      this._shadowRoot = this.attachShadow({ 'mode': 'open' });
      this._shadowRoot.appendChild(template.content.cloneNode(true));
      this._tbody = this._shadowRoot.querySelector('.server-list tbody');
    }

    render(state) {
      this._tbody.innerHTML = '';

      if(!state) {
        const row = document.createElement('tr');
        const loading = document.createElement('td');
        loading.innerText = 'Loading...';
        loading.setAttribute('colspan', 6);
        row.appendChild(loading);
        this._tbody.appendChild(row);
      }

      // flush it and re-build
      for(let serverId in state) {
        const row = document.createElement('tr');
        const watch = document.createElement('td');
        const status = document.createElement('td');
        const name = document.createElement('td');
        const region = document.createElement('td');
        const players = document.createElement('td');
        const maxPlayers = document.createElement('td');
        const uptime = document.createElement('td');

        row.className = state[serverId].state;

        if(state[serverId].notifications) {
          watch.innerText = '🔔';
        } else {
          watch.innerText = '🔕';
        }
        watch.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent("notify", {
            detail: { id: serverId }
          }));
        })

        status.innerText = symbolForStatus(state[serverId].state);
        name.innerText = state[serverId].name;
        region.innerText = state[serverId].region;
        players.innerText = state[serverId].players;
        maxPlayers.innerText = `/${state[serverId].max_players}`;
        uptime.innerText = state[serverId].uptime;

        row.appendChild(watch);
        row.appendChild(status);
        row.appendChild(region);
        row.appendChild(name);
        row.appendChild(players);
        row.appendChild(maxPlayers);
        row.appendChild(uptime);

        this._tbody.appendChild(row);
      }
    }

    set state(value) {
      this.render(value);
    }

    connectedCallback() {
      this.render(null);
    }
  }

  customElements.define('server-list', ServerList);
})();
