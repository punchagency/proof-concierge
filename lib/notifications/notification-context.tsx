"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import socketService, {
  Notification,
  NotificationType,
} from "@/lib/websocket/socket-service";
import {
  requestFCMPermission,
  onMessageListener,
  registerServiceWorker,
} from "@/lib/firebase/firebase-config";
import { updateUserFCMToken } from "@/lib/api/users";
import { blueToast } from "@/lib/utils";

// Notification context types
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: () => void;
  hasWebSocketConnection: boolean;
  hasFCMPermission: boolean;
  fcmToken: string | null;
  requestPermission: () => Promise<string | null>;
}

// Create the context
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  hasWebSocketConnection: false,
  hasFCMPermission: false,
  fcmToken: null,
  requestPermission: async () => null,
});

// Maximum notifications to keep in the state
const MAX_NOTIFICATIONS = 50;

// Provider props
interface NotificationProviderProps {
  children: ReactNode;
}

// Notification Provider component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasWebSocketConnection, setHasWebSocketConnection] = useState(false);
  const [hasFCMPermission, setHasFCMPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  const [fcmSupported, setFcmSupported] = useState<boolean>(false);

  // Check if Firebase is supported in the browser
  useEffect(() => {
    const isBrowser = typeof window !== "undefined";
    const hasServiceWorker = isBrowser && "serviceWorker" in navigator;
    const hasNotification = isBrowser && "Notification" in window;

    setFcmSupported(hasServiceWorker && hasNotification);
  }, []);

  // Initialize WebSocket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Connect to the WebSocket server
    const socket = socketService.connect(token);
    setHasWebSocketConnection(socketService.isConnected());

    // Set up notification event listeners
    const notificationTypes: NotificationType[] = [
      "queryStatusChanged",
      "newQuery",
      "newMessage",
      "queryTransferred",
      "queryAssigned",
      "callRequested",
      "callStatusChanged",
    ];

    // Create a map to store cleanup functions
    const cleanupFunctions = notificationTypes.map((type) => {
      return socketService.on(type, (data) => handleNotification(type, data));
    });

    // Handle notification
    function handleNotification(type: NotificationType, data: any) {
      const newNotification: Notification = {
        type,
        ...data,
        timestamp: new Date().toISOString(),
      };

      // Update notifications list and unread count
      setNotifications((prev) => {
        const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
        return updated;
      });

      setUnreadCount((prev) => prev + 1);

      // Show toast notification based on type
      showNotificationToast(type, data);
    }

    // Cleanup on unmount
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
      socketService.disconnect();
      setHasWebSocketConnection(false);
    };
  }, [isAuthenticated, token]);

  // Initialize Firebase Cloud Messaging
  useEffect(() => {
    if (!isAuthenticated || !user || !fcmSupported) return;

    // Request notification permission
    const initFCM = async () => {
      try {
        // Register the service worker first - this will also send the Firebase config
        if ("serviceWorker" in navigator) {
          try {
            await registerServiceWorker();
          } catch (err) {
            console.error("Service worker registration failed:", err);
          }
        }

        const token = await requestFCMPermission();
        if (token) {
          setFcmToken(token);
          setHasFCMPermission(true);

          // Send the token to the backend
          const success = await updateUserFCMToken(token);
          if (success) {
            console.log("FCM token updated successfully");
          } else {
            console.warn("Failed to update FCM token on the server");
          }
        }
      } catch (error) {
        console.error("Error initializing FCM:", error);
      }
    };

    initFCM();

    // Set up Firebase message listener for foreground messages
    const setupMessageListener = async () => {
      try {
        const payload = await onMessageListener();
        if (payload) {
          console.log("Received FCM message:", payload);

          // Extract notification data
          const notificationData = payload.notification;
          const data = payload.data;

          // Determine notification type
          let type: NotificationType = "newMessage";
          if (data?.type === "query_status_changed")
            type = "queryStatusChanged";
          if (data?.type === "new_query") type = "newQuery";
          if (data?.type === "query_transferred") type = "queryTransferred";
          if (data?.type === "query_assigned") type = "queryAssigned";
          if (data?.type === "call_requested") type = "callRequested";
          if (data?.type === "call_status_changed") type = "callStatusChanged";

          // Create notification object
          const newNotification: Notification = {
            type,
            queryId: data?.queryId
              ? parseInt(data.queryId as string)
              : undefined,
            messageId: data?.messageId
              ? parseInt(data.messageId as string)
              : undefined,
            content: notificationData?.body,
            sender: data?.sender as string,
            timestamp: new Date().toISOString(),
            data: data,
          };

          // Update notifications list and unread count
          setNotifications((prev) => {
            const updated = [newNotification, ...prev].slice(
              0,
              MAX_NOTIFICATIONS
            );
            return updated;
          });

          setUnreadCount((prev) => prev + 1);

          // Show toast notification
          showNotificationToast(type, data);

          // Setup another listener for the next message
          setupMessageListener();
        }
      } catch (error) {
        console.error("Error in FCM message listener:", error);
      }
    };

    // Start listening for messages if FCM is supported
    if (fcmSupported) {
      setupMessageListener();
    }

    // No cleanup needed since we're handling it in the recursive function
  }, [isAuthenticated, user, router, fcmSupported]);

  // Show toast notification based on type
  const showNotificationToast = (type: NotificationType, data: any) => {
    switch (type) {
      case "newMessage":
        blueToast(
          "New Message",
          {
            description: `${data.sender || "Someone"} sent a new message`,
            action: data.queryId
              ? {
                  label: "View",
                  onClick: () => router.push(`/donor-queries/${data.queryId}`),
                }
              : undefined,
          },
          "info"
        );
        break;

      case "queryStatusChanged":
        blueToast(
          "Query Status Changed",
          {
            description: `Query #${data.queryId} changed to ${data.status}`,
            action: {
              label: "View",
              onClick: () => router.push(`/donor-queries/${data.queryId}`),
            },
          },
          "info"
        );
        break;

      case "newQuery":
        blueToast(
          "New Support Ticket",
          {
            description: `New query from ${data.donor || "a donor"}`,
            action: {
              label: "View",
              onClick: () => router.push("/general-queries"),
            },
          },
          "success"
        );
        break;

      case "callRequested":
        blueToast(
          "Call Requested",
          {
            description: `A ${
              data.mode || "video"
            } call was requested for query #${data.queryId}`,
            action: {
              label: "View",
              onClick: () => router.push(`/donor-queries/${data.queryId}`),
            },
          },
          "info"
        );
        break;

      // Add more cases as needed

      default:
        // Generic toast for other notification types
        blueToast(
          "New Notification",
          {
            description: data.content || `You have a new ${type} notification`,
            action: data.queryId
              ? {
                  label: "View",
                  onClick: () => router.push(`/donor-queries/${data.queryId}`),
                }
              : undefined,
          },
          "info"
        );
    }
  };

  // Mark all notifications as read
  const markAsRead = () => {
    setUnreadCount(0);
  };

  // Request notification permission
  const requestPermission = async () => {
    if (!fcmSupported) {
      blueToast("Notifications are not supported in this browser", {}, "error");
      return null;
    }

    const token = await requestFCMPermission();
    if (token) {
      setFcmToken(token);
      setHasFCMPermission(true);

      // Send the token to the backend when permission is requested
      const success = await updateUserFCMToken(token);
      if (success) {
        console.log("FCM token updated successfully");
      } else {
        console.warn("Failed to update FCM token on the server");
      }

      return token;
    }
    return null;
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    hasWebSocketConnection,
    hasFCMPermission,
    fcmToken,
    requestPermission,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use the notification context
export const useNotifications = () => useContext(NotificationContext);

export default NotificationContext;
