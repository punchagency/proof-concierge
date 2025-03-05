'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function TestUserCallPage() {
  const [queryId, setQueryId] = useState<number>(1);
  const [callRequests, setCallRequests] = useState<any[]>([]);

  const fetchCallRequests = async () => {
    try {
      const response = await fetch(`/api/test-call/requests?queryId=${queryId}`);
      if (response.ok) {
        const data = await response.json();
        setCallRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching call requests:", error);
    }
  };

  const handleAcceptCall = async (requestId: number) => {
    try {
      const response = await fetch("/api/test-call/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          queryId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Call accepted successfully");
        
        // Redirect to the video call page
        if (data.roomUrl) {
          window.location.href = data.roomUrl;
        } else {
          console.error("No room URL returned from accept call API");
          toast.error("Failed to get video call URL");
        }
        
        fetchCallRequests();
      } else {
        const error = await response.json();
        console.error("Error response from accept call API:", error);
        toast.error(`Failed to accept call: ${error.message}`);
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.error("Failed to accept call");
    }
  };

  // Poll for updates
  useEffect(() => {
    fetchCallRequests();
    const interval = setInterval(fetchCallRequests, 5000);
    return () => clearInterval(interval);
  }, [queryId]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test User Call Interface</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>View Call Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="queryId">Query ID</Label>
              <Input
                id="queryId"
                type="number"
                value={queryId}
                onChange={(e) => setQueryId(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Call Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {callRequests.length === 0 ? (
              <p className="text-gray-500">No call requests found</p>
            ) : (
              <div className="space-y-4">
                {callRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle className="text-sm">
                        Request #{request.id} - {request.mode}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs">Status: {request.status}</p>
                      {request.message && (
                        <p className="text-xs mt-1">Message: {request.message}</p>
                      )}
                    </CardContent>
                    <CardFooter>
                      {request.status === "PENDING" && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptCall(request.id)}
                        >
                          Accept Call
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 