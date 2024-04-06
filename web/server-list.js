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
  </style>
  <table class="server-list">
    <thead>
      <tr>
        <th></th>
        <th>Status</th>
        <th>Region</th>
        <th>Name</th>
        <th>Players</th>
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
        const uptime = document.createElement('td');

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
        uptime.innerText = state[serverId].uptime;

        row.appendChild(watch);
        row.appendChild(status);
        row.appendChild(region);
        row.appendChild(name);
        row.appendChild(players);
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
