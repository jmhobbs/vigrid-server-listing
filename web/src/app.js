import NotificationsBar from './notifications-bar';
import ServerList from './server-list';
import Monitor from './monitor';
import SubscriptionNotifier from './notifier';
import ConnectionMonitor from './connection-monitor';

customElements.define('notifications-bar', NotificationsBar);
customElements.define('server-list', ServerList);
customElements.define('connection-monitor', ConnectionMonitor);

(() => {
  const serverList = document.querySelector('server-list');
  const connectionMonitor = document.querySelector('connection-monitor');

  const notifier = new SubscriptionNotifier(true, []);

  const monitor = new Monitor(
    '/servers.json',
    "wss://vigrid.velvetcache.org/ws"
  );

  monitor.addEventListener('state-update', (evt) => {
    console.log('state-update');
    serverList.render(notifier.mergeState(evt.detail));
    connectionMonitor.lastUpdate = Date.now();
  });

  monitor.addEventListener('server-restart', (evt) => {
    console.log('server-restart', evt.detail);
    notifier.serverRestartHandler(evt.detail.id, evt.detail.name);
  });

  monitor.addEventListener('heartbeat', (evt) => {
    console.log('heartbeat', evt.detail);
    connectionMonitor.lastUpdate = Date.now();
  });

  serverList.addEventListener('subscribe', (evt) => {
    console.log('subscribe', evt.detail);
    notifier.subscribe(evt.detail.id);
  });

  serverList.addEventListener('unsubscribe', (evt) => {
    console.log('unsubscribe', evt.detail);
    notifier.unsubscribe(evt.detail.id);
  });
})();
