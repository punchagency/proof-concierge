"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { CallMode, CallState } from "@/types/communication";
import { createCall, endCall } from "@/lib/api/communication";
import DailyIframe, { DailyEventObjectFatalError } from "@daily-co/daily-js";

// Global variable to track if a Daily iframe is already created
// This helps prevent duplicate instances across component re-renders
let dailyIframeExists = false;

interface CallContextType {
  callState: CallState;
  startCall: (userId: number, mode: CallMode) => Promise<void>;
  endCurrentCall: () => Promise<void>;
  toggleAudio: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
  });
  const [isStartingCall, setIsStartingCall] = useState(false);
  const callAttemptRef = useRef(0);

  // Helper function to clean up Daily.co iframes
  const cleanupDailyIframes = () => {
    try {
      // First, find all Daily iframes
      const existingIframes = document.querySelectorAll(
        "iframe[data-daily-iframe]"
      );
      if (existingIframes.length > 0) {
        console.log(`Cleaning up ${existingIframes.length} Daily iframe(s)`);
        existingIframes.forEach((iframe) => iframe.remove());
      }

      // Also look for any iframe with daily in the src
      const otherIframes = document.querySelectorAll('iframe[src*="daily"]');
      if (otherIframes.length > 0) {
        console.log(`Cleaning up ${otherIframes.length} other Daily iframe(s)`);
        otherIframes.forEach((iframe) => iframe.remove());
      }

      // Reset the global flag
      dailyIframeExists = false;
    } catch (error) {
      console.error("Error cleaning up iframes:", error);
    }
  };

  // Clean up call on unmount
  useEffect(() => {
    // Clean up on component mount to ensure no lingering iframes
    cleanupDailyIframes();

    return () => {
      if (callState.callInstance) {
        try {
          console.log("Component unmounting, cleaning up call instance");
          callState.callInstance.destroy();
        } catch (error) {
          console.error("Error destroying call instance:", error);
        }
      }

      // Also clean up any lingering iframes
      cleanupDailyIframes();
    };
  }, [callState.callInstance]);

  const startCall = async (userId: number, mode: CallMode) => {
    try {
      // Prevent multiple simultaneous call starts
      if (isStartingCall) {
        console.log(
          "Call start already in progress, ignoring duplicate request"
        );
        return;
      }

      // Check if a Daily iframe already exists globally
      if (dailyIframeExists) {
        console.log("Daily iframe already exists globally, cleaning up first");
        cleanupDailyIframes();
      }

      setIsStartingCall(true);
      callAttemptRef.current += 1;
      const currentAttempt = callAttemptRef.current;

      // End any existing call first
      if (callState.isActive && callState.callInstance) {
        console.log("Ending existing call before starting a new one");
        await endCurrentCall();
      }

      console.log(`Starting ${mode} call with user ID: ${userId}`);

      // Create a new call
      const response = await createCall(userId, mode);
      console.log("Call created successfully:", response);

      // If another attempt has started, abort this one
      if (currentAttempt !== callAttemptRef.current) {
        console.log("Newer call attempt in progress, aborting this one");
        setIsStartingCall(false);
        return;
      }

      const roomData = response.data?.data?.admin; // Using admin token for now

      // Check if roomData exists and has the required properties
      if (!roomData || !roomData.roomUrl || !roomData.roomToken) {
        console.error("Invalid room data received:", roomData);
        setIsStartingCall(false);
        throw new Error(
          "Failed to create call: Invalid room data received from server"
        );
      }

      // Make sure any existing iframe is destroyed before creating a new one
      cleanupDailyIframes();

      // Set the global flag to indicate a Daily iframe is being created
      dailyIframeExists = true;

      // Create the Daily.co iframe
      console.log("Creating new Daily iframe");
      const callInstance = DailyIframe.createFrame({
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "none",
          background: "#f6f6f6",
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      // Set up event listeners
      callInstance.on("left-meeting", () => {
        console.log("User left the meeting");
        setCallState((prev) => ({
          ...prev,
          isActive: false,
        }));
        callInstance.destroy();
        dailyIframeExists = false;
      });

      callInstance.on("joining-meeting", () => {
        console.log("Joining meeting...");
      });

      callInstance.on("joined-meeting", () => {
        console.log("Successfully joined meeting");
      });

      callInstance.on("error", (error: DailyEventObjectFatalError) => {
        console.error("Daily.co error:", error);
        setIsStartingCall(false);
        dailyIframeExists = false;
      });

      // Join the call
      console.log("Joining call with URL:", roomData.roomUrl);
      await callInstance.join({
        url: roomData.roomUrl,
        token: roomData.roomToken,
        startVideoOff: mode === CallMode.AUDIO,
      });

      // Update state
      setCallState({
        isActive: true,
        roomData,
        callInstance,
      });

      setIsStartingCall(false);
    } catch (error) {
      console.error("Failed to start call:", error);
      setIsStartingCall(false);
      dailyIframeExists = false;

      // Clean up any iframes that might have been created
      cleanupDailyIframes();

      throw error;
    }
  };

  const endCurrentCall = async () => {
    try {
      if (callState.isActive && callState.callInstance) {
        console.log("Ending call...");

        // Leave the call
        await callState.callInstance.leave();
        callState.callInstance.destroy();

        // Delete the room on the server
        if (callState.roomData) {
          console.log("Deleting room:", callState.roomData.roomName);
          await endCall(callState.roomData.roomName);
        }

        // Reset state
        setCallState({
          isActive: false,
        });

        // Reset the global flag
        dailyIframeExists = false;

        // Clean up any lingering iframes
        cleanupDailyIframes();

        console.log("Call ended successfully");
      }
    } catch (error) {
      console.error("Failed to end call:", error);

      // Reset the global flag even if there was an error
      dailyIframeExists = false;

      // Clean up any lingering iframes even if there was an error
      cleanupDailyIframes();

      throw error;
    }
  };

  const toggleAudio = () => {
    if (callState.callInstance) {
      const audioState = callState.callInstance.localAudio();
      console.log(`Toggling audio: ${audioState ? "off" : "on"}`);
      callState.callInstance.setLocalAudio(!audioState);
    }
  };

  const toggleVideo = () => {
    if (callState.callInstance && callState.roomData?.mode === CallMode.VIDEO) {
      const videoState = callState.callInstance.localVideo();
      console.log(`Toggling video: ${videoState ? "off" : "on"}`);
      callState.callInstance.setLocalVideo(!videoState);
    }
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        startCall,
        endCurrentCall,
        toggleAudio,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
