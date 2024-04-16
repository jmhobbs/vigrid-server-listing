const template = document.createElement('template');

template.innerHTML = `
  <style>
    label {
      border: 1px solid #ccc;
      border-radius: 5px;
      padding: 5px 10px;
      position: relative;
    }
    label { 
      cursor: pointer;
      color: #444;
    }
    label.enabled {
      background: lightgreen;
    }
    label.disabled {
      background: lightcoral;
    }
    input { display: none; }
  </style>
  <label>
    <input type="checkbox" checked />
    <span>✅ Notifications Enabled</span>
  </label>
`;

export default class NotificationToggle extends HTMLElement {
  constructor() {
    super();

    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
    this.checkbox = this._shadowRoot.querySelector('input');
    this.label = this._shadowRoot.querySelector('label');
    this.span = this._shadowRoot.querySelector('span');
  }

  connectedCallback() {
    this.checkbox.addEventListener('change', () => {
      this.updateClass();
      this.dispatchEvent(new CustomEvent('toggle', { detail: this.checkbox.checked }));
    });
  }

  set state(value) {
    this.checkbox.checked = value;
    this.updateClass();
  }

  updateClass() {
    if(this.checkbox.checked) {
      this.label.classList.add('enabled');
      this.label.classList.remove('disabled');
      this.span.innerText = '✅ Notifications Enabled';
    } else {
      this.label.classList.add('disabled');
      this.label.classList.remove('enabled');
      this.span.innerText = '❌ Notifications Disabled';
    }
  }
}

