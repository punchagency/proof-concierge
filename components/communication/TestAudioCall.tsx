"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCall } from '@/components/providers/CallProvider';
import { AudioCallModal } from './AudioCallModal';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';
import { deleteAllRooms } from '@/lib/api/communication';

export function TestAudioCall() {
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [userId] = useState(123); // Test user ID
  const [profileData] = useState({
    name: "Test User",
    image: "https://i.pravatar.cc/300",
    status: "Available"
  });
  const [isDeletingRooms, setIsDeletingRooms] = useState(false);
  const { callState } = useCall();

  const handleStartCall = () => {
    // Prevent opening multiple call modals
    if (callState.isActive) {
      toast.error("You already have an active call. Please end it before starting a new one.");
      return;
    }
    
    setIsCallModalOpen(true);
  };

  const handleCloseCall = () => {
    setIsCallModalOpen(false);
  };
  
  // Function to delete all Daily.co rooms
  const handleDeleteAllRooms = async () => {
    try {
      setIsDeletingRooms(true);
      await deleteAllRooms();
      toast.success("Successfully deleted all Daily.co rooms");
    } catch (error) {
      console.error("Failed to delete rooms:", error);
      toast.error("Failed to delete rooms. Please try again.");
    } finally {
      setIsDeletingRooms(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Test Audio Call</h2>
      
      <div className="flex flex-col gap-4">
        <p className="text-sm text-gray-500">
          Click the button below to start a test audio call.
        </p>
        
        <Button 
          onClick={handleStartCall} 
          className="w-full"
          disabled={callState.isActive || isDeletingRooms}
        >
          {callState.isActive ? 'Call in Progress...' : 'Start Audio Call'}
        </Button>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Daily.co has a limit of 50 rooms. If you encounter errors, use this button to clean up all rooms:
          </p>
          <Button 
            onClick={handleDeleteAllRooms} 
            variant="destructive"
            className="w-full"
            disabled={callState.isActive || isDeletingRooms}
          >
            {isDeletingRooms ? 'Deleting Rooms...' : (
              <>
                <Trash className="w-4 h-4 mr-2" />
                Delete All Daily.co Rooms
              </>
            )}
          </Button>
        </div>
      </div>

      {isCallModalOpen && (
        <AudioCallModal
          isOpen={isCallModalOpen}
          onClose={handleCloseCall}
          position={0}
          totalModals={1}
          userId={userId}
          profileData={profileData}
        />
      )}
    </div>
  );
} 