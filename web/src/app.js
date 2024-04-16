import NotificationsBar from './notifications-bar';
import ServerList from './server-list';
import Monitor from './monitor';
import SubscriptionNotifier from './notifier';
import ConnectionMonitor from './connection-monitor';
import Settings from './settings';
import createDarkMode from './dark-mode';
import stateSorted from './sort';

customElements.define('notifications-bar', NotificationsBar);
customElements.define('server-list', ServerList);
customElements.define('connection-monitor', ConnectionMonitor);

(() => {
  const serverList = document.querySelector('server-list');
  const connectionMonitor = document.querySelector('connection-monitor');

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

  // Merge our notifications flags into server state for rendering
  const stateWithNotifications = (state) => {
    return Object.fromEntries(Object.entries(state).map(([id, server]) => {
      server.notifications = notifier.subscriptions.includes(server.id);
      return [id, server];
    }));
  }

  monitor.addEventListener('state-update', (evt) => {
    serverList.render(stateSorted(stateWithNotifications(evt.detail), sortField, sortDirection));
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
    serverList.render(stateSorted(stateWithNotifications(monitor.state), sortField, sortDirection));
  });

  createDarkMode();
})();
