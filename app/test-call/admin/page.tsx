'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function TestAdminCallPage() {
  const [queryId, setQueryId] = useState<number>(1);
  const [adminId, setAdminId] = useState<number>(1);
  const [mode, setMode] = useState<string>("VIDEO");
  const [message, setMessage] = useState<string>("Test call request");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [callRequests, setCallRequests] = useState<any[]>([]);
  const [adminRoomUrl, setAdminRoomUrl] = useState<string>('');
  const [adminRoomToken, setAdminRoomToken] = useState<string>('');

  const fetchCallRequests = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/test-call/requests?adminId=${adminId}`);
      if (response.ok) {
        const data = await response.json();
        setCallRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching call requests:", error);
    }
  };

  const handleClearAllRequests = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/test-call/requests/clear`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminId }),
      });

      if (response.ok) {
        setCallRequests([]);
        toast.success("All call requests cleared successfully");
      } else {
        toast.error("Failed to clear call requests");
      }
    } catch (error) {
      console.error("Error clearing call requests:", error);
      toast.error("Failed to clear call requests");
    }
  };

  const handleRequestCall = async () => {
    setIsLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/test-call/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          queryId,
          adminId,
          mode,
          message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Call request sent successfully");
        fetchCallRequests();
      } else {
        const error = await response.json();
        toast.error(`Failed to send call request: ${error.message}`);
      }
    } catch (error) {
      console.error("Error sending call request:", error);
      toast.error("Failed to send call request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinAsAdmin = () => {
    if (adminRoomUrl && adminRoomToken) {
      const videoCallUrl = `/test-call/video?url=${encodeURIComponent(adminRoomUrl)}&token=${encodeURIComponent(adminRoomToken)}`;
      window.open(videoCallUrl, '_blank');
    } else {
      toast.error('Please wait for the user to accept the call request first');
    }
  };

  // Poll for updates and check for accepted calls
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const baseUrl = window.location.origin;
        const response = await fetch(`${baseUrl}/api/test-call/requests?queryId=${queryId}`);
        if (response.ok) {
          const data = await response.json();
          const requests = data.requests || [];
          setCallRequests(requests);

          // Check for accepted requests and update admin room info
          const acceptedRequest = requests.find((req: any) => req.status === 'ACCEPTED' && req.adminRoomInfo);
          if (acceptedRequest?.adminRoomInfo) {
            setAdminRoomUrl(acceptedRequest.adminRoomInfo.roomUrl);
            setAdminRoomToken(acceptedRequest.adminRoomInfo.roomToken);
          }
        }
      } catch (error) {
        console.error("Error polling call requests:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [queryId]);

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Test Call Admin Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="adminId">Admin ID</Label>
              <Input
                id="adminId"
                type="number"
                value={adminId}
                onChange={(e) => setAdminId(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="queryId">Query ID</Label>
              <Input
                id="queryId"
                type="number"
                value={queryId}
                onChange={(e) => setQueryId(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="mode">Mode</Label>
              <Input
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button onClick={handleRequestCall} disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Call Request"}
          </Button>
          <Button variant="destructive" onClick={handleClearAllRequests}>
            Clear All Requests
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Call Requests</CardTitle>
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
                      {request.status === 'ACCEPTED' && request.adminRoomInfo && (
                        <Button
                          size="sm"
                          className="mt-2"
                          onClick={handleJoinAsAdmin}
                        >
                          Join Call as Admin
                        </Button>
                      )}
                    </CardContent>
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