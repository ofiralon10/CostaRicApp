importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAs9TP-TpsfC2PtdhzG6ELea-v_W8TTDGo',
  authDomain: 'costaricapp-2026.firebaseapp.com',
  projectId: 'costaricapp-2026',
  storageBucket: 'costaricapp-2026.firebasestorage.app',
  messagingSenderId: '1005193058269',
  appId: '1:1005193058269:web:99703b084a0538e89b4834',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Costa Rica 2026 🌴';
  const options = {
    body: payload.notification?.body || '',
    icon: '/images/icon-192.png',
    badge: '/images/icon-192.png',
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});
