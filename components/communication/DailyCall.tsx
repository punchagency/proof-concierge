"use client";

import { useEffect, ReactNode } from 'react';
import { DailyProvider } from '@daily-co/daily-react';
import { useAtom } from 'jotai';
import { 
  callStateAtom,
  isMutedAtom,
  isVideoOffAtom,
  isScreenSharingAtom 
} from '@/lib/atoms/callState';
import { useAuth } from '@/lib/auth/auth-context';
import { useDaily, useDailyEvent } from '@daily-co/daily-react';

// Helper component to initialize Daily after provider is created
function DailyInitializer() {
  const { user } = useAuth();
  const daily = useDaily();
  
  // Explicitly join the meeting when Daily object is available
  useEffect(() => {
    if (daily) {
      try {
        // Set username for the local participant
        console.log("Setting Daily username to:", user?.name || 'Admin');
        daily.setUserName(user?.name || 'Admin');
        
        // Explicitly join the meeting
        console.log("Explicitly joining the meeting...");
        daily.join().then(() => {
          console.log("Successfully joined the call through explicit join()");
        }).catch(err => {
          console.error("Error joining the call:", err);
        });
      } catch (error) {
        console.error("Error during call initialization:", error);
      }
    }
  }, [daily, user]);

  // Add additional logging for various meeting state changes
  useDailyEvent('joining-meeting', () => {
    console.log("Joining meeting process started...");
  });
  
  useDailyEvent('joined-meeting', () => {
    console.log("Successfully joined the meeting!");
  });
  
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

export function DailyCall({ roomUrl, roomToken, mode, children }: DailyCallProps) {
  const [callState, setCallState] = useAtom(callStateAtom);
  const [, setIsMuted] = useAtom(isMutedAtom);
  const [, setIsVideoOff] = useAtom(isVideoOffAtom);
  const [, setIsScreenSharing] = useAtom(isScreenSharingAtom);
  
  // Add debugging
  useEffect(() => {
    console.log("DailyCall initializing with:", { 
      roomUrl, 
      roomToken: roomToken?.substring(0, 15) + "...", 
      mode,
      callStateActive: callState.isActive
    });
    
    if (!roomUrl) {
      console.error("DailyCall: missing roomUrl");
    }
    
    if (!roomToken) {
      console.error("DailyCall: missing roomToken");
    }
    
    // Update call mode specific settings
    setIsMuted(false);
    setIsScreenSharing(false);
    
    // Initialize with video off if in audio-only mode
    setIsVideoOff(mode === 'audio');
    
    // Make sure the call state is marked as active
    if (!callState.isActive && roomUrl && roomToken) {
      console.log("Setting call state to active");
      setCallState(prev => ({
        ...prev,
        isActive: true
      }));
    }
    
    // DO NOT reset the callState.isActive flag in the cleanup function
    // This was causing the component to enter a mounting/unmounting loop
  }, [roomUrl, roomToken, mode, callState.isActive, setCallState, setIsMuted, setIsVideoOff, setIsScreenSharing]);

  // Verify we have the required properties
  if (!roomUrl || !roomToken) {
    console.error("DailyCall: Invalid props for Daily.co initialization", { 
      hasRoomUrl: !!roomUrl, 
      hasRoomToken: !!roomToken 
    });
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">
          Error: Missing required call parameters
        </div>
      </div>
    );
  }

  return (
    <DailyProvider
      url={roomUrl}
      token={roomToken}
    >
      <DailyInitializer />
      {children}
    </DailyProvider>
  );
} 