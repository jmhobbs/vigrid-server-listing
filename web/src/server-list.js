function symbolForStatus(status) {
  let symbol = '❓';
  switch (status) {
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
  switch (map) {
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
  if (subbed) {
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
    tr {
      background-color: #282828;
    }
    tr.open {
      color: black;
      background-color: lightgreen;
      }
    tr.locked {
      color: black;
      background-color: lightcoral;
      }
    tr.offline {
      background-color: gray;
    }
    tr.full {
      background-color: lightgoldenrodyellow;
    }
    .select-styled {
      cursor: pointer;
      display: inline-block;
      position: relative;
      font-size: 16px;
      background-color: #444;
      color: #ddd;
      border: 0;
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

const columns = [
  { colName: 'watch', sortable: false, filterable: false },
  { colName: 'status', sortable: false, filterable: false },
  { colName: 'region', sortable: true, filterable: true },
  { colName: 'name', sortable: true, filterable: false },
  { colName: 'party_size', sortable: true, filterable: true },
  { colName: 'type', sortable: true, filterable: true },
  { colName: 'map', sortable: true, filterable: true },
  { colName: 'players', sortable: true, filterable: false },
  { colName: 'max_players', sortable: false, filterable: false },
  { colName: 'uptime', sortable: false, filterable: false },
];

const sortableColumns = columns.filter(col => col.sortable === true).map(col => col.colName);

export default class ServerList extends HTMLElement {
  _sortCol = 'idNum'
  _sortOrder = 'asc'
  _filters = []

  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this._tbody = this._shadowRoot.querySelector('.server-list tbody');

    columns.filter(col => col.filterable).forEach(column => {
      this._filters.push({ col: column.colName, val: '' })
    })
  }

  render(unfilteredState) {
    const filteredState = this.filterData(unfilteredState);
    const state = this.sortBy(filteredState, this._sortCol);

    this._tbody.innerHTML = '';

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

    const filterRow = document.createElement('tr');
    columns.forEach(column => {
      const filterContainer = document.createElement('td');

      if (column.filterable === false) {
        filterRow.appendChild(filterContainer);
        return;
      }

      const select = document.createElement('select');
      select.classList.add('select-styled');
      select.appendChild(document.createElement('option'));
      select.value = this._filters.filter(f => f.col === column.colName)[0].val;

      const allColumnValues = unfilteredState.map(s => s[column.colName]);
      const uniqueColumnValues = [...new Set(allColumnValues)];

      uniqueColumnValues.forEach(filterableValue => {
        const option = document.createElement('option');
        option.innerText = filterableValue;
        if (this._filters.filter(f => f.col === column.colName)[0].val === filterableValue.toString()) {
          option.selected = 'selected';
        }
        select.appendChild(option);
      });

      select.addEventListener('change', () => {
        this.addFilter({ col: column.colName, val: select.value });
        this.render(unfilteredState);
      });

      filterContainer.appendChild(select);
      filterRow.appendChild(filterContainer);
    });
    this._tbody.appendChild(filterRow);

    if (state.length === 0) {
      const row = document.createElement('tr');
      const loading = document.createElement('td');

      if (unfilteredState.length > 0) {
        loading.innerText = 'No servers found. Try widening your criteria.'
      } else {
        loading.innerText = 'Loading...';
      }

      loading.setAttribute('colspan', columns.length);
      row.appendChild(loading);
      this._tbody.appendChild(row);
      return;
    }

    // flush it and re-build
    for (let serverId in state) {
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
        if (state[serverId].notifications) {
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

      if (state[serverId].uptime_minutes) {
        // format into time string
        let hours = Math.floor(state[serverId].uptime_minutes / 60);
        let minutes = state[serverId].uptime_minutes % 60;
        if (hours > 0) {
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

  addFilter(newFilter) {
    const existingFilterForCol = this._filters.map(f => f.col).indexOf(newFilter.col)
    if (existingFilterForCol !== -1) {
      this._filters.splice(existingFilterForCol, 1);
    }

    this._filters.push({ col: newFilter.col, val: newFilter.val });
  }

  filterData(state) {
    let filteredState = state;
    this._filters.forEach(f => {
      console.log(f, filteredState.map(s => s[f.col]))
      if (f.val === '') return;

      filteredState = filteredState.filter(s => s[f.col].toString() === f.val);
    });
    return filteredState;
  }

  connectedCallback() {
    this.render([]);
  }
}

function buildName(server) {
  return `BattleRoyale #${server.id}`
}

function partySizeToString(size) {
  switch (size) {
    case 1:
      return 'Solo';
    case 2:
      return 'Duo';
    case 3:
      return 'Trio';
  }
  return size;
}
