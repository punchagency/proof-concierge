"use client";

import { useEffect, useState } from 'react';
import { DailyProvider, DailyVideo, useDaily, useDailyEvent, useParticipantIds, useScreenShare } from '@daily-co/daily-react';
import { atom, useAtom } from 'jotai';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MonitorUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Jotai atoms for call state
export const callStateAtom = atom({
  isActive: false,
  roomUrl: '',
  roomToken: '',
  mode: 'audio' as 'audio' | 'video',
});

export const callControlsAtom = atom({
  isMuted: false,
  isVideoOff: false,
  mode: 'audio' as 'audio' | 'video',
  isScreenSharing: false,
  showParticipants: false,
});

interface DailyCallProps {
  roomUrl: string;
  roomToken: string;
  mode: 'audio' | 'video';
  onLeave: () => void;
}

function ParticipantCard({ sessionId, isLocal = false }: { sessionId: string, isLocal?: boolean }) {
  const daily = useDaily();
  const participant = daily?.participants()?.[sessionId];
  
  if (!participant) return null;
  
  const name = participant.user_name || (isLocal ? 'You' : 'Participant');
  const videoEnabled = participant.video;
  const audioEnabled = participant.audio;
  // Check for active speaker using audio levels as a fallback
  const isSpeaking = (participant as any).is_speaking || 
    ((participant as any).audio_level && (participant as any).audio_level > 0.05);
  
  return (
    <div className={`relative bg-white rounded-lg overflow-hidden shadow-sm border ${isSpeaking ? 'border-blue-300' : 'border-gray-200'} transition-all`}>
      {videoEnabled ? (
        <DailyVideo
          sessionId={sessionId}
          type="video"
          automirror={isLocal}
          className="w-full h-full object-cover min-h-[180px]"
        />
      ) : (
        <div className="flex items-center justify-center bg-gray-100 min-h-[180px]">
          <Avatar className="h-20 w-20">
            <AvatarFallback className={`text-2xl ${isLocal ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white p-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {isLocal && <span className="text-xs bg-blue-500 text-white px-1 rounded mr-1">You</span>}
          <span>{name}</span>
          {isSpeaking && (
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1" aria-label="Speaking"></span>
          )}
        </div>
        <div className="flex gap-1">
          {!audioEnabled && <div className="relative" aria-label="Microphone off"><MicOff className="h-4 w-4 text-red-400" /></div>}
          {!videoEnabled && <div className="relative" aria-label="Camera off"><VideoOff className="h-4 w-4 text-red-400" /></div>}
        </div>
      </div>
    </div>
  );
}

function ScreenShareView() {
  const daily = useDaily();
  const { screens } = useScreenShare();
  
  // Get participants with screen shares
  const screenParticipants = daily ? 
    Object.values(daily.participants())
      .filter(p => p.screen)
      .map(p => p.session_id) 
    : [];
  
  // Get the first screen share participant ID
  const screenSessionId = screenParticipants.length > 0 ? screenParticipants[0] : null;
  
  if (!screenSessionId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border border-gray-200">
        <div className="text-center p-6">
          <MonitorUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No screen is being shared</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 w-full h-full">
      <DailyVideo
        sessionId={screenSessionId}
        type="screenVideo"
        className="w-full h-full object-contain min-h-[300px]"
      />
      <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-1 rounded text-xs">
        Screen Share
      </div>
    </div>
  );
}

function CallContent({ onLeave }: { onLeave: () => void }) {
  const [callState] = useAtom(callStateAtom);
  const [controls, setControls] = useAtom(callControlsAtom);
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const { screens } = useScreenShare();
  const [isCallInitialized, setIsCallInitialized] = useState(false);
  
  // Detect if someone is screen sharing
  const screenParticipants = daily ? 
    Object.values(daily.participants())
      .filter(p => p.screen)
      .map(p => p.session_id) 
    : [];
  
  const isScreenSharing = screenParticipants.length > 0 || controls.isScreenSharing;

  // Initialize call state when component mounts
  useEffect(() => {
    if (!daily) return;
    
    const initializeCall = async () => {
      try {
        // Try to join the call first
        if (daily.meetingState() !== 'joined-meeting') {
          console.log('Initializing call - joining meeting');
          await daily.join();
        }
        
        // Initialize audio/video based on call mode
        if (callState.mode === 'video' && !controls.isVideoOff) {
          console.log('Initializing call - starting camera');
          await daily.setLocalVideo(true);
        } else {
          await daily.setLocalVideo(false);
        }
        
        // Always enable audio initially unless muted
        if (!controls.isMuted) {
          await daily.setLocalAudio(true);
        } else {
          await daily.setLocalAudio(false);
        }
        
        setIsCallInitialized(true);
      } catch (error) {
        console.error('Error initializing call:', error);
        toast.error('There was an error initializing the call');
      }
    };
    
    initializeCall();
  }, [daily]);

  // Handle call events
  useDailyEvent('joined-meeting', () => {
    console.log('Successfully joined meeting');
    setIsCallInitialized(true);
  });

  useDailyEvent('left-meeting', () => {
    console.log('Left meeting');
    onLeave();
  });

  useDailyEvent('error', (error) => {
    console.error('Daily.co error:', error);
    toast.error('Call error occurred');
    onLeave();
  });
  
  useDailyEvent('active-speaker-change', (event) => {
    console.log('Active speaker changed:', event);
  });
  
  useDailyEvent('participant-joined', (event) => {
    if (event?.participant?.session_id) {
      toast.success(`${event.participant.user_name || 'Someone'} joined the call`);
    }
  });
  
  useDailyEvent('participant-left', (event) => {
    if (event?.participant?.session_id) {
      toast.info(`${event.participant.user_name || 'Someone'} left the call`);
    }
  });
  
  // Listen for screen share state changes
  useDailyEvent('participant-updated', (event) => {
    if (event?.participant?.screen) {
      setControls(prev => ({ ...prev, isScreenSharing: true }));
    }
  });

  // Filter out local participant and screen shares
  const remoteParticipantIds = participantIds.filter(id => 
    id !== 'local' && !id.includes('screen')
  );

  const toggleScreenShare = async () => {
    if (!daily) return;
    
    try {
      if (controls.isScreenSharing) {
        await daily.stopScreenShare();
        setControls(prev => ({ ...prev, isScreenSharing: false }));
      } else {
        // Check if the call is properly initialized
        if (!isCallInitialized) {
          toast.error("Call is still initializing. Please try again in a moment.");
          return;
        }
        
        try {
          await daily.startScreenShare();
          setControls(prev => ({ ...prev, isScreenSharing: true }));
        } catch (innerError: unknown) {
          console.error('Screen sharing inner error:', innerError);
          
          // Fallback approach - try to ensure we're properly joined first
          const errorMessage = String(innerError);
          if (errorMessage.includes('requires preAuth(), startCamera(), or join()')) {
            try {
              // Try to get media permissions first
              await daily.startCamera();
              // Then try screen sharing again
              await daily.startScreenShare();
              setControls(prev => ({ ...prev, isScreenSharing: true }));
            } catch (fallbackError) {
              console.error('Screen sharing fallback error:', fallbackError);
              toast.error('Could not initialize screen sharing. Please refresh and try again.');
            }
          } else {
            throw innerError; // Re-throw if it's not the specific error we're handling
          }
        }
      }
    } catch (e) {
      console.error('Screen sharing error:', e);
      toast.error('Failed to share screen');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-auto">
        {isScreenSharing ? (
          <div className="grid grid-cols-1 gap-4">
            <ScreenShareView />
            <div className="grid grid-cols-2 gap-4">
              <ParticipantCard sessionId="local" isLocal={true} />
              {remoteParticipantIds.length > 0 && (
                <ParticipantCard sessionId={remoteParticipantIds[0]} />
              )}
            </div>
          </div>
        ) : callState.mode === 'video' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ParticipantCard sessionId="local" isLocal={true} />
            {remoteParticipantIds.length > 0 ? (
              <div className={`grid ${remoteParticipantIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                {remoteParticipantIds.map(participantId => (
                  <ParticipantCard key={participantId} sessionId={participantId} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="text-center">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Waiting for others to join...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-gray-600">Audio Call in Progress</p>
              <p className="text-gray-400 text-sm mt-2">
                {remoteParticipantIds.length > 0 
                  ? `Connected with ${remoteParticipantIds.length} participant${remoteParticipantIds.length > 1 ? 's' : ''}`
                  : 'Waiting for others to join...'}
              </p>
              
              {remoteParticipantIds.length > 0 && (
                <div className="flex justify-center mt-4 gap-2">
                  {remoteParticipantIds.map(id => {
                    const participant = daily?.participants()?.[id];
                    return (
                      <Avatar key={id} className="h-10 w-10 border-2 border-white shadow">
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {(participant?.user_name || 'User').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-3 mt-4 p-2 bg-gray-50 rounded-lg">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (daily) {
              const newAudioState = !daily.localAudio();
              daily.setLocalAudio(newAudioState);
              setControls(prev => ({ ...prev, isMuted: !newAudioState }));
            }
          }}
          className="rounded-full"
          aria-label={controls.isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {controls.isMuted ? (
            <MicOff className="h-5 w-5 text-red-500" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (daily) {
              const newVideoState = !daily.localVideo();
              daily.setLocalVideo(newVideoState);
              setControls(prev => ({ ...prev, isVideoOff: !newVideoState }));
            }
          }}
          className={`rounded-full ${controls.isVideoOff ? 'bg-gray-100' : 'bg-blue-50 border-blue-200'}`}
          aria-label={controls.isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {controls.isVideoOff ? (
            <VideoOff className="h-5 w-5 text-red-500" />
          ) : (
            <Video className="h-5 w-5 text-blue-500" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={toggleScreenShare}
          className={`rounded-full ${controls.isScreenSharing ? 'bg-blue-50 border-blue-200' : ''}`}
          disabled={!isCallInitialized}
          aria-label={controls.isScreenSharing ? "Stop screen sharing" : "Share your screen"}
        >
          <MonitorUp className={`h-5 w-5 ${controls.isScreenSharing ? 'text-blue-500' : ''}`} />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setControls(prev => ({ ...prev, showParticipants: !prev.showParticipants }))}
          className={`rounded-full ${controls.showParticipants ? 'bg-blue-50 border-blue-200' : ''}`}
          aria-label={controls.showParticipants ? "Hide participant list" : "Show participant list"}
        >
          <Users className={`h-5 w-5 ${controls.showParticipants ? 'text-blue-500' : ''}`} />
        </Button>
        
        <Button
          variant="destructive"
          size="icon"
          onClick={onLeave}
          className="rounded-full"
          aria-label="Leave call"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
      
      {controls.showParticipants && (
        <div className="p-3 bg-white border-t border-gray-200">
          <h3 className="text-sm font-medium mb-2">Participants ({participantIds.filter(id => !id.includes('screen')).length})</h3>
          <div className="space-y-2">
            {participantIds
              .filter(id => !id.includes('screen'))
              .map(id => {
                const participant = daily?.participants()?.[id];
                return (
                  <div key={id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {(participant?.user_name || (id === 'local' ? 'You' : 'User')).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{id === 'local' ? 'You' : (participant?.user_name || 'Participant')}</span>
                    </div>
                    <div className="flex gap-1 items-center">
                      {!participant?.audio && <MicOff className="h-3 w-3 text-red-400" />}
                      {!participant?.video && <VideoOff className="h-3 w-3 text-red-400" />}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export function DailyCall({ roomUrl, roomToken, mode, onLeave }: DailyCallProps) {
  const [callState, setCallState] = useAtom(callStateAtom);
  const [controls, setControls] = useAtom(callControlsAtom);
  
  // Ensure automatic initialization of audio/video based on mode
  const callOptions = {
    url: roomUrl,
    token: roomToken,
    // Set audio and video based on call mode
    audio: true,
    video: mode === 'video',
    showLeaveButton: false,
    showFullscreenButton: false,
    activeSpeakerMode: true,
    dailyConfig: {
      // Advanced configuration if needed
    },
  };

  useEffect(() => {
    // Update call state when props change
    setCallState({
      isActive: true,
      roomUrl,
      roomToken,
      mode,
    });
    setControls(prev => ({ 
      ...prev, 
      mode,
      // Initialize with video off if audio-only mode
      isVideoOff: mode === 'audio'
    }));
  }, [roomUrl, roomToken, mode]);

  return (
    <DailyProvider
      url={roomUrl}
      token={roomToken}
      dailyConfig={callOptions.dailyConfig}
    >
      <CallContent onLeave={onLeave} />
    </DailyProvider>
  );
} 