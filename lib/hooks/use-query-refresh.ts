import { useContext } from 'react';
import { QueryRefreshContext } from '@/app/donor-queries/providers';

// Hook to access the refresh context
export function useQueryRefresh() {
  const context = useContext(QueryRefreshContext);
  if (!context) {
    throw new Error('useQueryRefresh must be used within a QueryRefreshProvider');
  }
  return context;
} 