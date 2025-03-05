'use client'

import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { toast } from "sonner";
import { Video, Phone, Monitor } from "lucide-react";

interface UserCallRequestProps {
  id: number;
  queryId: number;
  mode: string;
  message?: string;
  status: string;
  admin: {
    id: number;
    name: string;
  };
  onStatusChange?: () => void;
}

export default function UserCallRequestCard({
  id,
  queryId,
  mode,
  message,
  status,
  admin,
  onStatusChange,
}: UserCallRequestProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCallAction = async (action: 'accept' | 'decline') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/communication/call-requests/${queryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action === 'accept' ? "ACCEPTED" : "DECLINED",
          callRequestId: id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} call request`);
      }

      const data = await response.json();
      toast.success(`Call request ${action}ed successfully`);
      
      // If accepted and it's a video/audio call, redirect to the call room
      if (action === 'accept' && data.roomUrl) {
        window.location.href = data.roomUrl;
      }

      // Notify parent component to refresh the list
      onStatusChange?.();
    } catch (error) {
      console.error(`Error ${action}ing call request:`, error);
      toast.error(`Failed to ${action} call request`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== "PENDING") {
    return null;
  }

  const getCallIcon = () => {
    switch (mode.toLowerCase()) {
      case 'video_call':
        return <Video className="w-5 h-5" />;
      case 'audio_call':
        return <Phone className="w-5 h-5" />;
      case 'screen_share':
        return <Monitor className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full mb-4">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getCallIcon()}
          <span>Call Request from {admin.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          Mode: {mode.replace(/_/g, " ")}
        </p>
        {message && (
          <p className="mt-2 text-sm">
            Message: {message}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => handleCallAction('decline')}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Decline"}
        </Button>
        <Button
          variant="default"
          onClick={() => handleCallAction('accept')}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Accept"}
        </Button>
      </CardFooter>
    </Card>
  );
} 