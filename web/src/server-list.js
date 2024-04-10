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

function normalizeMapName(map) {
  switch(map) {
    case 'chernarusplus':
      return 'Chernarus';
    case 'enoch':
      return 'Livonia';
    case 'takistan':
      return 'Takistan';
    case 'deerisle':
      return 'Deer Isle';
    case 'namalsk':
      return 'Namalsk';
  }
  return map;
}

function notificationIcons(subbed) {
  if(subbed) {
    return '🔔';
  }
  return '🔕';
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
        <th>Map</th>
        <th>Uptime</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>`;

export default class ServerList extends HTMLElement {
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
      const map = document.createElement('td');
      const uptime = document.createElement('td');

      row.className = state[serverId].state;

      watch.innerText = notificationIcons(state[serverId].notifications);
      watch.addEventListener('click', () => {
        let event = 'subscribe';
        if(state[serverId].notifications) {
          event = 'unsubscribe';
        }
        state[serverId].notifications = !state[serverId].notifications;
        watch.innerText = notificationIcons(state[serverId].notifications);
        this.dispatchEvent(new CustomEvent(event, {
          detail: { id: serverId }
        }));
      })

      status.innerText = symbolForStatus(state[serverId].state);
      name.innerText = state[serverId].name;
      region.innerText = state[serverId].region;
      players.innerText = state[serverId].players;
      maxPlayers.innerText = `/${state[serverId].max_players}`;
      map.innerText = normalizeMapName(state[serverId].map);
      uptime.innerText = state[serverId].uptime;

      row.appendChild(watch);
      row.appendChild(status);
      row.appendChild(region);
      row.appendChild(name);
      row.appendChild(players);
      row.appendChild(maxPlayers);
      row.appendChild(map);
      row.appendChild(uptime);

      this._tbody.appendChild(row);
    }
  }

  connectedCallback() {
    this.render(null);
  }
}

