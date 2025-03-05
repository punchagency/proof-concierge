"use client";

import { useEffect, useRef } from 'react';
import { DockableModal } from '@/components/ui/dockable-modal';
import { useCall } from '@/components/providers/CallProvider';
import { CallMode } from '@/types/communication';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  totalModals: number;
  userId: number;
  profileData: {
    name: string;
    image: string;
    status: string;
  };
}

export function VideoCallModal({
  isOpen,
  onClose,
  position,
  totalModals,
  userId,
  profileData,
}: VideoCallModalProps) {
  const { callState, startCall, endCurrentCall, toggleAudio, toggleVideo } = useCall();
  const callContainerRef = useRef<HTMLDivElement>(null);

  // Start video call when modal opens
  useEffect(() => {
    if (isOpen && !callState.isActive) {
      startCall(userId, CallMode.VIDEO).catch(error => {
        console.error('Failed to start video call:', error);
        onClose();
      });
    }
  }, [isOpen, callState.isActive, userId, startCall, onClose]);

  // Handle modal close
  const handleClose = async () => {
    if (callState.isActive) {
      await endCurrentCall();
    }
    onClose();
  };

  // Attach call iframe to container when call is active
  useEffect(() => {
    if (callState.isActive && callState.callInstance && callContainerRef.current) {
      callState.callInstance.iframe().style.width = '100%';
      callState.callInstance.iframe().style.height = '100%';
      callState.callInstance.iframe().style.border = 'none';
      
      // Append the iframe to the container
      callContainerRef.current.innerHTML = '';
      callContainerRef.current.appendChild(callState.callInstance.iframe());
    }
  }, [callState.isActive, callState.callInstance]);

  return (
    <DockableModal
      isOpen={isOpen}
      onClose={handleClose}
      position={position}
      totalModals={totalModals}
      profileData={profileData}
    >
      <div className="flex flex-col h-full">
        {/* Call container */}
        <div ref={callContainerRef} className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
          {!callState.isActive && (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">Connecting to video call...</p>
            </div>
          )}
        </div>
        
        {/* Call controls */}
        {callState.isActive && (
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={toggleAudio}
              className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {callState.callInstance?.localAudio() ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5 text-red-500" />
              )}
            </button>
            
            <button
              onClick={toggleVideo}
              className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {callState.callInstance?.localVideo() ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5 text-red-500" />
              )}
            </button>
            
            <button
              onClick={endCurrentCall}
              className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-5 w-5 text-white" />
            </button>
          </div>
        )}
      </div>
    </DockableModal>
  );
} 