"use client";

import React, { createContext, useContext, useCallback } from "react";
import { toast } from "sonner";
import { startQueryCall, endCall as endCallApi, updateQueryMode } from "@/lib/api/communication";
import { CallMode } from "@/types/communication";
import { useDockableModal } from "./dockable-modal-provider";
import { QueryDetails } from "../QueryDetails";
import { useAtom } from "jotai";
import { callStateAtom, startCallAtom, endCallAtom, isMutedAtom, isVideoOffAtom, isScreenSharingAtom } from "@/lib/atoms/callState";

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
  const { openModal } = useDockableModal();
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
  const endCallByRoomName = useCallback(async (roomName: string) => {
    try {
      await endCallApi(roomName);
      endCall();
      
      if (currentCallUser) {
        toast.success(`Call with ${currentCallUser.name} ended`);
        setCurrentCallUser(null);
      }
      
      if (currentQueryId) {
        await updateQueryMode(currentQueryId, "Text");
        setCurrentQueryId(null);
      }
    } catch (error) {
      console.error("Error ending call:", error);
      toast.error("Failed to end call. Please try again.");
    }
  }, [endCall, currentCallUser, currentQueryId]);

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
      const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.VIDEO);
      
      // Start the call
      startCall({
        queryId,
        userId,
        mode: CallMode.VIDEO,
        roomUrl: callResponse.data.admin.roomUrl,
        roomToken: callResponse.data.admin.roomToken,
        roomName: callResponse.data.admin.roomName
      });
      
      // Store the current user and queryId for reference
      setCurrentCallUser(profileData);
      setCurrentQueryId(queryId);
      
      toast.success(`Starting video call with ${profileData.name}`);
      
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
      const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.AUDIO);
      
      // Start the call
      startCall({
        queryId,
        userId,
        mode: CallMode.AUDIO,
        roomUrl: callResponse.data.admin.roomUrl,
        roomToken: callResponse.data.admin.roomToken,
        roomName: callResponse.data.admin.roomName
      });
      
      // Store the current user and queryId for reference
      setCurrentCallUser(profileData);
      setCurrentQueryId(queryId);
      
      toast.success(`Starting audio call with ${profileData.name}`);
      
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
    } catch (error) {
      console.error("Error starting audio call:", error);
      toast.error("Failed to start audio call. Please try again.");
    }
  }, [callState.isActive, startCall, openModal]);

  // Function to end the current call
  const endCurrentCall = useCallback(async () => {
    if (!callState.isActive || !callState.roomName) {
      return;
    }

    try {
      // End the call on the backend
      await endCallApi(callState.roomName);
      
      // Reset call state via Jotai atom
      endCall();
      
      if (currentCallUser) {
        toast.success(`Call with ${currentCallUser.name} ended`);
        setCurrentCallUser(null);
      }
      
      // Update the query mode back to Text if we have a query ID
      if (currentQueryId) {
        await updateQueryMode(currentQueryId, "Text");
        setCurrentQueryId(null);
      }
    } catch (error) {
      console.error("Error ending call:", error);
      toast.error("Failed to end call. Please try again.");
    }
  }, [callState.isActive, callState.roomName, endCall, currentCallUser, currentQueryId]);

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