import ConnectionMonitor from './connection-monitor';
import Monitor from './monitor';
import NotificationToggle from './notification-toggle';
import NotificationsBar from './notifications-bar';
import ServerList from './server-list';
import Settings from './settings';
import SubscriptionNotifier from './notifier';
import createDarkMode from './dark-mode';
import filteredState from './filter';
import stateSorted from './sort';

customElements.define('connection-monitor', ConnectionMonitor);
customElements.define('notification-toggle', NotificationToggle);
customElements.define('notifications-bar', NotificationsBar);
customElements.define('server-list', ServerList);

(() => {
  const serverList = document.querySelector('server-list');
  const connectionMonitor = document.querySelector('connection-monitor');
  const notificationToggle = document.querySelector('notification-toggle');

  const notifier = new SubscriptionNotifier(
    Settings.getNotificationsEnabled(),
    Settings.getSubscriptions()
  );

  const monitor = new Monitor(
    process.env.SERVERS_JSON_URL || 'wss://vigrid.velvetcache.org/servers.json',
    process.env.WEBSOCKET_URL || 'wss://vigrid.velvetcache.org/ws'
  );

  let sortField = 'state';
  let sortDirection = 'asc';

  let filters = {};

  // Merge our notifications flags into server state for rendering
  const stateWithNotifications = (state) => {
    return Object.fromEntries(Object.entries(state).map(([id, server]) => {
      server.notifications = notifier.subscriptions.includes(server.id);
      return [id, server];
    }));
  }

  const updateServerList = () => {
    const sortedState = stateSorted(stateWithNotifications(monitor.state), sortField, sortDirection);
    const filtered = filteredState(sortedState, filters);
    serverList.render(filtered, sortedState.length - filtered.length);
  }

  monitor.addEventListener('state-update', () => {
    updateServerList();
    connectionMonitor.lastUpdate = Date.now();
  });

  monitor.addEventListener('server-restart', (evt) => {
    notifier.serverRestartHandler(evt.detail.id, evt.detail.name);
  });

  monitor.addEventListener('heartbeat', () => {
    connectionMonitor.lastUpdate = Date.now();
  });

  monitor.addEventListener('connected', () => {
    connectionMonitor.connected();
  });

  monitor.addEventListener('disconnected', () => {
    connectionMonitor.disconnected();
  });

  monitor.addEventListener('reconnecting', () => {
    connectionMonitor.reconnecting();
  });

  monitor.addEventListener('reconnected', () => {
    connectionMonitor.reconnected();
  });

  monitor.addEventListener('error', () => {
    connectionMonitor.disconnected();
  });

  serverList.addEventListener('subscribe', (evt) => {
    notifier.subscribe(evt.detail.id);
    Settings.setSubscriptions(notifier.subscriptions);
  });

  serverList.addEventListener('unsubscribe', (evt) => {
    notifier.unsubscribe(evt.detail.id);
    Settings.setSubscriptions(notifier.subscriptions);
  });

  serverList.addEventListener('sort', (evt) => {
    sortField = evt.detail.field;
    sortDirection = evt.detail.direction;
    updateServerList();
  });

  serverList.addEventListener('filter', (evt) => {
    if(evt.detail.value === "") {
      delete filters[evt.detail.name];
    } else {
      filters[evt.detail.name] = evt.detail.value;
    }
    updateServerList();
  });

  notificationToggle.state = Settings.getNotificationsEnabled();

  notificationToggle.addEventListener('toggle', (evt) => {
    if(evt.detail) {
      notifier.enable();
    } else {
      notifier.disable();
    }
    Settings.setNotificationsEnabled(evt.detail);
  });

  createDarkMode();
})();
