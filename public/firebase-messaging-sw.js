// Firebase Cloud Messaging Service Worker for Firebase 11.5.0

// Import and configure the Firebase SDK
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.5.0/firebase-messaging-compat.js');

// Log service worker activation and version for debugging
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
});

// Default configuration - will be overridden by message from main thread
let firebaseConfig = {
  apiKey: "AIzaSyDWq3cRuxSuCAJmRQjOcch9BJLPlWtB-TI",
  authDomain: "proof-fe76f.firebaseapp.com",
  projectId: "proof-fe76f",
  storageBucket: "proof-fe76f.firebasestorage.app",
  messagingSenderId: "314325458638",
  appId: "1:314325458638:web:3f0174add5808f4ef63a9f",
  measurementId: "G-FZ31JCNZBL"
};

// Flag to track if Firebase has been initialized
let isFirebaseInitialized = false;

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    console.log('[firebase-messaging-sw.js] Received Firebase config:', event.data.config);
    
    // Update the Firebase config
    firebaseConfig = event.data.config;
    
    // Initialize Firebase if not already initialized
    if (!isFirebaseInitialized) {
      initializeFirebase();
    }
  }
});

// Function to initialize Firebase
function initializeFirebase() {
  if (isFirebaseInitialized) return;
  
  try {
    // Log config for debugging (sanitized)
    console.log('[firebase-messaging-sw.js] Initializing with config containing:', 
      Object.keys(firebaseConfig).join(', '));

    firebase.initializeApp(firebaseConfig);
    isFirebaseInitialized = true;
    
    // Initialize messaging after app is initialized
    const messaging = firebase.messaging();
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message:', payload);
      
      // Customize notification here
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/icons/logo-192.png',
        badge: '/icons/badge-96.png',
        data: payload.data,
        // Tag to group similar notifications, using queryId if available
        tag: payload.data?.queryId ? `query-${payload.data.queryId}` : 'general',
        // Use silent notification for system notifications
        silent: payload.data?.type === 'system'
      };
      
      // Show notification
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
    
    console.log('[firebase-messaging-sw.js] Firebase initialized successfully');
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Firebase initialization error:', error);
  }
}

// Initialize Firebase with default config immediately
// This will be overridden if a message with the config is received
initializeFirebase();

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked', event);
  
  // Close the notification
  event.notification.close();
  
  // Extract data from notification
  const queryId = event.notification.data?.queryId;
  const messageId = event.notification.data?.messageId;
  const type = event.notification.data?.type;
  
  // Determine which URL to navigate to
  let url = '/';
  
  if (queryId) {
    url = `/donor-queries/${queryId}`;
    if (type === 'new_message' && messageId) {
      url += `?messageId=${messageId}`;
    }
  } else if (type === 'new_query') {
    url = '/general-queries';
  }
  
  // This will open the app and navigate to the appropriate page
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
}); 