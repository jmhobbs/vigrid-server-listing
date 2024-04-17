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

const presentationForField = {
  state: symbolForStatus,
  map: normalizeMapName,
  party_size: partySizeToString,
};

function notificationIcons(subbed) {
  if(subbed) {
    return '🔔';
  }
  return '🔕';
}

const template = document.createElement('template');

template.innerHTML = `
  <style>
    .server-list {
      margin: auto;
      text-align: center;
      color: black;
    }
    .server-list tr :first-child {
        cursor: pointer;
    }
    table {
      border-collapse: collapse;
    }
    td, th {
      padding: 0.5em 1em;
      text-align: left;
    }
    th {
      background: black;
      color: white;
      text-align: left;
    }
    tbody tr :first-child, tbody tr :nth-child(2) {
      text-align: center;
    }
    tbody tr :nth-child(8) {
     text-align: right;
     padding-right: 0;
    }
    tbody tr :nth-child(9) {
      padding-left: 0;
    }
    tbody tr :nth-child(10) {
      text-align: right;
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
    th.sortable {
      cursor: pointer;
    }
    th.sortable::after {
      content: ' ●';'
    }
    th.sortable.asc::after {
      content: ' ▲';
    }
    th.sortable.desc::after {
      content: ' ▼';
    }
    tr.hidden-count td, tr.loading td {
      background: #ccc;
      cursor: default !important;
    }
  </style>
  <table class="server-list">
    <thead>
      <tr>
        <th></th>
        <th class="sortable asc" data-sort="state">Status</th>
        <th class="sortable" data-sort="region">Region</th>
        <th class="sortable" data-sort="name"'>Name</th>
        <th class="sortable" data-sort="party_size">Party Size</th>
        <th class="sortable" data-sort="type">Modded</th>
        <th class="sortable" data-sort="map">Map</th>
        <th class="sortable" data-sort="players" colspan="2">Players</th>
        <th>Uptime</th>
      </tr>
      <tr class="filters">
        <th></th>
        <th><select name="state"><option value="">---</option></select></th>
        <th><select name="region"><option value="">---</option></select></th>
        <th></th>
        <th><select name="party_size"><option value="">---</option></select></th>
        <th><select name="type"><option value="">---</option></select></th>
        <th><select name="map"><option value="">---</option></select></th>
        <th colspan="2"></th>
        <th></th>
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

    this._sortables = this._shadowRoot.querySelectorAll('thead th.sortable');
    this._sortables.forEach(sortable => {
      let direction = 'none';

      sortable.addEventListener('click', () => {
        if(sortable.classList.contains('asc')) {
          sortable.classList.remove('asc');
          sortable.classList.add('desc');
          direction = 'desc';
        } else if(sortable.classList.contains('desc')) {
          sortable.classList.remove('desc');
          direction = 'none';
        }
        else {
          this._sortables.forEach(sortable => {
            sortable.classList.remove('asc');
            sortable.classList.remove('desc');
          });
          sortable.classList.add('asc');
          direction = 'asc';
        }
        this.dispatchEvent(new CustomEvent('sort', {
          detail: { direction, field: sortable.dataset.sort }
        }));
      });
    });

    this.filterables = {};
    this._shadowRoot.querySelectorAll('th select').forEach((select) => {
      this.filterables[select.name] = new Set();
      select.addEventListener('change', () => {
        this.dispatchEvent(new CustomEvent('filter', { detail: { name: select.name, value: select.value } }));
      });
    });
  }

  updateFilterables(state) {
    this._shadowRoot.querySelectorAll('th select').forEach((select) => {
      const newFilterables = new Set();
      state.forEach((server) => {
        newFilterables.add(server[select.name]);
      });

      const newValues = newFilterables.difference(this.filterables[select.name]);
      if(newValues.size > 0 ){
        this.filterables[select.name] = this.filterables[select.name].union(newValues);
        newValues.values().forEach((value) => {
          const option = document.createElement('option');
          option.innerText = presentationForField[select.name] ? presentationForField[select.name](value) : value;
          option.value = value;
          select.appendChild(option);
        });
      }
    });
  }

  render(state, filteredCount) {
    this.updateFilterables(state);

    this._tbody.innerHTML = '';

    if (state.length === 0 && filteredCount === 0) {
      const row = document.createElement('tr');
      const loading = document.createElement('td');
      loading.innerText = 'Loading...';
      loading.setAttribute('colspan', 10);
      row.appendChild(loading);
      row.className = 'loading';
      this._tbody.appendChild(row);
      return;
    }

    // flush it and re-build
    for(var i = 0; i < state.length; i++) {
      const server = state[i];

      const row = document.createElement('tr');
      const watch = document.createElement('td');
      const status = document.createElement('td');
      const region = document.createElement('td');
      const name = document.createElement('td');
      const partySize = document.createElement('td');
      const type = document.createElement('td');
      const map = document.createElement('td');
      const players = document.createElement('td');
      const maxPlayers = document.createElement('td');
      const uptime = document.createElement('td');

      row.className = server.state;

      watch.innerText = notificationIcons(server.notifications);
      watch.addEventListener('click', () => {
        let event = 'subscribe';
        if(server.notifications) {
          event = 'unsubscribe';
        }
        server.notifications = !server.notifications;
        watch.innerText = notificationIcons(server.notifications);
        this.dispatchEvent(new CustomEvent(event, {
          detail: { id: server.id }
        }));
      })

      status.innerText = symbolForStatus(server.state);
      region.innerText = server.region;
      name.innerText = buildName(server);
      partySize.innerText = partySizeToString(server.party_size);
      type.innerText = server.type;
      players.innerText = server.players;
      maxPlayers.innerText = `/${server.max_players}`;
      map.innerText = normalizeMapName(server.map);

      if(server.uptime_minutes) {
        // format into time string
        let hours = Math.floor(server.uptime_minutes / 60);
        let minutes = server.uptime_minutes % 60;
        if(hours > 0) {
          uptime.innerText = `${hours}h ${minutes}m`;
        } else {
          uptime.innerText = `${minutes}m`;
        }
      } else {
        uptime.innerText = server.uptime;
      }

      row.appendChild(watch);
      row.appendChild(status);
      row.appendChild(region);
      row.appendChild(name);
      row.appendChild(partySize);
      row.appendChild(type);
      row.appendChild(map);
      row.appendChild(players);
      row.appendChild(maxPlayers);
      row.appendChild(uptime);

      this._tbody.appendChild(row);
    }

    if(filteredCount > 0) {
      const row = document.createElement('tr');
      const column = document.createElement('td');
      column.innerText = `${filteredCount} Servers Hidden By Filters`;
      column.setAttribute('colspan', 10);
      row.appendChild(column);
      row.classList.add('hidden-count');
      this._tbody.appendChild(row);
    }
  }

  connectedCallback() {
    this.render([]);
  }
}

function buildName(server) {
  return `BattleRoyale #${server.id}`
}

function partySizeToString(size) {
  switch(size) {
    case 1:
      return 'Solo';
    case 2:
      return 'Duo';
    case 3:
      return 'Trio';
  }
  return size;
}
