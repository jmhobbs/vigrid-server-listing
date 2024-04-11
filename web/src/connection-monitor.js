const template = document.createElement('template');

template.innerHTML = `
  <div></div>
`;

export default class ConnectionMonitor extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this.state = this._shadowRoot.querySelector('div');
    this._lastUpdate = 0;
  }

  connectedCallback() {
    this.render();
    setInterval(() => { this.render(); }, 1000);
  }

  connected() {
    this.lastUpdate = Date.now();
  }

  disconnected() {
    this.lastUpdate = 0;
  }

  set lastUpdate(value) {
    this._lastUpdate = value;
    this.render();
  }

  render() {
    const diff = Date.now() - this._lastUpdate;
    if(diff > 30000) {
      this.state.innerText = '🔴 Disconnected';
    } else if (diff > 15000) {
      this.state.innerText = '🟠 Reconnecting';
    } else {
      this.state.innerText = '🟢 Connected';
    }
  }
}

