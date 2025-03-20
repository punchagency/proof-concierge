'use client';

import { createContext, useCallback, useEffect, useState, useRef } from 'react';
import { 
  fetchGeneralQueries, 
  fetchTransferredQueries, 
  fetchResolvedQueries, 
} from "@/lib/api/donor-queries";
import { CustomWindow } from '@/lib/types/window';

// Create a refresh context to manage query refreshing
export const QueryRefreshContext = createContext<{
  triggerRefresh: () => void;
  refreshing: boolean;
  lastRefreshed: Date | null;
} | null>(null);

// Subtle refresh indicator that appears when a refresh is happening
function RefreshIndicator({ refreshing, lastRefreshed }: { refreshing: boolean; lastRefreshed: Date | null }) {
  return (
    <div className="fixed bottom-3 right-3 z-50 flex items-center gap-2 text-xs bg-white/80 backdrop-blur-sm shadow-sm rounded-full px-3 py-1.5 border border-gray-200">
      {refreshing ? (
        <>
          <div className="animate-spin h-3 w-3 border-b-2 border-primary rounded-full" />
          <span className="text-primary">Refreshing data...</span>
        </>
      ) : (
        <>
          <div className="h-3 w-3 bg-green-500 rounded-full" />
          <span className="text-gray-600">
            {lastRefreshed 
              ? `Updated ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Up to date'}
          </span>
        </>
      )}
    </div>
  );
}

// QueryRefreshProvider component to handle auto-refreshing
export function QueryRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  // Use a ref to track if a refresh is in progress to avoid dependency cycle
  const isRefreshingRef = useRef(false);
  
  // Function to refresh all query types
  const refreshQueries = useCallback(async () => {
    // Check the ref value instead of state to avoid dependency issues
    if (isRefreshingRef.current) return;
    
    // Set both the state and ref
    setRefreshing(true);
    isRefreshingRef.current = true;
    
    try {
      console.log('🔄 Background refresh: Fetching updated queries...');
      
      // Get any existing filters from window handlers
      const extWindow = window as unknown as CustomWindow;
      const generalFilters = extWindow.__currentGeneralFilters;
      const transferredFilters = extWindow.__currentTransferredFilters;
      const resolvedFilters = extWindow.__currentResolvedFilters;
      
      // Fetch all query types in parallel
      const [generalQueries, transferredQueries, resolvedQueries] = await Promise.all([
        fetchGeneralQueries(generalFilters),
        fetchTransferredQueries(transferredFilters),
        fetchResolvedQueries(resolvedFilters)
      ]);
      
      // Call the appropriate handlers if they exist
      if (extWindow.handleFilteredGeneralQueries && generalQueries) {
        extWindow.handleFilteredGeneralQueries(generalQueries);
      }
      
      if (extWindow.handleFilteredTransferredQueries && transferredQueries) {
        extWindow.handleFilteredTransferredQueries(transferredQueries);
      }
      
      if (extWindow.handleFilteredResolvedQueries && resolvedQueries) {
        extWindow.handleFilteredResolvedQueries(resolvedQueries);
      }
      
      console.log('✅ Background refresh completed');
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('❌ Error during background refresh:', error);
    } finally {
      setRefreshing(false);
      isRefreshingRef.current = false;
    }
  }, []); // No dependencies needed as we use the ref
  
  // Define the refresh function that custom components can call
  const triggerRefresh = useCallback(() => {
    refreshQueries();
  }, [refreshQueries]);

  // Set up the interval for automatic refreshing (every 30 seconds)
  useEffect(() => {
    // Initial refresh after component mounts
    refreshQueries();
    
    // Set up recurring refresh
    const intervalId = setInterval(() => {
      refreshQueries();
    }, 30000); // 30 seconds
    
    // Event listener for tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh immediately when tab becomes visible again
        refreshQueries();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshQueries]);
  
  return (
    <QueryRefreshContext.Provider value={{ triggerRefresh, refreshing, lastRefreshed }}>
      {children}
      <RefreshIndicator refreshing={refreshing} lastRefreshed={lastRefreshed} />
    </QueryRefreshContext.Provider>
  );
} 