"use client";

import React, { useState } from 'react';
import {
  Bell,
  Check,
  X
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotifications } from '@/lib/notifications/notification-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    hasFCMPermission, 
    hasWebSocketConnection,
    requestPermission
  } = useNotifications();

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (open && unreadCount > 0) {
      markAsRead();
    }
  };

  const renderStatusIndicator = () => {
    // If we have websocket connection and FCM permission, show green
    if (hasWebSocketConnection && hasFCMPermission) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white"></div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Notifications enabled</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If we have websocket but no FCM permission, show yellow
    if (hasWebSocketConnection && !hasFCMPermission) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-yellow-500 ring-1 ring-white"></div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>In-app notifications only</p>
              <Button 
                variant="link" 
                className="text-xs p-0 h-auto" 
                onClick={requestPermission}
              >
                Enable push notifications
              </Button>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If no websocket connection, show red
    if (!hasWebSocketConnection) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white"></div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Notification connection lost</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  // Sort notifications by timestamp (newest first)
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const renderNotificationIcon = (type: string) => {
    switch (type) {
      case 'queryStatusChanged':
        return <span className="mr-2">🔄</span>;
      case 'newQuery':
        return <span className="mr-2">🆕</span>;
      case 'newMessage':
        return <span className="mr-2">💬</span>;
      case 'queryTransferred':
        return <span className="mr-2">↗️</span>;
      case 'queryAssigned':
        return <span className="mr-2">👤</span>;
      case 'callRequested':
        return <span className="mr-2">📞</span>;
      case 'callStatusChanged':
        return <span className="mr-2">📱</span>;
      default:
        return <span className="mr-2">📣</span>;
    }
  };

  const formatNotificationTitle = (notification: any) => {
    switch (notification.type) {
      case 'queryStatusChanged':
        return `Query #${notification.queryId} status changed`;
      case 'newQuery':
        return 'New query created';
      case 'newMessage':
        return `New message from ${notification.sender || 'User'}`;
      case 'queryTransferred':
        return `Query #${notification.queryId} transferred`;
      case 'queryAssigned':
        return `Query #${notification.queryId} assigned`;
      case 'callRequested':
        return `Call requested for Query #${notification.queryId}`;
      case 'callStatusChanged':
        return `Call status changed for Query #${notification.queryId}`;
      default:
        return 'New notification';
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result) {
      toast.success('Push notifications enabled!');
    } else {
      toast.error('Failed to enable push notifications');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {renderStatusIndicator()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            {!hasFCMPermission && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8" 
                onClick={handleRequestPermission}
              >
                Enable Push
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full mr-1 ${hasWebSocketConnection ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>WebSocket: {hasWebSocketConnection ? <Check className="h-3 w-3 inline text-green-500" /> : <X className="h-3 w-3 inline text-red-500" />}</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <div className={`h-2 w-2 rounded-full mr-1 ${hasFCMPermission ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>Push: {hasFCMPermission ? <Check className="h-3 w-3 inline text-green-500" /> : <X className="h-3 w-3 inline text-yellow-500" />}</span>
          </div>
        </div>
        
        <Separator className="my-2" />
        
        {notifications.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-2">
              {sortedNotifications.map((notification, index) => (
                <div 
                  key={`${notification.type}-${notification.timestamp}-${index}`} 
                  className="p-2 rounded hover:bg-accent cursor-pointer"
                  onClick={() => {
                    setOpen(false);
                    if (notification.queryId) {
                      window.location.href = `/donor-queries/${notification.queryId}`;
                    }
                  }}
                >
                  <div className="flex items-start">
                    {renderNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{formatNotificationTitle(notification)}</div>
                      <div className="text-xs text-muted-foreground">{notification.content}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
} 