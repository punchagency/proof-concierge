'use client'

import { useEffect, useState } from "react";
import UserCallRequestCard from "./UserCallRequestCard";
import { toast } from "sonner";

interface CallRequest {
  id: number;
  queryId: number;
  mode: string;
  message?: string;
  status: string;
  createdAt: string;
  admin: {
    id: number;
    name: string;
  };
}

interface UserCallRequestContainerProps {
  queryId: number;
}

export default function UserCallRequestContainer({ queryId }: UserCallRequestContainerProps) {
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCallRequests = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/communication/call-requests/${queryId}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch call requests");
      }

      const data = await response.json();
      setCallRequests(data.data || []);
    } catch (error) {
      console.error("Error fetching call requests:", error);
      toast.error("Failed to fetch call requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallRequests();
    // Poll for new call requests every 5 seconds
    const interval = setInterval(fetchCallRequests, 5000);
    return () => clearInterval(interval);
  }, [queryId]);

  if (isLoading) {
    return <div className="text-center py-4">Loading call requests...</div>;
  }

  const pendingRequests = callRequests.filter(
    (request) => request.status === "PENDING"
  );

  if (pendingRequests.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No pending call requests
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingRequests.map((request) => (
        <UserCallRequestCard
          key={request.id}
          {...request}
          onStatusChange={fetchCallRequests}
        />
      ))}
    </div>
  );
} 