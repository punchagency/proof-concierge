"use client";

import { useEffect, useState } from 'react';
import { DockableModal } from '@/components/ui/dockable-modal';
import { DailyCall } from './DailyCall';
import { useAtom } from 'jotai';
import { callStateAtom, endCallAtom } from '@/lib/atoms/callState';
import { CallUI } from './CallUI';
import { Loader2 } from 'lucide-react';
import { useDaily } from '@daily-co/daily-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  totalModals: number;
  profileData: {
    name: string;
    image: string;
    status: string;
  };
}

export function CallModal({
  isOpen,
  onClose,
  position,
  totalModals,
  profileData,
}: CallModalProps) {
  const [callState, setCallState] = useAtom(callStateAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [isConnecting, setIsConnecting] = useState(true);
  const daily = useDaily();

  const handleLeave = () => {
    console.log("Ending call from handleLeave");
    if (daily) {
      daily.leave().then(() => {
        console.log("Successfully left the Daily call from modal");
        endCall();
        onClose();
      }).catch(err => {
        console.error("Error leaving the Daily call from modal:", err);
        // Still try to end the call even if there was an error leaving
        endCall();
        onClose();
      });
    } else {
      // If daily instance isn't available, just end the call
      endCall();
      onClose();
    }
  };

  // Make sure call state is active when modal is open
  useEffect(() => {
    if (isOpen && !callState.isActive && callState.roomUrl && callState.roomToken) {
      console.log("Modal is open but call state is inactive - activating");
      setCallState(prev => ({
        ...prev,
        isActive: true
      }));
    }
  }, [isOpen, callState, setCallState]);

  // Set connecting state just for the profile data status
  useEffect(() => {
    if (isOpen) {
      setIsConnecting(true);
      const timer = setTimeout(() => {
        setIsConnecting(false);
      }, 8000);
      return () => clearTimeout(timer);
    } else {
      setIsConnecting(false);
    }
  }, [isOpen]);

  // Debug call state changes
  useEffect(() => {
    console.log("CallModal debug - Current call state:", {
      isOpen,
      callStateActive: callState.isActive,
      hasRoomUrl: !!callState.roomUrl,
      hasRoomToken: !!callState.roomToken,
      mode: callState.mode,
      isConnecting
    });
  }, [isOpen, callState, isConnecting]);

  // Ensure profile data reflects the current call state
  const callProfileData = {
    name: callState.mode === 'video' ? 'Video Call' : 'Audio Call',
    image: profileData.image || '',
    status: isConnecting ? 'Connecting...' : (callState.isActive ? 'Connected' : 'Not connected')
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  // Check if we have the required data to join a call
  const hasRequiredCallData = callState.roomUrl && callState.roomToken;

  return (
    <DockableModal
      isOpen={isOpen}
      onClose={handleLeave}
      position={position}
      totalModals={totalModals}
      profileData={callProfileData}
    >
      <div className="h-full -mx-4 -my-4"> {/* Full height and compensate for modal padding */}
        {!hasRequiredCallData ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
            <div className="text-lg font-semibold">Connecting to call...</div>
            <div className="text-sm text-gray-500 mt-2">
              {!callState.roomUrl ? "Missing room URL" : 
               !callState.roomToken ? "Missing room token" : "Waiting for call data..."}
            </div>
            
            <button 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleLeave}
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Main call UI with DailyCall which will show its own loading UI */
          <DailyCall
            roomUrl={callState.roomUrl || ''}
            roomToken={callState.roomToken || ''}
            mode={callState.mode === 'video' ? 'video' : 'audio'}
          >
            <CallUI onLeave={handleLeave} />
          </DailyCall>
        )}
      </div>
    </DockableModal>
  );
} 