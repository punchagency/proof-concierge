"use client";

import React, { createContext, useContext, useCallback } from "react";
import { toast } from "sonner";
import { startQueryCall, endCall as endCallApi, updateQueryMode } from "@/lib/api/communication";
import { CallMode } from "@/types/communication";
import { QueryDetails } from "../QueryDetails";
import { useAtom } from "jotai";
import { callStateAtom, startCallAtom, endCallAtom, isMutedAtom, isVideoOffAtom, isScreenSharingAtom } from "@/lib/atoms/callState";
import contextBridge from "@/lib/context-bridge";

interface ProfileData {
  name: string;
  image: string;
  status: string;
}

interface CallManagerContextType {
  startVideoCall: (queryId: number, userId: number, profileData: ProfileData) => void;
  startAudioCall: (queryId: number, userId: number, profileData: ProfileData) => void;
  endCurrentCall: () => void;
  endCall: (roomName: string) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  isInCall: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  currentCallType: "video" | "audio" | null;
  currentCallUser: ProfileData | null;
  currentCallData: {
    roomName: string;
    roomUrl: string;
    roomToken: string;
    queryId: number;
    userId: number;
  } | null;
}

const CallManagerContext = createContext<CallManagerContextType | undefined>(undefined);

export function useCallManager() {
  const context = useContext(CallManagerContext);
  if (!context) {
    throw new Error("useCallManager must be used within a CallManagerProvider");
  }
  return context;
}

export function CallManagerProvider({ children }: { children: React.ReactNode }) {
  // Get the dockable modal context through the bridge
  const dockableModalContext = contextBridge.getDockableModalContext();
  
  // Define a safe openModal function
  const openModal = useCallback((
    id: string, 
    content: React.ReactNode, 
    profileData: { name: string; image: string; status: string }
  ) => {
    if (dockableModalContext) {
      dockableModalContext.openModal(id, content, profileData);
    } else {
      console.warn("openModal called but DockableModalProvider is not available");
    }
  }, [dockableModalContext]);
  
  const [callState] = useAtom(callStateAtom);
  const [, startCall] = useAtom(startCallAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [, setIsMuted] = useAtom(isMutedAtom);
  const [, setIsVideoOff] = useAtom(isVideoOffAtom);
  const [, setIsScreenSharing] = useAtom(isScreenSharingAtom);
  
  const [currentCallUser, setCurrentCallUser] = React.useState<ProfileData | null>(null);
  const [currentQueryId, setCurrentQueryId] = React.useState<number | null>(null);

  // Function to toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted(!callState.isMuted);
  }, [callState.isMuted, setIsMuted]);

  // Function to toggle video state
  const toggleVideo = useCallback(() => {
    setIsVideoOff(!callState.isVideoOff);
  }, [callState.isVideoOff, setIsVideoOff]);

  // Function to toggle screen sharing state
  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing(!callState.isScreenSharing);
  }, [callState.isScreenSharing, setIsScreenSharing]);

  // Helper function to end a specific call by roomName
  const endCallByRoomName = useCallback((roomName: string) => {
    // Immediately update UI state
    endCall();
    setCurrentCallUser(null);
    setCurrentQueryId(null);
    
    // Handle API calls without blocking UI
    queueMicrotask(() => {
      endCallApi(roomName)
        .then(() => {
          if (currentQueryId) {
            return updateQueryMode(currentQueryId, "Text");
          }
        })
        .catch(error => {
          console.error("Error ending call:", error);
        });
    });
  }, [endCall, currentQueryId]);

  // Function to validate and normalize room URL
  const validateRoomUrl = (roomUrl: string, roomName: string): string => {
    if (!roomUrl) {
      console.error("Missing roomUrl in call response");
      return "";
    }
    
    // If URL is already valid, return it
    try {
      new URL(roomUrl);
      return roomUrl;
    } catch (e) {
      // URL is not valid, try to fix it
      console.warn("Room URL is not valid, attempting to correct:", roomUrl);
      
      // If it has protocol but still invalid, it's malformed
      if (roomUrl.startsWith('http')) {
        console.error("URL has protocol but is still invalid");
        return "";
      }
      
      // Try to construct a valid URL with https:// prefix
      try {
        const fixedUrl = `https://${roomUrl}`;
        new URL(fixedUrl); // This will throw if still invalid
        return fixedUrl;
      } catch (err) {
        console.error("Failed to correct invalid URL:", err);
        
        // Last resort: try to build from roomName
        if (roomName) {
          return `https://prooftest.daily.co/${roomName}`;
        }
        
        return "";
      }
    }
  };

  // Function to start a video call
  const startVideoCall = useCallback(async (queryId: number, userId: number, profileData: ProfileData) => {
    if (callState.isActive) {
      toast.error("You are already in a call. Please end the current call first.");
      return;
    }

    try {
      // Update the query mode in the database
      await updateQueryMode(queryId, "Video Call");

      // Create a call room
      try {
        const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.VIDEO);
        
        console.log("Video call response:", callResponse);
        
        // Validate required data
        if (!callResponse?.data?.admin?.roomName) {
          throw new Error("Missing room name in call response");
        }
        
        // Validate and normalize the room URL
        const roomName = callResponse.data.admin.roomName;
        const roomUrl = validateRoomUrl(
          callResponse.data.admin.roomUrl,
          roomName
        );
        
        if (!roomUrl) {
          throw new Error("Invalid room URL");
        }
        
        if (!callResponse.data.admin.roomToken) {
          throw new Error("Missing room token in call response");
        }
        
        // Start the call
        startCall({
          queryId,
          userId,
          mode: CallMode.VIDEO,
          roomUrl: roomUrl,
          roomToken: callResponse.data.admin.roomToken,
          roomName: roomName
        });
        
        // Store the current user and queryId for reference
        setCurrentCallUser(profileData);
        setCurrentQueryId(queryId);
        
        // Open the query details modal with updated query mode
        openModal(
          `query-${queryId}`,
          <QueryDetails 
            data={{
              id: queryId,
              donor: profileData.name,
              donorId: userId.toString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              test: "Test",
              device: "Device",
              stage: "Stage",
              dateNdTime: new Date().toISOString(),
              status: "In Progress"
            }} 
          />,
          profileData
        );
      } catch (error: any) {
        // Reset the query mode if call creation failed
        await updateQueryMode(queryId, "Text");
        
        // Handle specific error for active calls
        if (error?.response?.data?.statusCode === 500 && 
            error?.response?.data?.message?.includes("already an active call")) {
          toast.error("There is already an active call for this query. Please end the existing call before starting a new one.");
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to start video call. Please try again.");
    }
  }, [callState.isActive, startCall, openModal]);

  // Function to start an audio call
  const startAudioCall = useCallback(async (queryId: number, userId: number, profileData: ProfileData) => {
    if (callState.isActive) {
      toast.error("You are already in a call. Please end the current call first.");
      return;
    }

    try {
      // Update the query mode in the database
      await updateQueryMode(queryId, "Huddle");

      // Create a call room
      try {
        const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.AUDIO);
        
        console.log("Audio call response:", callResponse);
        
        // Validate required data
        if (!callResponse?.data?.admin?.roomName) {
          throw new Error("Missing room name in call response");
        }
        
        // Validate and normalize the room URL
        const roomName = callResponse.data.admin.roomName;
        const roomUrl = validateRoomUrl(
          callResponse.data.admin.roomUrl,
          roomName
        );
        
        if (!roomUrl) {
          throw new Error("Invalid room URL");
        }
        
        if (!callResponse.data.admin.roomToken) {
          throw new Error("Missing room token in call response");
        }
        
        // Start the call
        startCall({
          queryId,
          userId,
          mode: CallMode.AUDIO,
          roomUrl: roomUrl,
          roomToken: callResponse.data.admin.roomToken,
          roomName: roomName
        });
        
        // Store the current user and queryId for reference
        setCurrentCallUser(profileData);
        setCurrentQueryId(queryId);
        
        // Open the query details modal with updated query mode
        openModal(
          `query-${queryId}`,
          <QueryDetails 
            data={{
              id: queryId,
              donor: profileData.name,
              donorId: userId.toString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              test: "Test",
              device: "Device",
              stage: "Stage",
              dateNdTime: new Date().toISOString(),
              status: "In Progress"
            }} 
          />,
          profileData
        );
      } catch (error: any) {
        // Reset the query mode if call creation failed
        await updateQueryMode(queryId, "Text");
        
        // Handle specific error for active calls
        if (error?.response?.data?.statusCode === 500 && 
            error?.response?.data?.message?.includes("already an active call")) {
          toast.error("There is already an active call for this query. Please end the existing call before starting a new one.");
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error("Error starting audio call:", error);
      toast.error("Failed to start audio call. Please try again.");
    }
  }, [callState.isActive, startCall, openModal]);

  // Function to end the current call
  const endCurrentCall = useCallback(() => {
    if (!callState.isActive || !callState.roomName) {
      return;
    }

    // Immediately update UI state
    endCall();
    setCurrentCallUser(null);
    setCurrentQueryId(null);
    
    // Store references to avoid closure issues
    const roomName = callState.roomName;
    const queryId = currentQueryId;
    
    // Handle API calls without blocking UI
    queueMicrotask(() => {
      endCallApi(roomName)
        .then(() => {
          if (queryId) {
            return updateQueryMode(queryId, "Text");
          }
        })
        .catch(error => {
          console.error("Error ending call:", error);
        });
    });
  }, [callState.isActive, callState.roomName, endCall, currentQueryId]);

  return (
    <CallManagerContext.Provider
      value={{
        startVideoCall,
        startAudioCall,
        endCurrentCall,
        endCall: endCallByRoomName,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        isInCall: callState.isActive,
        isMuted: callState.isMuted,
        isVideoOff: callState.isVideoOff,
        isScreenSharing: callState.isScreenSharing,
        currentCallType: callState.mode === CallMode.VIDEO ? "video" : callState.mode === CallMode.AUDIO ? "audio" : null,
        currentCallUser,
        currentCallData: callState.isActive && callState.roomName && callState.roomUrl && callState.roomToken && callState.queryId && callState.userId ? {
          roomName: callState.roomName,
          roomUrl: callState.roomUrl,
          roomToken: callState.roomToken,
          queryId: callState.queryId,
          userId: callState.userId
        } : null,
      }}
    >
      {children}
    </CallManagerContext.Provider>
  );
} 