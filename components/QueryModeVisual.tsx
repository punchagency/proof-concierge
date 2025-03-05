import { cn } from "@/lib/utils";
import Image from "next/image";
import { useCallManager } from "./providers/CallManagerProvider";
import { Video, Phone, User, Mic, MicOff, Monitor, X, Camera, CameraOff } from "lucide-react";
import { useState, useEffect } from "react";

interface QueryModeVisualProps {
  mode: "Text" | "Huddle" | "Video Call";
  profileData: {
    name: string;
    image: string;
    status: string;
  };
  userId?: number; // Add userId prop for call functionality
  queryId?: number; // Add queryId prop for call functionality
}

export function QueryModeVisual({ mode, profileData, userId = 1, queryId = 1 }: QueryModeVisualProps) {
  const { 
    startVideoCall, 
    startAudioCall, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    toggleScreenShare,
    isInCall,
    isMuted,
    isVideoOff,
    isScreenSharing,
    currentCallData
  } = useCallManager();
  const [imageError, setImageError] = useState(false);

  // Function to handle starting a video call
  const handleVideoCall = () => {
    if (queryId && userId) {
      startVideoCall(queryId, userId, profileData);
    }
  };

  // Function to handle starting an audio call
  const handleAudioCall = () => {
    if (queryId && userId) {
      startAudioCall(queryId, userId, profileData);
    }
  };

  // Function to handle ending a call
  const handleEndCall = () => {
    if (currentCallData?.roomName) {
      endCall(currentCallData.roomName);
    }
  };

  // Function to handle image error
  const handleImageError = () => {
    setImageError(true);
  };

  // Auto-join call based on mode when component mounts
  useEffect(() => {
    // Only auto-join if not already in a call
    if (!isInCall && queryId && userId) {
      if (mode === "Video Call") {
        startVideoCall(queryId, userId, profileData);
      } else if (mode === "Huddle") {
        startAudioCall(queryId, userId, profileData);
      }
    }
  }, [mode, isInCall, queryId, userId, profileData, startVideoCall, startAudioCall]);

  if (mode === "Huddle") {
    // Use the specific image for Huddle mode
    const huddleImage = profileData.image || "/images/default-avatar.png";
    
    return (
      <div className="w-full h-full flex items-center justify-center relative">
        <div className="relative">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-full overflow-hidden relative bg-gray-200 flex items-center justify-center">
            {imageError ? (
              <User className="h-12 w-12 text-gray-400" />
            ) : (
              <Image
                src={huddleImage}
                alt={profileData.name}
                width={96}
                height={96}
                className="object-cover"
                onError={handleImageError}
                unoptimized // Skip Next.js image optimization for external URLs
              />
            )}
          </div>
          
          {/* Audio Pulse Rings */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 animate-pulse-ring-1 border-2 border-[#B45309] rounded-full opacity-20" />
            <div className="absolute inset-0 animate-pulse-ring-2 border-2 border-[#B45309] rounded-full opacity-15" />
            <div className="absolute inset-0 animate-pulse-ring-3 border-2 border-[#B45309] rounded-full opacity-10" />
          </div>

          {/* Call Controls */}
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            {isInCall ? (
              <>
                <button
                  onClick={toggleMute}
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    isMuted ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-200 hover:bg-gray-300"
                  )}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleEndCall}
                  className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleAudioCall}
                className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
              >
                <Phone className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === "Video Call") {
    return (
      <div className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative">
        {/* Main Video Feed */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
            {imageError || isVideoOff ? (
              <User className="h-16 w-16 text-gray-400" />
            ) : (
              <Image
                src={profileData.image}
                alt={profileData.name}
                width={400}
                height={300}
                className="object-cover w-full h-full"
                onError={handleImageError}
                unoptimized // Skip Next.js image optimization for external URLs
              />
            )}
          </div>
        </div>

        {/* Self Video Preview */}
        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-white text-sm">You</span>
          </div>
        </div>

        {/* Video Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4 bg-gray-800/80 px-4 py-2 rounded-full">
          {isInCall ? (
            <>
              <button
                onClick={toggleVideo}
                className={cn(
                  "p-2 rounded-full hover:bg-gray-700 text-white",
                  isVideoOff && "text-red-400"
                )}
              >
                {isVideoOff ? <CameraOff className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleMute}
                className={cn(
                  "p-2 rounded-full hover:bg-gray-700 text-white",
                  isMuted && "text-red-400"
                )}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleScreenShare}
                className={cn(
                  "p-2 rounded-full hover:bg-gray-700 text-white",
                  isScreenSharing && "text-green-400"
                )}
              >
                <Monitor className="w-6 h-6" />
              </button>
              <button
                onClick={handleEndCall}
                className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </>
          ) : (
            <button
              onClick={handleVideoCall}
              className="p-2 rounded-full hover:bg-gray-700 text-white"
            >
              <Video className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
} 