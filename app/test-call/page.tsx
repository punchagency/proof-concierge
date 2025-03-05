"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from 'next/link';

export default function TestCallPage() {
  const [queryId, setQueryId] = useState<number>(1);
  const [adminId, setAdminId] = useState<number>(1);
  const [mode, setMode] = useState<string>("VIDEO");
  const [message, setMessage] = useState<string>("Test call request");
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  useEffect(() => {
    fetchCallRequests();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchCallRequests, 5000);
    return () => clearInterval(interval);
  }, [queryId]);

  const handleRequestCall = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/test-call/request", {
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
        
        console.log("Call accepted response:", data);
        
        // If there's a room URL, redirect to the video call page
        if (data.roomUrl) {
          // Use window.location.href instead of window.open for a more reliable redirect
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Call Interfaces</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Use this interface to create call requests and join calls as an admin.
            </p>
            <Link href="/test-call/admin">
              <Button className="w-full">
                Open Admin Interface
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Use this interface to view and accept call requests as a user.
            </p>
            <Link href="/test-call/user">
              <Button className="w-full">
                Open User Interface
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Admin Interface in one browser window</li>
              <li>Open the User Interface in another browser window</li>
              <li>In the Admin Interface:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Enter a Query ID (e.g., 1)</li>
                  <li>Choose a call mode (Video/Audio)</li>
                  <li>Click "Send Call Request"</li>
                </ul>
              </li>
              <li>In the User Interface:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Enter the same Query ID</li>
                  <li>Wait for the call request to appear</li>
                  <li>Click "Accept Call" to join the call</li>
                </ul>
              </li>
              <li>Once the user accepts:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>The user will be redirected to the video call page</li>
                  <li>The admin will see a "Join Call as Admin" button</li>
                  <li>Both parties can now join the same call</li>
                </ul>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add this to make TypeScript happy with the DailyIframe global
declare global {
  interface Window {
    DailyIframe: any;
  }
} 