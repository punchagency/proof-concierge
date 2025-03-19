'use client';

import { useState } from 'react';
import { ChatPanel } from './ChatPanel';
import { Button } from '@/components/ui/button';
import { Video, Phone } from 'lucide-react';
import { useCallManager } from '../providers/CallManagerProvider';
import { toast } from 'sonner';
import { requestCall } from '@/lib/api/communication';
import { CallMode } from '@/types/communication';

interface DonorQuery {
  id: number;
  donor: string;
  donorId: string;
  test?: string;
  stage?: string;
  status?: string;
  device?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ChatTabProps {
  donorQuery: DonorQuery;
  fcmToken?: string;
}

export function ChatTab({ donorQuery }: ChatTabProps) {
  const { startVideoCall, startAudioCall, isInCall } = useCallManager();
  const [isRequestingVideo, setIsRequestingVideo] = useState(false);
  const [isRequestingAudio, setIsRequestingAudio] = useState(false);
  
  const handleRequestVideoCall = async () => {
    setIsRequestingVideo(true);
    try {
      // Send a request to the backend to request a video call
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await requestCall(
        donorQuery.id,
        CallMode.VIDEO,
        'Admin is requesting a video call'
      );
      
      toast.success('Video call request sent to user');
      
      // Simulate user accepting after 2 seconds
      setTimeout(() => {
        toast.success('User accepted video call request');
        startVideoCall(
          donorQuery.id,
          parseInt(donorQuery.donorId),
          {
            name: donorQuery.donor,
            image: `/images/${donorQuery.donorId}.jpg`,
            status: 'Available'
          }
        );
      }, 2000);
    } catch (error) {
      console.error('Error requesting video call:', error);
      toast.error('Failed to request video call');
    } finally {
      setIsRequestingVideo(false);
    }
  };
  
  const handleRequestAudioCall = async () => {
    setIsRequestingAudio(true);
    try {
      // Send a request to the backend to request an audio call
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const response = await requestCall(
        donorQuery.id,
        CallMode.AUDIO,
        'Admin is requesting an audio call'
      );
      
      toast.success('Audio call request sent to user');
      
      // Simulate user accepting after 2 seconds
      setTimeout(() => {
        toast.success('User accepted audio call request');
        startAudioCall(
          donorQuery.id,
          parseInt(donorQuery.donorId),
          {
            name: donorQuery.donor,
            image: `/images/${donorQuery.donorId}.jpg`,
            status: 'Available'
          }
        );
      }, 2000);
    } catch (error) {
      console.error('Error requesting audio call:', error);
      toast.error('Failed to request audio call');
    } finally {
      setIsRequestingAudio(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Chat with Donor</h3>
            <p className="text-sm text-gray-500">
              {donorQuery.donor} {donorQuery.test && donorQuery.stage ? `- ${donorQuery.test} (${donorQuery.stage})` : ''}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestAudioCall}
              disabled={isInCall || isRequestingAudio}
              className="flex items-center gap-1"
            >
              {isRequestingAudio ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  <span>Request Huddle</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRequestVideoCall}
              disabled={isInCall || isRequestingVideo}
              className="flex items-center gap-1"
            >
              {isRequestingVideo ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span>
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Video className="h-4 w-4" />
                  <span>Request Video Call</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatPanel donorQueryId={donorQuery.id} />
      </div>
    </div>
  );
} 