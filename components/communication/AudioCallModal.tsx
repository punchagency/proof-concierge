"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { DockableModal } from '@/components/ui/dockable-modal';
import { useCall } from '@/components/providers/CallProvider';
import { CallMode } from '@/types/communication';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { toast } from 'sonner';

interface AudioCallModalProps {
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

export function AudioCallModal({
  isOpen,
  onClose,
  position,
  totalModals,
  userId,
  profileData,
}: AudioCallModalProps) {
  const { callState, startCall, endCurrentCall, toggleAudio } = useCall();
  const callContainerRef = useRef<HTMLDivElement>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasAttemptedCall, setHasAttemptedCall] = useState(false);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoized function to start the call
  const initiateCall = useCallback(async () => {
    if (isConnecting || callState.isActive || !isOpen) return;
    
    try {
      setIsConnecting(true);
      setHasError(false);
      setHasAttemptedCall(true);
      
      console.log('Initiating audio call to user:', userId);
      await startCall(userId, CallMode.AUDIO);
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to start audio call:', error);
      setIsConnecting(false);
      setHasError(true);
      toast.error('Failed to connect to audio call. Please try again.');
    }
  }, [userId, startCall, isConnecting, callState.isActive, isOpen]);

  // Start audio call when modal opens
  useEffect(() => {
    if (isOpen && !callState.isActive && !hasAttemptedCall) {
      // Add a small delay to prevent rapid consecutive call attempts
      // This helps with Fast Refresh and other scenarios
      callTimeoutRef.current = setTimeout(() => {
        initiateCall();
      }, 500);
    }
    
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
  }, [isOpen, callState.isActive, initiateCall, hasAttemptedCall]);

  // Handle modal close
  const handleClose = async () => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    
    if (callState.isActive) {
      try {
        await endCurrentCall();
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    
    setHasAttemptedCall(false);
    onClose();
  };

  // Retry connection if there was an error
  const handleRetry = () => {
    initiateCall();
  };

  // Attach call iframe to container when call is active
  useEffect(() => {
    if (callState.isActive && callState.callInstance && callContainerRef.current) {
      try {
        // Hide the iframe for audio calls, but keep it in the DOM
        const iframe = callState.callInstance.iframe();
        if (iframe) {
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = 'none';
          iframe.style.position = 'absolute';
          
          // Append the iframe to the container
          callContainerRef.current.innerHTML = '';
          callContainerRef.current.appendChild(iframe);
        }
      } catch (error) {
        console.error('Error attaching iframe to container:', error);
      }
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
        {/* Hidden call container */}
        <div ref={callContainerRef} className="hidden"></div>
        
        {/* Audio call UI */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {isConnecting ? (
            <p className="text-gray-500">Connecting to audio call...</p>
          ) : hasError ? (
            <div className="flex flex-col items-center">
              <p className="text-red-500 mb-4">Failed to connect to audio call</p>
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : !callState.isActive ? (
            <p className="text-gray-500">Connecting to audio call...</p>
          ) : (
            <>
              {/* Profile picture */}
              <div className="w-24 h-24 rounded-full overflow-hidden relative mb-6">
                <img
                  src={profileData.image}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Name and status */}
              <h3 className="text-xl font-semibold mb-1">{profileData.name}</h3>
              <p className="text-sm text-green-500 mb-8">{callState.isActive ? 'Connected' : 'Connecting...'}</p>
              
              {/* Audio visualization */}
              <div className="relative mb-8">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1 h-8 bg-blue-500 animate-pulse-slow"></div>
                  <div className="w-1 h-12 bg-blue-500 animate-pulse-medium"></div>
                  <div className="w-1 h-16 bg-blue-500 animate-pulse-fast"></div>
                  <div className="w-1 h-10 bg-blue-500 animate-pulse-medium"></div>
                  <div className="w-1 h-14 bg-blue-500 animate-pulse-slow"></div>
                </div>
              </div>
              
              {/* Call duration */}
              <p className="text-sm text-gray-500 mb-8">Call in progress</p>
            </>
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