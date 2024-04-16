const template = document.createElement('template');

template.innerHTML = `
  <style>
div {
  position: relative;
  display: inline-block;
  border-bottom: 1px dotted black;
}

div #time {
  visibility: hidden;
  width: 120px;
  background-color: #444;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px 0;
  font-size: 0.75em;

  position: absolute;
  z-index: 1;
  top: -0.75em;
  left: 107%;
}

div:hover #time {
  visibility: visible;
}

div #time::after {
  content: " ";
  position: absolute;
  top: 50%;
  right: 100%;
  margin-top: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent #444 transparent transparent;
}
  </style>
  <div>
    <span id="status"></span>
    <span id="time">Hello</span>
  </div>
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
    this.state = this._shadowRoot.querySelector('span#status');
    this.time = this._shadowRoot.querySelector('span#time');
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
    this.time.innerText = `Last update at ${new Date(this._lastUpdate).toLocaleTimeString()}`;

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

