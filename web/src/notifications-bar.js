const template = document.createElement('template');

template.innerHTML = `
  <style>
    div {
      padding: 20px;
      margin: 10px;
      border: 1px solid black;
    }
    div.granted {
      display: none;
    }
    div.denied {
      background-color: red;
    }
    div.default {
      background-color: yellow;
    }
    button {
      pointer: cursor;
    }
  </style>
  <div></div>
`;

export default class NotificationsBar extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.render(Notification.permission);
  }

  render(permission) {
    this._shadowRoot.querySelector('div').className = permission;
    switch(permission) {
      case 'granted':
        this._shadowRoot.querySelector('div').innerHTML = '';
        break;
      case 'denied':
        this._shadowRoot.querySelector('div').innerHTML = 'Server update notifications are blocked.';
        break;
      case 'default':
        const button = document.createElement('button');
        button.innerText = 'Enable Server Restart Notifications';
        button.addEventListener('click', () => {
          Notification.requestPermission().then((permission) => {
            this.render(permission);
          });
        });
        this._shadowRoot.querySelector('div').appendChild(button);
        break;
    }
  }
}

