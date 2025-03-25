"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Create the context
type QueryRefreshContextType = {
  refreshTimestamp: number;
  triggerRefresh: () => void;
};

const QueryRefreshContext = createContext<QueryRefreshContextType>({
  refreshTimestamp: Date.now(),
  triggerRefresh: () => {},
});

// Context provider component
export function QueryRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());

  // Function to trigger a refresh of all query lists
  const triggerRefresh = useCallback(() => {
    setRefreshTimestamp(Date.now());
  }, []);

  // Context value
  const value = {
    refreshTimestamp,
    triggerRefresh,
  };

  return (
    <QueryRefreshContext.Provider value={value}>
      {children}
    </QueryRefreshContext.Provider>
  );
}

// Hook to use the query refresh context
export const useQueryRefresh = () => useContext(QueryRefreshContext); 