"use client";

import { useEffect, ReactNode, useState } from 'react';
import { DailyAudio, DailyProvider } from '@daily-co/daily-react';
import { useAtom } from 'jotai';
import { 
  callStateAtom,
  isMutedAtom,
  isVideoOffAtom,
  isScreenSharingAtom 
} from '@/lib/atoms/callState';
import { useAuth } from '@/lib/auth/auth-context';
import { useDaily, useDailyEvent } from '@daily-co/daily-react';
import { ErrorBoundary } from 'react-error-boundary';

// Helper component to initialize Daily after provider is created
function DailyInitializer() {
  const { user } = useAuth();
  const daily = useDaily();
  const [isVideoOff] = useAtom(isVideoOffAtom);
  const [isMuted] = useAtom(isMutedAtom);
  
  // Explicitly join the meeting when Daily object is available
  useEffect(() => {
    if (daily) {
      try {
        // Set username for the local participant
        daily.setUserName(user?.name || 'Admin');
        
        // Use a timeout to ensure previous operations are complete
        const joinTimeout = setTimeout(() => {
          daily.join({
            startVideoOff: isVideoOff, // Prevent camera from being accessed if video is off
            startAudioOff: isMuted,    // Prevent mic from being accessed if audio is muted
          }).then(() => {
            // Successfully joined
          }).catch(err => {
            console.error("Error joining the call:", err);
          });
        }, 100);
        
        return () => clearTimeout(joinTimeout);
      } catch (error) {
        console.error("Error during call initialization:", error);
      }
    }
  }, [daily, user, isVideoOff, isMuted]);

  // Add additional logging for various meeting state changes
  useDailyEvent('error', (event) => {
    console.error("Daily error event:", event);
  });

  // This is just a helper component - doesn't render anything
  return null;
}

interface DailyCallProps {
  roomUrl: string;
  roomToken: string;
  mode: 'audio' | 'video';
  children?: ReactNode;
}

// Helper function to validate room URL
const validateRoomUrl = (url: string): string => {
  if (!url) return "";
  
  // Trim the URL to remove any whitespace
  const trimmedUrl = url.trim();
  
  try {
    // Ensure URL is properly formatted
    const parsedUrl = new URL(trimmedUrl);
    return parsedUrl.toString();
  } catch {
    // Try to fix common issues
    if (!trimmedUrl.startsWith('http')) {
      try {
        // Add https protocol
        const withProtocol = `https://${trimmedUrl}`;
        new URL(withProtocol); // Validate it's a proper URL now
        return withProtocol;
      } catch {
        // If it's not a valid URL even with protocol, try to construct a valid daily.co URL
        try {
          // Assume it's a room name and construct prooftest.daily.co URL
          const asRoomName = `https://prooftest.daily.co/${trimmedUrl}`;
          new URL(asRoomName); // Validate it's a proper URL
          return asRoomName;
        } catch {
          console.error("Failed to create a valid URL from:", trimmedUrl);
          return "";
        }
      }
    }
    
    return "";
  }
}

export function DailyCall({ roomUrl, roomToken, mode, children }: DailyCallProps) {
  const [callState, setCallState] = useAtom(callStateAtom);
  const [, setIsMuted] = useAtom(isMutedAtom);
  const [, setIsVideoOff] = useAtom(isVideoOffAtom);
  const [, setIsScreenSharing] = useAtom(isScreenSharingAtom);
  const [initError, setInitError] = useState<string | null>(null);
  const [validatedUrl, setValidatedUrl] = useState<string>("");
  
  // Validate and set the room URL
  useEffect(() => {
    if (roomUrl) {
      const validUrl = validateRoomUrl(roomUrl);
      if (validUrl) {
        setValidatedUrl(validUrl);
        setInitError(null);
      } else {
        // Try to construct a URL from the room name
        try {
          const parts = roomUrl.split('/');
          const lastPart = parts[parts.length - 1];
          const fallbackUrl = `https://prooftest.daily.co/${lastPart}`;
          new URL(fallbackUrl); // Check if valid
          setValidatedUrl(fallbackUrl);
          setInitError(null);
        } catch {
          setInitError(`Invalid room URL format: ${roomUrl}`);
        }
      }
    } else {
      setInitError("Missing room URL");
    }
  }, [roomUrl]);
  
  // Add debugging and error handling
  useEffect(() => {
    // Validate required properties
    if (!validatedUrl) {
      return; // Error already set in the URL validation effect
    }
    
    if (!roomToken) {
      setInitError("Missing room token");
      return;
    }
    
    // Clear any previous errors
    setInitError(null);
    
    // Update call mode specific settings
    setIsMuted(false);
    setIsScreenSharing(false);
    
    // Initialize with video off if in audio-only mode
    setIsVideoOff(mode === 'audio');
    
    // Make sure the call state is marked as active
    if (!callState.isActive && validatedUrl && roomToken) {
      setCallState(prev => ({
        ...prev,
        isActive: true
      }));
    }
    
    // DO NOT reset the callState.isActive flag in the cleanup function
    // This was causing the component to enter a mounting/unmounting loop
  }, [validatedUrl, roomToken, mode, callState.isActive, setCallState, setIsMuted, setIsVideoOff, setIsScreenSharing]);

  // Show error state if validation failed
  if (initError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          Error: {initError}
        </div>
      </div>
    );
  }

  // Verify we have the required properties
  if (!validatedUrl || !roomToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          Error: Missing required call parameters
        </div>
      </div>
    );
  }

  // We use a try-catch wrapper in our return to handle potential errors
  try {
    return (
      <DailyProvider
        url={validatedUrl}
        token={roomToken}
        dailyConfig={{
          // Video quality settings can be configured in standard properties
          // instead of using experimental settings
        }}
      >
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500 text-center">
              <p>An error occurred initializing the call.</p>
              <p className="mt-2 text-sm">Please try again or contact support.</p>
            </div>
          </div>
        }>
          <DailyInitializer />
          <DailyAudio />
          {children}
        </ErrorBoundary>
      </DailyProvider>
    );
  } catch (error) {
    console.error("Error rendering DailyProvider:", error);
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          Error: Failed to initialize call
        </div>
      </div>
    );
  }
} 