'use client'

import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";

interface CallRequestProps {
  id: number;
  queryId: number;
  adminId: number;
  mode: string;
  message?: string;
  status: string;
  createdAt: string;
  adminName: string;
}

export default function CallRequestCard({
  id,
  queryId,
  mode,
  message,
  status,
  adminName,
}: CallRequestProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptCall = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/call-requests/${queryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACCEPTED",
          callRequestId: id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to accept call request");
      }

      const data = await response.json();
      toast.success("Call request accepted successfully");
      
      // Redirect to video call if mode is VIDEO_CALL
      if (mode === "VIDEO_CALL" && data.roomUrl) {
        window.location.href = data.roomUrl;
      }
    } catch (error) {
      console.error("Error accepting call request:", error);
      toast.error("Failed to accept call request");
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "PENDING") {
    return null;
  }

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-lg">
          Call Request from {adminName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Mode: {mode.replace("_", " ")}
        </p>
        {message && (
          <p className="mt-2 text-sm">
            Message: {message}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="default"
          onClick={handleAcceptCall}
          disabled={isLoading}
        >
          {isLoading ? "Accepting..." : "Accept Call"}
        </Button>
      </CardFooter>
    </Card>
  );
} 