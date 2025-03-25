"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import socketService from '@/lib/websocket/socket-service';
import { fetchWithAuth } from '@/lib/api/fetch-utils';
import { DonorQuery } from '@/types/donor-query';
import { useQueryRefresh } from '@/lib/contexts/query-refresh-context';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com';

type QueryStatus = 'IN_PROGRESS' | 'PENDING_REPLY' | 'RESOLVED' | 'TRANSFERRED' | 'GENERAL';

/**
 * Custom hook for fetching and listening to real-time updates for query lists.
 * 
 * @param status The query status to fetch
 * @returns An object containing the queries and a function to refresh them
 */
export function useQueryDataWithRealtime(status: QueryStatus) {
  const [queries, setQueries] = useState<DonorQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isAuthenticated, token } = useAuth();
  const { refreshTimestamp } = useQueryRefresh();

  // Determine the endpoint based on status
  const getEndpoint = useCallback(() => {
    switch (status) {
      case 'IN_PROGRESS':
        return `${API_BASE_URL}/donor-queries/in-progress`;
      case 'PENDING_REPLY':
        return `${API_BASE_URL}/donor-queries/pending-reply`;
      case 'RESOLVED':
        return `${API_BASE_URL}/donor-queries/resolved`;
      case 'TRANSFERRED':
        return `${API_BASE_URL}/donor-queries/transferred`;
      case 'GENERAL':
        return `${API_BASE_URL}/donor-queries/general`;
      default:
        return `${API_BASE_URL}/donor-queries/filtered/statuses?statuses=${status}`;
    }
  }, [status]);

  // Fetch queries from the API
  const fetchQueries = useCallback(async () => {
    if (!isAuthenticated) {
      setQueries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = getEndpoint();
      const response = await fetchWithAuth(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${status} queries: ${response.status}`);
      }
      
      const data = await response.json();
      const queriesList = Array.isArray(data) ? data : (data.data || []);
      
      setQueries(queriesList);
    } catch (err) {
      console.error(`Error fetching ${status} queries:`, err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, status, getEndpoint]);

  // Refresh when the global refresh is triggered
  useEffect(() => {
    if (refreshTimestamp > 0) {
      fetchQueries();
    }
  }, [refreshTimestamp, fetchQueries]);

  // Initialize data and WebSocket connections
  useEffect(() => {
    // Initial data fetch
    fetchQueries();
    
    // Only set up WebSocket if authenticated
    if (!isAuthenticated || !token) return;

    // Connect to WebSocket if not already connected
    if (!socketService.isConnected()) {
      socketService.connect(token);
    }

    // Set up WebSocket listeners for real-time updates
    const setupListeners = () => {
      // Listen for new queries
      const newQueryUnsubscribe = socketService.on('newQuery', (data) => {
        console.log('Received newQuery event:', data);
        
        // Only add to list if the status matches our current view
        if (status === 'GENERAL' || data.query?.status === status) {
          setQueries(prev => {
            // Check if query already exists to avoid duplicates
            const exists = prev.some(q => q.id === data.query.id);
            if (exists) return prev;
            return [...prev, data.query];
          });
        }
      });
      
      // Listen for query status changes
      const statusChangeUnsubscribe = socketService.on('queryStatusChanged', (data) => {
        console.log('Received queryStatusChanged event:', data);
        const { queryId, status: newStatus } = data;
        
        // If this query should now be in our list, fetch it
        if (newStatus === status) {
          // Option 1: Fetch the specific query and add it
          fetchQueryById(queryId).then(query => {
            if (query) {
              setQueries(prev => {
                // Check if query already exists to avoid duplicates
                const exists = prev.some(q => q.id === query.id);
                if (exists) return prev.map(q => q.id === query.id ? query : q);
                return [...prev, query];
              });
            }
          });
        } else {
          // If this query should no longer be in our list, remove it
          setQueries(prev => prev.filter(q => q.id !== queryId));
        }
      });
      
      // Listen for query updates (transfers, assigns, etc.)
      const queryUpdatedUnsubscribe = socketService.on('queryTransferred', (data) => {
        console.log('Received queryTransferred event:', data);
        // Refresh the list to get the latest changes
        fetchQueries();
      });
      
      const queryAssignedUnsubscribe = socketService.on('queryAssigned', (data) => {
        console.log('Received queryAssigned event:', data);
        // Update the specific query in our list
        const { queryId, userId } = data;
        
        setQueries(prev => prev.map(q => {
          if (q.id === queryId) {
            return { ...q, assignedToId: userId };
          }
          return q;
        }));
      });
      
      // Return cleanup function
      return () => {
        newQueryUnsubscribe();
        statusChangeUnsubscribe();
        queryUpdatedUnsubscribe();
        queryAssignedUnsubscribe();
      };
    };
    
    // Setup listeners and store cleanup function
    const cleanup = setupListeners();
    
    // Cleanup function
    return () => {
      cleanup();
    };
  }, [isAuthenticated, token, status, fetchQueries]);

  // Helper function to fetch a single query by ID
  const fetchQueryById = async (queryId: number): Promise<DonorQuery | null> => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/donor-queries/admin/${queryId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch query ${queryId}: ${response.status}`);
      }
      
      const query = await response.json();
      return query;
    } catch (err) {
      console.error(`Error fetching query ${queryId}:`, err);
      return null;
    }
  };

  // Manual refresh function
  const refreshQueries = useCallback(() => {
    fetchQueries();
  }, [fetchQueries]);

  return { queries, isLoading, error, refreshQueries };
} 