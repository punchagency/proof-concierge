"use client";

import { useEffect } from 'react';
import socketService from '@/lib/websocket/socket-service';
import { useAuth } from '@/lib/auth/auth-context';

/**
 * Custom hook for joining and leaving WebSocket query rooms.
 * This ensures that the user receives real-time updates specific to the query.
 * 
 * @param queryId - The ID of the query to join/leave
 * @returns boolean indicating if the client is authenticated and can join rooms
 */
export function useQueryRoom(queryId: number | null) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Only attempt to join if authenticated and queryId exists
    if (!isAuthenticated || !queryId) {
      return;
    }

    // Join the query-specific room
    socketService.joinQueryRoom(queryId);

    // Cleanup: leave the query room when the component unmounts
    // or when the queryId changes
    return () => {
      if (queryId) {
        socketService.leaveQueryRoom(queryId);
      }
    };
  }, [queryId, isAuthenticated]);

  return isAuthenticated;
} 