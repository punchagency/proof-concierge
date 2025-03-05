'use client'

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import UserQueryChat from "@/components/user-test/UserQueryChat";
import UserCallRequestContainer from "@/components/user-test/UserCallRequestContainer";
import { toast } from "sonner";

export interface DonorQuery {
  id: number;
  sid: string;
  donor: string;
  donorId: string;
  test: string;
  stage: string;
  queryMode: string;
  device: string;
  status: string;
  createdAt: string;
  messages: Array<{
    id: number;
    content: string;
    senderId: number;
    isFromAdmin: boolean;
    createdAt: string;
    sender: {
      id: number;
      name: string;
      username: string;
      avatar?: string;
      role: string;
    };
  }>;
  callRequests: Array<{
    id: number;
    mode: string;
    message: string | null;
    status: string;
    createdAt: string;
    admin: {
      id: number;
      name: string;
    };
  }>;
}

export default function UserQueryList() {
  const [queries, setQueries] = useState<DonorQuery[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<DonorQuery | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/donor-queries/test-user`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch queries: ${response.statusText}`);
      }

      const data = await response.json();
      // The API returns data in a wrapper object
      setQueries(data.data || []);
    } catch (error) {
      console.error("Error fetching queries:", error);
      toast.error("Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
    // Refresh queries every 30 seconds
    const interval = setInterval(fetchQueries, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <div className="text-center">Loading queries...</div>;
  }

  if (queries.length === 0) {
    return <div className="text-center">No accepted queries found.</div>;
  }

  if (selectedQuery) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Query Details: {selectedQuery.sid}</h2>
          <Button variant="outline" onClick={() => setSelectedQuery(null)}>
            Back to List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Query Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Test</label>
                <p className="font-medium">{selectedQuery.test}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Stage</label>
                <p className="font-medium">{selectedQuery.stage}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Mode</label>
                <p className="font-medium">{selectedQuery.queryMode}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium">{selectedQuery.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Call Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <UserCallRequestContainer queryId={selectedQuery.id} />
          </CardContent>
        </Card>

        {/* Chat Section */}
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <UserQueryChat query={selectedQuery} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {queries.map((query) => (
        <Card 
          key={query.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedQuery(query)}
        >
          <CardHeader>
            <CardTitle className="text-lg">SID_{query.sid}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-500">Test</label>
                <p className="font-medium">{query.test}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="font-medium">{query.status}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Mode</label>
                <p className="font-medium">{query.queryMode}</p>
              </div>
              {query.messages.length > 0 && (
                <div>
                  <label className="text-sm text-gray-500">Latest Message</label>
                  <p className="font-medium truncate">
                    {query.messages[query.messages.length - 1].content}
                  </p>
                </div>
              )}
              {query.callRequests.some(req => req.status === 'PENDING') && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending Call Request
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 