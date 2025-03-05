'use client'

import { useEffect, useState } from "react";
import CallRequestCard from "./CallRequestCard";

interface CallRequest {
  id: number;
  queryId: number;
  adminId: number;
  mode: string;
  message?: string;
  status: string;
  createdAt: string;
  admin: {
    name: string;
  };
}

interface CallRequestContainerProps {
  queryId: number;
}

export default function CallRequestContainer({ queryId }: CallRequestContainerProps) {
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCallRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/call-requests/${queryId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch call requests");
      }

      const data = await response.json();
      setCallRequests(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching call requests:", error);
      setError("Failed to load call requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallRequests();
    
    // Poll for new call requests every 10 seconds
    const interval = setInterval(fetchCallRequests, 10000);
    return () => clearInterval(interval);
  }, [queryId]);

  if (isLoading) {
    return <div className="w-full text-center py-4">Loading call requests...</div>;
  }

  if (error) {
    return <div className="w-full text-center text-red-500 py-4">{error}</div>;
  }

  if (callRequests.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {callRequests.map((request) => (
        <CallRequestCard
          key={request.id}
          id={request.id}
          queryId={request.queryId}
          adminId={request.adminId}
          mode={request.mode}
          message={request.message}
          status={request.status}
          createdAt={request.createdAt}
          adminName={request.admin.name}
        />
      ))}
    </div>
  );
} 