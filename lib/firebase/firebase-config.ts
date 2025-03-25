"use client";

import { initializeApp } from 'firebase/app';
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  type Messaging,
  type MessagePayload
} from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp: any;
let messagingInstance: Messaging | null = null;

/**
 * Validate Firebase configuration
 */
const validateFirebaseConfig = (): boolean => {
  const requiredKeys = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.error(`Firebase configuration missing required keys: ${missingKeys.join(', ')}`);
    return false;
  }
  
  // Check VAPID key separately as it's needed for web push but not in firebaseConfig
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    console.error('NEXT_PUBLIC_FIREBASE_VAPID_KEY environment variable is missing');
    return false;
  }
  
  return true;
};

/**
 * Initialize Firebase app and messaging
 */
const initializeFirebaseApp = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Validate configuration first
    if (!validateFirebaseConfig()) {
      console.error('Firebase configuration validation failed');
      return null;
    }
    
    if (!firebaseApp) {
      // Initialize the app if it hasn't been initialized yet
      firebaseApp = initializeApp(firebaseConfig);
    }
    
    // Check if browser supports Firebase messaging
    if ('serviceWorker' in navigator && !messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }
    
    return firebaseApp;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// Initialize Firebase only on client side
if (typeof window !== 'undefined') {
  initializeFirebaseApp();
}

/**
 * Register the service worker for Firebase messaging
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service worker registered successfully:', registration);
    
    // Pass Firebase config to service worker
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: firebaseConfig
      });
    }
    
    return registration;
  } catch (error) {
    console.error('Service worker registration failed:', error);
    return null;
  }
};

/**
 * Request FCM permissions and get FCM token
 */
export const requestFCMPermission = async (): Promise<string | null> => {
  // Initialize Firebase if not already initialized
  initializeFirebaseApp();
  
  if (!messagingInstance) {
    console.log('Firebase messaging is not supported or not initialized');
    return null;
  }

  try {
    // Check if VAPID key is set
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.error('VAPID key is not set. Please set NEXT_PUBLIC_FIREBASE_VAPID_KEY');
      return null;
    }

    // Register service worker if needed
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('Failed to register service worker');
      return null;
    }
    
    // Check notification permission
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }
    }
    
    try {
      // Get registration token with detailed error handling
      const currentToken = await getToken(messagingInstance, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        console.log('FCM token received:', currentToken);
        return currentToken;
      } else {
        console.log('No FCM token available');
        return null;
      }
    } catch (tokenError) {
      console.error('Detailed token error:', tokenError);
      
      // Check if using Brave browser (common issue)
      const isBrave = 
        // Use safer type checking for the brave property
        (typeof navigator !== 'undefined' && 
        'brave' in navigator && 
        (navigator as any).brave !== undefined) || 
        (navigator.userAgent.includes("Chrome") && 
        navigator.userAgent.includes("Safari") && 
        !navigator.userAgent.includes("Edg") && 
        !navigator.userAgent.includes("OPR"));
      
      if (isBrave) {
        console.warn("You appear to be using Brave browser. Please enable Google services for push messaging in brave://settings/privacy");
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const onMessageListener = (): Promise<MessagePayload | null> => {
  // Initialize Firebase if not already initialized
  initializeFirebaseApp();

  return new Promise<MessagePayload | null>((resolve) => {
    if (!messagingInstance) {
      console.log('Firebase messaging is not supported or not initialized');
      resolve(null);
      return;
    }

    onMessage(messagingInstance, (payload) => {
      console.log('Message received in foreground:', payload);
      resolve(payload);
    });
  });
};

export { firebaseApp, firebaseConfig }; 