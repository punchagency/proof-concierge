"use client";

import { useState, useEffect, useRef } from "react";
import {
  DailyVideo,
  useDaily,
  useDailyEvent,
  useParticipantIds,
  useScreenShare,
  useParticipant,
  useLocalSessionId,
} from "@daily-co/daily-react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MonitorUp,
  Users,
  Maximize2,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  callStateAtom,
  isMutedAtom,
  isVideoOffAtom,
  isScreenSharingAtom,
  participantCountAtom,
  endCallAtom,
} from "@/lib/atoms/callState";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface CallUIProps {
  onLeave: () => void;
}

function ParticipantThumbnail({
  sessionId,
  isLocal = false,
}: {
  sessionId: string;
  isLocal?: boolean;
}) {
  const participant = useParticipant(sessionId);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Monitor audio activity to detect speaking
  useEffect(() => {
    if (!participant) return;
    
    // Initialize speaking detector
    let speakingCheckInterval: NodeJS.Timeout;
    
    const checkIfSpeaking = () => {
      // Use type assertion to access Daily's participant properties
      const p = participant as any;
      if (p && p.audio) {
        // Check if participant is speaking
        const isActive = p.audio_activity > 20 || false;
        setIsSpeaking(isActive);
      }
    };
    
    speakingCheckInterval = setInterval(checkIfSpeaking, 300);
    
    return () => {
      clearInterval(speakingCheckInterval);
    };
  }, [participant]);

  if (!participant) return null;

  const name = participant.user_name || (isLocal ? "You" : "Donor");
  const videoEnabled = participant.video;
  const audioEnabled = participant.audio;

  return (
    <div
      className={cn(
        "relative bg-white rounded-md overflow-hidden shadow-sm border transition-all",
        isLocal ? "ring-2 ring-primary border-primary" : "border-gray-200",
        videoEnabled ? "aspect-video" : "h-24"
      )}
    >
      {/* Local participant indicator badge */}
      {isLocal && (
        <div className="absolute top-1 left-1 z-10">
          <Badge
            variant="default"
            className="px-1.5 py-0 text-[9px] bg-primary/80"
          >
            You
          </Badge>
        </div>
      )}

      {videoEnabled ? (
        <DailyVideo
          sessionId={sessionId}
          type="video"
          automirror
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="bg-gray-100 flex items-center justify-center h-full">
          <div className={cn(
            "relative",
            isSpeaking && audioEnabled && "speaking-pulse"
          )}>
            <Avatar
              className={cn("h-8 w-8 shadow", isLocal && "ring-1 ring-primary")}
            >
              <AvatarFallback
                className={cn(
                  "text-white text-[10px]",
                  isLocal ? "bg-primary" : "bg-gray-500"
                )}
              >
                {name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 text-white py-0.5 px-1 text-[10px]",
          isLocal ? "bg-primary/60" : "bg-black/40"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="truncate font-medium">{name}</span>
          <div className="flex gap-0.5">
            {!audioEnabled && <MicOff className="h-2.5 w-2.5 text-red-400" />}
            {!videoEnabled && <VideoOff className="h-2.5 w-2.5 text-red-400" />}
            {audioEnabled && isSpeaking && (
              <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenShareView() {
  const { screens } = useScreenShare();
  const screenSessionId = screens[0]?.session_id;

  if (!screenSessionId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg border border-gray-200 text-center p-6">
        <div>
          <MonitorUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 font-medium">No screen is being shared</p>
          <p className="text-gray-400 text-sm mt-1">
            Click the screen share button to share your screen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 w-full h-full">
      <DailyVideo
        sessionId={screenSessionId}
        type="screenVideo"
        className="w-full h-full object-contain"
      />
      <Badge className="absolute top-3 left-3 bg-blue-500/90 text-white">
        Screen Share
      </Badge>
    </div>
  );
}

function ParticipantDropdown() {
  const participantIds = useParticipantIds();
  const localSessionId = useLocalSessionId();
  const daily = useDaily();
  const [participantCount] = useAtom(participantCountAtom);
  const [speakingStates, setSpeakingStates] = useState<Record<string, boolean>>({});
  
  // Update speaking states periodically
  useEffect(() => {
    if (!daily) return;
    
    const interval = setInterval(() => {
      const participants = daily.participants();
      if (!participants) return;
      
      const newSpeakingStates: Record<string, boolean> = {};
      
      Object.entries(participants).forEach(([id, p]) => {
        // Type assertion to access audio_activity
        const participant = p as any;
        if (participant && participant.audio) {
          newSpeakingStates[id] = participant.audio_activity > 20 || false;
        }
      });
      
      setSpeakingStates(newSpeakingStates);
    }, 300);
    
    return () => clearInterval(interval);
  }, [daily]);
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-full h-7 flex items-center gap-1 px-2"
        >
          <Users className="h-3.5 w-3.5" />
          <span className="text-xs">{participantCount}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 p-1">
        <div className="py-1 space-y-1 max-h-[40vh] overflow-y-auto">
          {participantIds.map((id) => {
            const participant = daily?.participants()?.[id];
            if (!participant) return null;

            const isLocal = id === localSessionId;
            const name = participant.user_name || (isLocal ? "You" : "Donor");
            const audioEnabled = participant.audio;
            const videoEnabled = participant.video;
            const isSpeaking = speakingStates[id] && audioEnabled;

            return (
              <div
                key={id}
                className="flex items-center p-1.5 rounded-md hover:bg-gray-50"
              >
                <div className={cn(
                  "relative mr-2",
                  isSpeaking && "speaking-pulse-small"
                )}>
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-[10px]">
                      {name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {name} {isLocal && "(You)"}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!audioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
                  {!videoEnabled && <VideoOff className="h-3 w-3 text-red-400" />}
                  {audioEnabled && isSpeaking && (
                    <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CallUI({ onLeave }: CallUIProps) {
  const [callState] = useAtom(callStateAtom);
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [isVideoOff, setIsVideoOff] = useAtom(isVideoOffAtom);
  const [isScreenSharing, setIsScreenSharing] = useAtom(isScreenSharingAtom);
  const [participantCount, setParticipantCount] = useAtom(participantCountAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dailyInitError, setDailyInitError] = useState<string | null>(null);
  const [isFullyJoined, setIsFullyJoined] = useState(false);
  
  // Reference to the call container for fullscreen mode
  const callContainerRef = useRef<HTMLDivElement>(null);

  const daily = useDaily();
  const participantIds = useParticipantIds();
  const localSessionId = useLocalSessionId();
  const { screens } = useScreenShare();
  const isAnyScreenSharing = screens.length > 0;

  // Set initial mic and camera to muted/off on component mount
  useEffect(() => {
    if (!isMuted) {
      setIsMuted(true);
    }
    if (!isVideoOff) {
      setIsVideoOff(true);
    }
  }, []);

  // Log when Daily instance changes
  useEffect(() => {
    console.log("Daily instance available:", !!daily);
    if (!daily) {
      console.log("Daily not yet initialized");
    }
  }, [daily]);

  // Handle call events
  useDailyEvent("joined-meeting", () => {
    console.log("Successfully joined meeting with Daily.co");
    setDailyInitError(null);
    setIsFullyJoined(true);

    // Set initial participant count
    setParticipantCount(participantIds.length);

    // Initialize the call
    const initializeCall = async () => {
      try {
        // Always start with camera off and microphone muted
        await daily?.setLocalVideo(false);
        await daily?.setLocalAudio(false);
        setIsVideoOff(true);
        setIsMuted(true);
      } catch (error) {
        console.error("Error initializing call:", error);
        toast.error("There was an error initializing the call");
      }
    };

    if (daily) {
      initializeCall();
    }
  });

  // Handle meeting errors
  useDailyEvent("error", (ev) => {
    console.error("Daily.co error event:", ev);
    setDailyInitError(ev?.errorMsg || "Unknown Daily.co error");
    toast.error(`Call error: ${ev?.errorMsg || "Unknown error"}`);
  });

  useDailyEvent("left-meeting", () => {
    console.log("Left meeting");
    setIsFullyJoined(false);
    endCall();
    onLeave();
  });

  useDailyEvent("participant-joined", () => {
    // Update participant count
    setParticipantCount(participantIds.length);
    toast.info("A participant has joined the call");
  });

  useDailyEvent("participant-left", () => {
    // Update participant count
    setParticipantCount(participantIds.length);
    toast.info("A participant has left the call");
  });

  // Update participant count whenever the participant IDs change
  useEffect(() => {
    if (participantIds.length !== participantCount) {
      setParticipantCount(participantIds.length);
    }
  }, [participantIds, participantCount, setParticipantCount]);

  // Handle toggling audio
  const toggleAudio = async () => {
    if (!daily) return;

    try {
      const currentAudio = daily.localAudio();
      await daily.setLocalAudio(!currentAudio);
      setIsMuted(currentAudio);

      toast.success(currentAudio ? "Microphone muted" : "Microphone unmuted");
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  // Handle toggling video
  const toggleVideo = async () => {
    if (!daily) return;

    try {
      const currentVideo = daily.localVideo();
      await daily.setLocalVideo(!currentVideo);
      setIsVideoOff(currentVideo);

      toast.success(currentVideo ? "Camera turned off" : "Camera turned on");
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle camera");
    }
  };

  // Handle toggling screen sharing
  const toggleScreenShare = async () => {
    if (!daily) return;

    try {
      // Check if we're in a call using our state
      if (!isFullyJoined) {
        console.log("Can't share screen - not fully joined to meeting yet");
        toast.error(
          "Please wait until you're fully connected to the call before sharing your screen"
        );
        return;
      }

      if (!isScreenSharing) {
        await daily.startScreenShare();
        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      } else {
        await daily.stopScreenShare();
        setIsScreenSharing(false);
        toast.success("Screen sharing stopped");
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error(
        "Failed to toggle screen sharing. Make sure you have granted screen sharing permissions."
      );
    }
  };

  // Handle ending the call
  const handleEndCall = () => {
    if (daily) {
      daily.leave();
    }
    endCall();
    onLeave();
  };

  // Handle toggling fullscreen
  const toggleFullscreen = () => {
    if (!callContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      // Request fullscreen on the call container element
      callContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        toast.error("Failed to enter fullscreen mode");
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Update isFullscreen state when fullscreen changes outside of our control
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Show fallback UI if not yet connected or there's an error
  if (!daily || dailyInitError) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        {dailyInitError ? (
          <>
            <div className="text-red-500 mb-4">
              Call Error: {dailyInitError}
            </div>
            <Button onClick={onLeave} variant="destructive">
              Close
            </Button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
            <div>Connecting to call...</div>
          </>
        )}
      </div>
    );
  }

  // Determine layout
  return (
    <>
      {/* CSS for speaking pulses */}
      <style jsx global>{`
        .speaking-pulse::before {
          content: '';
          position: absolute;
          top: -3px;
          right: -3px;
          bottom: -3px;
          left: -3px;
          border-radius: 50%;
          border: 2px solid #22c55e;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          z-index: 1;
        }
        
        .speaking-pulse-small::before {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          bottom: -2px;
          left: -2px;
          border-radius: 50%;
          border: 1px solid #22c55e;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          z-index: 1;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.15);
          }
        }
      `}</style>
    
      <div ref={callContainerRef} className="flex flex-col h-full bg-gray-50">
        {/* Main content area with video/screen shares */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Screen share with participant thumbnails overlay */}
          {isAnyScreenSharing ? (
            <div className="relative flex-1">
              {/* Screen share view */}
              <ScreenShareView />
              
              {/* Overlay participants at the right side - now side by side */}
              <div className="absolute top-2 right-2 max-w-[240px]">
                <div className="bg-black/30 backdrop-blur-sm p-1 rounded-md">
                  <div className="flex flex-row gap-1">
                    {participantIds.slice(0, 2).map(id => (
                      <div key={id} className="w-[110px]">
                        <ParticipantThumbnail 
                          sessionId={id} 
                          isLocal={id === localSessionId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Normal layout when no screen sharing - participant at bottom-left */
            <div className="px-1 pt-1 pb-0.5 flex-1 flex relative">
              {participantIds.length === 1 ? (
                /* Single participant - bottom-left aligned */
                <div className="flex items-end justify-start w-full pb-2 pl-2">
                  <div className="w-[180px]">
                    <ParticipantThumbnail 
                      sessionId={participantIds[0]} 
                      isLocal={participantIds[0] === localSessionId}
                    />
                  </div>
                </div>
              ) : (
                /* Two participants - side by side */
                <div className="grid grid-cols-2 gap-1 w-full">
                  {participantIds.slice(0, 2).map(id => (
                    <ParticipantThumbnail 
                      key={id} 
                      sessionId={id} 
                      isLocal={id === localSessionId}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Controls bar - more compact */}
        <div className="bg-white border-t py-2 px-2 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left side - Meeting info */}
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-xs font-normal">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </Badge>
            </div>
            
            {/* Center - Main call controls */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "outline" : "default"}
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8",
                        isMuted && "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-red-200"
                      )}
                      onClick={toggleAudio}
                    >
                      {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMuted ? 'Unmute' : 'Mute'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isVideoOff ? "outline" : "default"}
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8",
                        isVideoOff && "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-red-200"
                      )}
                      onClick={toggleVideo}
                    >
                      {isVideoOff ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isScreenSharing ? "default" : "outline"}
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8",
                        isScreenSharing && "bg-blue-500 hover:bg-blue-600"
                      )}
                      onClick={toggleScreenShare}
                    >
                      <MonitorUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="rounded-full h-8 w-8"
                      onClick={handleEndCall}
                    >
                      <PhoneOff className="h-3.5 w-3.5 text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    End Call
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            {/* Right side - Additional controls */}
            <div className="flex items-center gap-1">            
              <ParticipantDropdown />
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full h-7 w-7"
                      onClick={toggleFullscreen}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
