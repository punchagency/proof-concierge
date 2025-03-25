"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useQueryRefresh } from '@/lib/contexts/query-refresh-context';
import { fetchWithAuth } from '@/lib/api/fetch-utils';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://proof-concierge-fcbe8069aebb.herokuapp.com';

interface QueryStatusToggleProps {
  queryId: number;
  currentStatus: string;
}

export default function QueryStatusToggle({ queryId, currentStatus }: QueryStatusToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { triggerRefresh } = useQueryRefresh();

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) return;
    
    setIsLoading(true);
    
    try {
      let endpoint = '';
      
      switch (newStatus) {
        case 'IN_PROGRESS':
          endpoint = `${API_BASE_URL}/donor-queries/${queryId}/in-progress`;
          break;
        case 'PENDING_REPLY':
          endpoint = `${API_BASE_URL}/donor-queries/${queryId}/pending-reply`;
          break;
        case 'RESOLVED':
          endpoint = `${API_BASE_URL}/donor-queries/${queryId}/resolve`;
          break;
        default:
          throw new Error(`Unsupported status: ${newStatus}`);
      }
      
      const response = await fetchWithAuth(endpoint, {
        method: newStatus === 'RESOLVED' ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Status changed to ${newStatus}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      toast.success(`Query status updated to ${newStatus}`);
      
      // We don't need to manually refresh because the WebSocket notification
      // will trigger the refresh automatically, but we'll trigger it anyway
      // as a fallback
      triggerRefresh();
    } catch (err) {
      console.error('Error updating query status:', err);
      toast.error(`Failed to update status: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col space-y-2">
      <p className="text-sm font-medium">Change Status:</p>
      <div className="flex space-x-2">
        <button
          onClick={() => handleStatusChange('IN_PROGRESS')}
          disabled={isLoading || currentStatus === 'IN_PROGRESS'}
          className={`px-3 py-1 text-xs rounded ${
            currentStatus === 'IN_PROGRESS'
              ? 'bg-blue-200 text-blue-800 cursor-default'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          In Progress
        </button>
        
        <button
          onClick={() => handleStatusChange('PENDING_REPLY')}
          disabled={isLoading || currentStatus === 'PENDING_REPLY'}
          className={`px-3 py-1 text-xs rounded ${
            currentStatus === 'PENDING_REPLY'
              ? 'bg-yellow-200 text-yellow-800 cursor-default'
              : 'bg-yellow-500 text-white hover:bg-yellow-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pending Reply
        </button>
        
        <button
          onClick={() => handleStatusChange('RESOLVED')}
          disabled={isLoading || currentStatus === 'RESOLVED'}
          className={`px-3 py-1 text-xs rounded ${
            currentStatus === 'RESOLVED'
              ? 'bg-green-200 text-green-800 cursor-default'
              : 'bg-green-500 text-white hover:bg-green-600'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Resolved
        </button>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          <span className="ml-2 text-xs text-gray-500">Updating...</span>
        </div>
      )}
    </div>
  );
} 