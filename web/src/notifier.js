export default class SubscriptionNotifier extends EventTarget {
  constructor(enabled, subscriptions) {
    super();
    this.enabled = enabled;
    this.subscriptions = new Set(subscriptions);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  subscribe(id) {
    this.subscriptions.add(id);
  }

  unsubscribe(id) {
    this.subscriptions.delete(id);
  }

  serverRestartHandler(id, name) {
    if(this.enabled && this.subscriptions.has(data.id)) {
      new Notification(`Server ${id} Restarted`, {
        body: `${name} is back online!`
      });
    }
  }

  // Merge our notifications flags into server state for rendering
  mergeState(state) {
    return Object.fromEntries(Object.entries(state).map(([id, server]) => {
      server.notifications = this.subscriptions.has(server.id);
      return [id, server];
    }));
  }
}
