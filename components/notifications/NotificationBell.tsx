"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/lib/notifications/notification-context';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    hasWebSocketConnection,
    hasFCMPermission,
    requestPermission 
  } = useNotifications();
  
  const router = useRouter();

  // Handle notification click
  const handleNotificationClick = (notification: any) => {
    // Navigate based on notification type
    if (notification.queryId) {
      router.push(`/donor-queries/${notification.queryId}`);
    } else if (notification.type === 'newQuery') {
      router.push('/general-queries');
    }
  };

  // Request permission when user clicks on the notification icon
  const handleRequestPermission = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!hasFCMPermission) {
      await requestPermission();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={markAsRead}>
        <button 
          className="inline-flex items-center justify-center relative p-1 rounded-full focus:outline-none"
          onClick={handleRequestPermission}
        >
          <Bell size={20} className={cn(
            "text-gray-600",
            !hasWebSocketConnection && "text-gray-400"
          )} />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2 font-medium">Notifications</div>
        <DropdownMenuSeparator />
        
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((notification, index) => (
              <DropdownMenuItem 
                key={`${notification.type}-${index}`}
                className="p-3 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">
                      {getNotificationTitle(notification.type)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {getNotificationContent(notification)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {!hasFCMPermission && (
              <DropdownMenuItem 
                className="p-2 text-center justify-center text-xs font-medium text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  requestPermission();
                }}
              >
                Enable push notifications
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get notification title
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'newMessage':
      return 'New Message';
    case 'queryStatusChanged':
      return 'Status Changed';
    case 'newQuery':
      return 'New Support Ticket';
    case 'queryTransferred':
      return 'Query Transferred';
    case 'queryAssigned':
      return 'Query Assigned';
    case 'callRequested':
      return 'Call Requested';
    case 'callStatusChanged':
      return 'Call Status Changed';
    default:
      return 'Notification';
  }
}

// Helper function to get notification content
function getNotificationContent(notification: any): string {
  switch (notification.type) {
    case 'newMessage':
      return notification.content || `${notification.sender || 'Someone'} sent a new message`;
    case 'queryStatusChanged':
      return `Query #${notification.queryId} changed to ${notification.status}`;
    case 'newQuery':
      return `New query from ${notification.donor || 'a donor'}`;
    case 'queryTransferred':
      return `Query #${notification.queryId} was transferred to ${notification.toUser || 'another admin'}`;
    case 'queryAssigned':
      return `Query #${notification.queryId} was assigned to you`;
    case 'callRequested':
      return `A ${notification.mode || 'video'} call was requested for query #${notification.queryId}`;
    case 'callStatusChanged':
      return `Call for query #${notification.queryId} changed to ${notification.status}`;
    default:
      return notification.content || 'You have a new notification';
  }
} 