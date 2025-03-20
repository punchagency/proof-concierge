'use client';

import { TabsComponent } from "@/components/TabsComponent";
import { QueryHeader } from "../components/QueryHeader";
import { DockableModalProvider } from "@/components/providers/dockable-modal-provider";
import { CallManagerProvider } from "@/components/providers/CallManagerProvider";
import ProtectedRoute from "@/lib/auth/protected-route";
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  fetchGeneralQueries, 
  fetchTransferredQueries, 
  fetchResolvedQueries, 
  FilterParams, 
  GeneralQuery,
  TransferredQuery,
  ResolvedQuery
} from "@/lib/api/donor-queries";

// Define types for our extended window object
interface ExtendedWindow extends Window {
  handleFilteredGeneralQueries?: (data: GeneralQuery[]) => void;
  handleFilteredTransferredQueries?: (data: TransferredQuery[]) => void;
  handleFilteredResolvedQueries?: (data: ResolvedQuery[]) => void;
  __currentGeneralFilters?: FilterParams;
  __currentTransferredFilters?: FilterParams;
  __currentResolvedFilters?: FilterParams;
}

// Create a refresh context to manage query refreshing
const QueryRefreshContext = createContext<{
  triggerRefresh: () => void;
  refreshing: boolean;
  lastRefreshed: Date | null;
} | null>(null);

// Hook to access the refresh context
export function useQueryRefresh() {
  const context = useContext(QueryRefreshContext);
  if (!context) {
    throw new Error('useQueryRefresh must be used within a QueryRefreshProvider');
  }
  return context;
}

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
function QueryRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  
  // Define the refresh function that custom components can call
  const triggerRefresh = () => {
    refreshQueries();
  };
  
  // Function to refresh all query types
  const refreshQueries = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Background refresh: Fetching updated queries...');
      
      // Get any existing filters from window handlers
      const extWindow = window as unknown as ExtendedWindow;
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
    }
  };
  
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
  }, []);
  
  return (
    <QueryRefreshContext.Provider value={{ triggerRefresh, refreshing, lastRefreshed }}>
      {children}
      <RefreshIndicator refreshing={refreshing} lastRefreshed={lastRefreshed} />
    </QueryRefreshContext.Provider>
  );
}

export default function DonorQueries() {
  return (
    <ProtectedRoute>
      <DockableModalProvider>
        <CallManagerProvider>
          <QueryRefreshProvider>
            <div className="w-full h-[calc(100vh-132px)] flex flex-col">
              <div className="flex-none">
                <QueryHeader />
              </div>
              <div className="flex-1 overflow-hidden">
                <TabsComponent />
              </div>
            </div>
          </QueryRefreshProvider>
        </CallManagerProvider>
      </DockableModalProvider>
    </ProtectedRoute>
  );
}
