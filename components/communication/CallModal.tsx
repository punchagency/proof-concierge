"use client";

import { useEffect } from 'react';
import { DockableModal } from '@/components/ui/dockable-modal';
import { DailyCall } from './DailyCall';
import { callStateAtom } from './DailyCall';
import { useAtom } from 'jotai';
import { toast } from 'sonner';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  totalModals: number;
  roomUrl: string;
  roomToken: string;
  mode: 'audio' | 'video';
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
  roomUrl,
  roomToken,
  mode,
  profileData,
}: CallModalProps) {
  const [callState, setCallState] = useAtom(callStateAtom);

  const handleLeave = () => {
    setCallState(prev => ({ ...prev, isActive: false }));
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setCallState(prev => ({ ...prev, isActive: false }));
    }
  }, [isOpen]);

  return (
    <DockableModal
      isOpen={isOpen}
      onClose={handleLeave}
      position={position}
      totalModals={totalModals}
      profileData={profileData}
    >
      <DailyCall
        roomUrl={roomUrl}
        roomToken={roomToken}
        mode={mode}
        onLeave={handleLeave}
      />
    </DockableModal>
  );
} 