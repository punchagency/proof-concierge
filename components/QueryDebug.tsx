import React, { useState } from 'react';
import { GeneralQuery } from '@/lib/api/donor-queries';

type QueryData = GeneralQuery & {
  [key: string]: unknown;
};

interface QueryDebugProps {
  data: QueryData;
  apiResponse?: Record<string, unknown>;
}

/**
 * Debug component to display query information during development
 * Only visible in development mode
 */
export function QueryDebug({ data, apiResponse }: QueryDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-2 right-2 bg-slate-900 text-white p-2 rounded-lg shadow-lg z-50 text-xs max-w-md">
      <button 
        className="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded mb-2 w-full text-left"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? 'Hide' : 'Show'} Query Debug ({data?.id})
      </button>
      
      {isExpanded && (
        <div className="overflow-auto max-h-[80vh]">
          <div className="mb-2">
            <h3 className="font-bold mb-1">Query Status:</h3>
            <div className="bg-slate-800 p-2 rounded overflow-x-auto">
              <pre>{JSON.stringify({
                id: data?.id,
                status: data?.status,
                assignedToUser: data?.assignedToUser || null
              }, null, 2)}</pre>
            </div>
          </div>
          
          {apiResponse && (
            <div className="mb-2">
              <h3 className="font-bold mb-1">Last API Response:</h3>
              <div className="bg-slate-800 p-2 rounded overflow-x-auto">
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-bold mb-1">Full Query Data:</h3>
            <div className="bg-slate-800 p-2 rounded overflow-x-auto">
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 