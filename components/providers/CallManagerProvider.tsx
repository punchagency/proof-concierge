"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";
import { startQueryCall, endCall, updateQueryMode } from "@/lib/api/communication";
import { CallMode } from "@/types/communication";
import { useDockableModal } from "./dockable-modal-provider";
import { QueryDetails } from "../QueryDetails";

interface ProfileData {
  name: string;
  image: string;
  status: string;
}

interface CallData {
  roomName: string;
  roomUrl: string;
  roomToken: string;
  mode: CallMode;
}

interface CallManagerContextType {
  startVideoCall: (queryId: number, userId: number, profileData: ProfileData) => void;
  startAudioCall: (queryId: number, userId: number, profileData: ProfileData) => void;
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
  currentCallData: CallData | null;
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
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [currentCallType, setCurrentCallType] = useState<"video" | "audio" | null>(null);
  const [currentCallUser, setCurrentCallUser] = useState<ProfileData | null>(null);
  const [currentCallData, setCurrentCallData] = useState<CallData | null>(null);
  const [currentQueryId, setCurrentQueryId] = useState<number | null>(null);

  // Function to start a video call
  const startVideoCall = useCallback(async (queryId: number, userId: number, profileData: ProfileData) => {
    if (isInCall) {
      toast.error("You are already in a call. Please end the current call first.");
      return;
    }

    try {
      // Update the query mode in the database
      await updateQueryMode(queryId, "Video Call");

      // Create a call room
      const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.VIDEO);
      
      // Set call state
      setIsInCall(true);
      setCurrentCallType("video");
      setCurrentCallUser(profileData);
      setCurrentQueryId(queryId);
      setCurrentCallData({
        roomName: callResponse.data.admin.roomName,
        roomUrl: callResponse.data.admin.roomUrl,
        roomToken: callResponse.data.admin.roomToken,
        mode: CallMode.VIDEO,
      });
      
      toast.success(`Starting video call with ${profileData.name}`);
      
      // Open the query details modal with updated query mode
      openModal(
        `query-${queryId}`,
        <QueryDetails 
          data={{
            id: queryId,
            sid: queryId.toString(),
            donor: profileData.name,
            donorId: userId.toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            test: "Test",
            device: "Device",
            stage: "Stage",
            dateNdTime: new Date().toISOString(),
            queryMode: "Video Call",
            status: "In Progress"
          }} 
        />,
        profileData
      );
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to start video call. Please try again.");
    }
  }, [isInCall, openModal]);

  // Function to start an audio call
  const startAudioCall = useCallback(async (queryId: number, userId: number, profileData: ProfileData) => {
    if (isInCall) {
      toast.error("You are already in a call. Please end the current call first.");
      return;
    }

    try {
      // Update the query mode in the database
      await updateQueryMode(queryId, "Huddle");

      // Create a call room
      const callResponse = await startQueryCall(queryId, userId.toString(), CallMode.AUDIO);
      
      // Set call state
      setIsInCall(true);
      setCurrentCallType("audio");
      setCurrentCallUser(profileData);
      setCurrentQueryId(queryId);
      setCurrentCallData({
        roomName: callResponse.data.admin.roomName,
        roomUrl: callResponse.data.admin.roomUrl,
        roomToken: callResponse.data.admin.roomToken,
        mode: CallMode.AUDIO,
      });
      
      toast.success(`Starting audio call with ${profileData.name}`);
      
      // Open the query details modal with updated query mode
      openModal(
        `query-${queryId}`,
        <QueryDetails 
          data={{
            id: queryId,
            sid: queryId.toString(),
            donor: profileData.name,
            donorId: userId.toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            test: "Test",
            device: "Device",
            stage: "Stage",
            dateNdTime: new Date().toISOString(),
            queryMode: "Huddle",
            status: "In Progress"
          }} 
        />,
        profileData
      );
    } catch (error) {
      console.error("Error starting audio call:", error);
      toast.error("Failed to start audio call. Please try again.");
    }
  }, [isInCall, openModal]);

  // Function to end the current call
  const handleEndCall = useCallback(async (roomName: string) => {
    if (!isInCall) {
      return;
    }

    try {
      // End the call on the backend
      await endCall(roomName);
      
      // Reset call state
      setIsInCall(false);
      setCurrentCallType(null);
      setCurrentCallData(null);
      setIsMuted(false);
      setIsVideoOff(false);
      setIsScreenSharing(false);
      
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
  }, [isInCall, currentCallUser, currentQueryId]);

  // Function to toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    toast.success(isMuted ? "Microphone unmuted" : "Microphone muted");
  }, [isMuted]);

  // Function to toggle video
  const toggleVideo = useCallback(() => {
    setIsVideoOff(prev => !prev);
    toast.success(isVideoOff ? "Camera turned on" : "Camera turned off");
  }, [isVideoOff]);

  // Function to toggle screen sharing
  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing(prev => !prev);
    toast.success(isScreenSharing ? "Screen sharing stopped" : "Screen sharing started");
  }, [isScreenSharing]);

  return (
    <CallManagerContext.Provider
      value={{
        startVideoCall,
        startAudioCall,
        endCall: handleEndCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        isInCall,
        isMuted,
        isVideoOff,
        isScreenSharing,
        currentCallType,
        currentCallUser,
        currentCallData,
      }}
    >
      {children}
    </CallManagerContext.Provider>
  );
} 