"use client";

import { useEffect } from 'react';
import { DockableModal } from '@/components/ui/dockable-modal';
import { DailyCall } from './DailyCall';
import { useAtom } from 'jotai';
import { callStateAtom, endCallAtom } from '@/lib/atoms/callState';
import { CallUI } from './CallUI';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

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
  const { user } = useAuth();

  const handleLeave = () => {
    console.log("Ending call from handleLeave");
    endCall();
    onClose();
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

  // Debug call state changes
  useEffect(() => {
    console.log("CallModal debug - Current call state:", {
      isOpen,
      callStateActive: callState.isActive,
      hasRoomUrl: !!callState.roomUrl,
      hasRoomToken: !!callState.roomToken,
      mode: callState.mode
    });
  }, [isOpen, callState]);

  // Ensure profile data reflects the current call state
  const callProfileData = {
    name: callState.mode === 'video' ? 'Video Call' : 'Audio Call',
    image: profileData.image || '',
    status: callState.isActive ? 'Connected' : 'Connecting...'
  };

  // If modal is not open, don't render anything
  if (!isOpen) {
    return null;
  }

  return (
    <DockableModal
      isOpen={isOpen}
      onClose={handleLeave}
      position={position}
      totalModals={totalModals}
      profileData={callProfileData}
    >
      <div className="h-full -mx-4 -my-4"> {/* Full height and compensate for modal padding */}
        {/* If we have incomplete call data, show a connecting UI */}
        {(!callState.roomUrl || !callState.roomToken) ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
            <div className="text-lg font-semibold">Connecting to call...</div>
            <div className="text-sm text-gray-500 mt-2">
              {!callState.roomUrl ? "Missing room URL" :
              !callState.roomToken ? "Missing room token" : "Connecting..."}
            </div>
            
            <button 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleLeave}
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Main call UI */
          <DailyCall
            roomUrl={callState.roomUrl}
            roomToken={callState.roomToken}
            mode={callState.mode === 'video' ? 'video' : 'audio'}
          >
            <CallUI onLeave={handleLeave} />
          </DailyCall>
        )}
      </div>
    </DockableModal>
  );
} 