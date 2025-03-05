"use client";

import { useState } from 'react';
import { VideoCallModal } from './VideoCallModal';
import { AudioCallModal } from './AudioCallModal';
import { CallMode } from '@/types/communication';

interface CallManagerProps {
  // No props needed as this component manages its own state
}

export function CallManager({}: CallManagerProps) {
  const [activeModals, setActiveModals] = useState<Array<{
    id: string;
    type: CallMode;
    userId: number;
    profileData: {
      name: string;
      image: string;
      status: string;
    };
  }>>([]);

  // Function to start a new call
  const startCall = (userId: number, type: CallMode, profileData: any) => {
    const modalId = `call-${userId}-${Date.now()}`;
    
    setActiveModals(prev => [
      ...prev,
      {
        id: modalId,
        type,
        userId,
        profileData,
      }
    ]);
    
    return modalId;
  };

  // Function to close a call
  const closeCall = (modalId: string) => {
    setActiveModals(prev => prev.filter(modal => modal.id !== modalId));
  };

  return (
    <>
      {activeModals.map((modal, index) => {
        if (modal.type === CallMode.VIDEO) {
          return (
            <VideoCallModal
              key={modal.id}
              isOpen={true}
              onClose={() => closeCall(modal.id)}
              position={index}
              totalModals={activeModals.length}
              userId={modal.userId}
              profileData={modal.profileData}
            />
          );
        } else {
          return (
            <AudioCallModal
              key={modal.id}
              isOpen={true}
              onClose={() => closeCall(modal.id)}
              position={index}
              totalModals={activeModals.length}
              userId={modal.userId}
              profileData={modal.profileData}
            />
          );
        }
      })}
    </>
  );
}

// Export a hook to use the call manager
export function useCallManager() {
  // This would be implemented with context in a real app
  // For now, we'll just return the functions that would be available
  
  return {
    startVideoCall: (userId: number, profileData: any) => {
      // In a real implementation, this would call the startCall function from the CallManager
      console.log('Starting video call with user', userId);
    },
    startAudioCall: (userId: number, profileData: any) => {
      // In a real implementation, this would call the startCall function from the CallManager
      console.log('Starting audio call with user', userId);
    }
  };
} 