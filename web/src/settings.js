const Settings = {
  getSubscriptions:() => {
    return JSON.parse(localStorage.getItem('subscriptions') || '[]');
  },

  setSubscriptions: (value) => {
    localStorage.setItem('subscriptions', JSON.stringify(value));
  },

  getNotificationsEnabled: () =>  {
    return localStorage.getItem('notificationsEnabled') !== 'false';
  },

  setNotificationsEnabled: (value) => {
    localStorage.setItem('notificationsEnabled', value);
  }
}

export default Settings;
