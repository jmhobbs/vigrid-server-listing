export default class SubscriptionNotifier extends EventTarget {
  constructor(enabled, subscriptions) {
    super();
    this.enabled = enabled;
    this._subscriptions = new Set(subscriptions);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  subscribe(id) {
    this._subscriptions.add(id);
  }

  unsubscribe(id) {
    this._subscriptions.delete(id);
  }

  serverRestartHandler(id, name) {
    if(this.enabled && this._subscriptions.has(id)) {
      new Notification(`Server ${id} Restarted`, {
        body: `${name} is back online!`
      });
    }
  }

  get subscriptions() {
    return Array.from(this._subscriptions);
  }
}
