"use client";

import React from 'react';
import { useQueryDataWithRealtime } from '@/lib/hooks/useQueryDataWithRealtime';
import { DonorQuery } from '@/lib/api/donor-queries';
import { useQueryRefresh } from '@/lib/contexts/query-refresh-context';

export default function InProgressQueriesPage() {
  const { queries, isLoading, error } = useQueryDataWithRealtime('IN_PROGRESS');
  const { triggerRefresh } = useQueryRefresh();

  // Handle manual refresh
  const handleRefresh = () => {
    triggerRefresh(); // This will refresh all query lists across the app
  };

  // Example of rendering the queries
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">In Progress Queries</h1>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading queries: {error.message}
        </div>
      ) : queries.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No in-progress queries available.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {queries.map((query: DonorQuery) => (
            <div
              key={query.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h2 className="font-semibold text-lg">{query.donor}</h2>
              <p className="text-gray-600 text-sm">ID: {query.id}</p>
              <p className="text-gray-600 text-sm">Status: {query.status}</p>
              <p className="text-gray-600 text-sm">Test: {query.test}</p>
              <p className="text-gray-600 text-sm">
                Created: {new Date(query.createdAt).toLocaleString()}
              </p>
              {query.assignedToId && (
                <p className="text-gray-600 text-sm mt-2">
                  Assigned to: User #{query.assignedToId}
                </p>
              )}
              {/* Add more query details as needed */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 