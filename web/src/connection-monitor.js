const template = document.createElement('template');

template.innerHTML = `
  <div></div>
`;

// A UI element to show the connection state of the server monitor.
// It should be updated when new messages arrive via lastUpdate, or
// when the transport explicitly connects or disconnects with the
// connected/disconnected methods.
export default class ConnectionMonitor extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this.state = this._shadowRoot.querySelector('div');
    this._lastUpdate = 0;
    this._reconnecting = false;
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

  reconnecting() {
    this._reconnecting = true;
  }

  reconnected() {
    this._reconnecting = false;
  }

  set lastUpdate(value) {
    this._lastUpdate = value;
    this.render();
  }

  render() {
    if(this._reconnecting) {
      this.state.innerText = '🟡 Reconnecting';
      return;
    }

    const diff = Date.now() - this._lastUpdate;
    if(diff > 15000) {
      this.state.innerText = '🔴 Disconnected';
    } else {
      this.state.innerText = '🟢 Connected';
    }
  }
}

