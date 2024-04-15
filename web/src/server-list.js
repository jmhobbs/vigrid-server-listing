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

function getSortFn(col, sortOrder) {
  if (sortOrder === 'asc') return (a, b) => a[col] > b[col] ? 1 : -1;
  return (a, b) => b[col] > a[col] ? 1 : -1;
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
  </style>
  <table class="server-list">
    <thead>
      <tr>
        <th></th>
        <th>Status</th>
        <th id='region-header'>Region ▼</th>
        <th id='name-header'>Name ▼</th>
        <th id='party_size-header'>▼</th>
        <th id='type-header'>▼</th>
        <th id='map-header'>▼</th>
        <th id='players-header' colspan="2">Players ▼</th>
        <th>Uptime</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>`;

export default class ServerList extends HTMLElement {
  _sortCol = 'idNum'
  _sortOrder = 'asc'

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._tbody = this._shadowRoot.querySelector('.server-list tbody');
  }

  render(unsortedState) {
    const state = this.sortBy(unsortedState, this._sortCol);

    this._tbody.innerHTML = '';

    const sortableColumns = ['region', 'name', 'party_size', 'type', 'map', 'players'];

    const resetAllSortOrders = () => {
      sortableColumns.forEach(colName => {
        const headerElem = this._shadowRoot.querySelector(`#${colName}-header`);
        const currentText = headerElem.innerText;
        if (currentText.includes('▲')) headerElem.innerText = currentText.replace('▲', '▼')
      });
    }

    sortableColumns.forEach(colName => {
      const headerElem = this._shadowRoot.querySelector(`#${colName}-header`);

      //clone the elem to remove previous click listener
      const newElem = headerElem.cloneNode(true);

      newElem.addEventListener('click', () => {
        const currentText = newElem.innerText;
        resetAllSortOrders();

        if (currentText.includes('▼')) {
          newElem.innerText = currentText.replace('▼', '▲');
        } else {
          newElem.innerText = currentText.replace('▲', '▼');
        }

        const sortCol = colName === 'name' ? 'idNum' : colName;

        
        if (this._sortCol === sortCol && this._sortOrder === 'asc') {
          this._sortOrder = 'desc';
        } else {
          this._sortOrder = 'asc';
          this._sortCol = sortCol;
        }

        const newState = this.sortBy(state);
        this.render(newState);
      });

      headerElem.parentNode.replaceChild(newElem, headerElem);
    })

    if (state.length === 0) {
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
      const region = document.createElement('td');
      const name = document.createElement('td');
      const partySize = document.createElement('td');
      const type = document.createElement('td');
      const map = document.createElement('td');
      const players = document.createElement('td');
      const maxPlayers = document.createElement('td');
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
      region.innerText = state[serverId].region;
      name.innerText = buildName(state[serverId]);
      partySize.innerText = partySizeToString(state[serverId].party_size);
      type.innerText = state[serverId].type;
      players.innerText = state[serverId].players;
      maxPlayers.innerText = `/${state[serverId].max_players}`;
      map.innerText = normalizeMapName(state[serverId].map);

      if(state[serverId].uptime_minutes) {
        // format into time string
        let hours = Math.floor(state[serverId].uptime_minutes / 60);
        let minutes = state[serverId].uptime_minutes % 60;
        if(hours > 0) {
          uptime.innerText = `${hours}h ${minutes}m`;
        } else {
          uptime.innerText = `${minutes}m`;
        }
      } else {
        uptime.innerText = state[serverId].uptime;
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
  }

  sortBy(state) {
    const newState = state.sort(getSortFn(this._sortCol, this._sortOrder));
    return newState;
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
