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
  ChevronDown,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  isMutedAtom,
  isVideoOffAtom,
  isScreenSharingAtom,
  participantCountAtom,
  endCallAtom,
} from "@/lib/atoms/callState";
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
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
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
    const speakingCheckInterval = setInterval(() => {
      // Access Daily's participant properties with appropriate typing
      // Use type assertion with a more specific interface instead of any
      interface DailyParticipantWithAudio {
        audio: boolean;
        audio_activity?: number;
      }
      
      const p = participant as unknown as DailyParticipantWithAudio;
      if (p && p.audio) {
        // Check if participant is speaking
        const isActive = (p.audio_activity || 0) > 20;
        setIsSpeaking(isActive);
      }
    }, 300);
    
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
        "relative bg-white rounded-md overflow-hidden shadow-sm border transition-all w-full h-full",
        isLocal ? "ring-2 ring-primary border-primary" : "border-gray-200"
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
  
  // Define interface for participant with audio activity
  interface DailyParticipantWithAudio {
    audio: boolean;
    audio_activity?: number;
  }
  
  // Update speaking states periodically
  useEffect(() => {
    if (!daily) return;
    
    const interval = setInterval(() => {
      const participants = daily.participants();
      if (!participants) return;
      
      const newSpeakingStates: Record<string, boolean> = {};
      
      Object.entries(participants).forEach(([id, p]) => {
        // Type assertion with more specific interface
        const participant = p as unknown as DailyParticipantWithAudio;
        if (participant && participant.audio) {
          newSpeakingStates[id] = (participant.audio_activity || 0) > 20;
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

// AudioDeviceSelector component to manage audio input devices
function AudioDeviceSelector() {
  const daily = useDaily();
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string | null>(null);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'output'>('input');
  const [isTesting, setIsTesting] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load available audio devices
  const loadAudioDevices = async () => {
    try {
      setIsLoading(true);
      
      // Request permission if needed
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter devices by type
      const inputs = devices.filter(device => device.kind === 'audioinput');
      const outputs = devices.filter(device => device.kind === 'audiooutput');
      
      setAudioInputDevices(inputs);
      setAudioOutputDevices(outputs);
      
      // Get current devices from Daily.co
      if (daily) {
        try {
          // Get current device configuration - cast to any to bypass type issues
          const inputDevices = await daily.getInputDevices() as any;
          if (inputDevices && typeof inputDevices === 'object') {
            // Get input device
            const audioInputId = inputDevices.audioDeviceId || '';
            if (audioInputId) {
              setSelectedInputDevice(audioInputId);
            } else if (inputs.length > 0) {
              // If no input device is set but we have inputs available, select the default device
              const defaultInputDevice = inputs.find(d => d.deviceId === 'default' || d.deviceId === '');
              if (defaultInputDevice) {
                setSelectedInputDevice(defaultInputDevice.deviceId);
                handleDeviceChange('input', defaultInputDevice.deviceId);
              } else {
                // If no default device found, use the first available input device
                setSelectedInputDevice(inputs[0].deviceId);
                handleDeviceChange('input', inputs[0].deviceId);
              }
            }
            
            // Get output device
            const audioOutputId = inputDevices.speakerDeviceId || '';
            if (audioOutputId) {
              setSelectedOutputDevice(audioOutputId);
            } else if (outputs.length > 0) {
              // If no speaker is set but we have outputs available, select the default device
              const defaultDevice = outputs.find(d => d.deviceId === 'default' || d.deviceId === '');
              if (defaultDevice) {
                setSelectedOutputDevice(defaultDevice.deviceId);
                handleDeviceChange('output', defaultDevice.deviceId);
              } else {
                // If no default device found, use the first available output device
                setSelectedOutputDevice(outputs[0].deviceId);
                handleDeviceChange('output', outputs[0].deviceId);
              }
            }
          }
        } catch (err) {
          console.error("Error getting current audio devices:", err);
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading audio devices:", error);
      toast.error("Failed to load audio devices");
      setIsLoading(false);
    }
  };

  // Start audio level testing
  const startMicrophoneTest = async () => {
    if (isTesting) {
      stopMicrophoneTest();
      return;
    }
    
    try {
      setIsTesting(true);
      
      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: selectedInputDevice ? { deviceId: { exact: selectedInputDevice } } : true,
        video: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Create audio context and analyzer
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      
      // Connect the microphone stream to the analyzer
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Store references for cleanup
      audioContextRef.current = audioContext;
      audioAnalyserRef.current = analyser;
      
      // Setup audio level monitoring
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!analyser) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedLevel = Math.min(100, Math.round((avg / 255) * 100));
        
        setAudioLevel(normalizedLevel);
        
        // Continue monitoring
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      // Start monitoring
      updateAudioLevel();
      
      // Add logging for troubleshooting
      console.log("Microphone test started with device:", selectedInputDevice);
      
    } catch (error) {
      console.error("Error testing microphone:", error);
      toast.error("Failed to test microphone");
      setIsTesting(false);
    }
  };
  
  // Stop audio testing
  const stopMicrophoneTest = () => {
    setIsTesting(false);
    setAudioLevel(0);
    
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(err => console.error("Error closing audio context:", err));
      audioContextRef.current = null;
    }
    
    // Clear analyzer
    audioAnalyserRef.current = null;
    
    console.log("Microphone test stopped");
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTesting) {
        stopMicrophoneTest();
      }
    };
  }, [isTesting]);

  // Load devices on component mount
  useEffect(() => {
    if (daily) {
      loadAudioDevices();
    }
  }, [daily]);

  // Handle device change
  const handleDeviceChange = async (type: 'input' | 'output', deviceId: string) => {
    try {
      if (!daily) return;
      
      // Stop testing if changing input device
      if (type === 'input' && isTesting) {
        stopMicrophoneTest();
      }
      
      // Prepare device configuration
      const deviceConfig: any = {};
      
      if (type === 'input') {
        deviceConfig.audioDeviceId = deviceId;
        setSelectedInputDevice(deviceId);
      } else {
        deviceConfig.speakerDeviceId = deviceId;
        setSelectedOutputDevice(deviceId);
      }
      
      // Update Daily.co's device settings
      await daily.setInputDevicesAsync(deviceConfig);
      
      toast.success(`Audio ${type} device updated`);
    } catch (error) {
      console.error(`Error changing audio ${type} device:`, error);
      toast.error(`Failed to change audio ${type} device`);
    }
  };

  // Refresh device list
  const handleRefreshDevices = () => {
    // Stop testing if refreshing devices
    if (isTesting) {
      stopMicrophoneTest();
    }
    loadAudioDevices();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "rounded-full h-7 flex items-center px-2",
            activeTab === 'input' && audioLevel > 20 && "bg-green-50 text-green-500 border-green-200"
          )}
          disabled={isLoading}
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Audio Device Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Tab Selection */}
        <div className="flex border-b px-1 mb-1">
          <button
            className={cn(
              "py-1 px-2 text-xs rounded-t-md border-b-2 transition-colors",
              activeTab === 'input' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('input')}
          >
            Microphone
          </button>
          <button
            className={cn(
              "py-1 px-2 text-xs rounded-t-md border-b-2 transition-colors",
              activeTab === 'output' 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab('output')}
          >
            Speaker
          </button>
        </div>
        
        {/* Microphone Test UI */}
        {activeTab === 'input' && (
          <div className="p-2 mb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Test Microphone</span>
              <Button 
                variant={isTesting ? "destructive" : "outline"} 
                size="sm" 
                className="h-6 text-xs rounded-md"
                onClick={startMicrophoneTest}
              >
                {isTesting ? "Stop Test" : "Start Test"}
              </Button>
            </div>
            
            {/* Audio level indicator */}
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-75",
                  audioLevel > 70 ? "bg-green-500" : 
                  audioLevel > 30 ? "bg-green-400" : 
                  audioLevel > 0 ? "bg-green-300" : "bg-gray-200"
                )}
                style={{ width: `${audioLevel}%` }}
              />
            </div>
            
            {isTesting && (
              <div className="text-xs text-center mt-1 text-muted-foreground">
                {audioLevel < 5 ? (
                  "No audio detected. Try speaking or check your microphone."
                ) : audioLevel < 30 ? (
                  "Low audio level detected. Try speaking louder."
                ) : (
                  "Audio is being transmitted! 👍"
                )}
              </div>
            )}
          </div>
        )}
        
        <DropdownMenuGroup className="max-h-[40vh] overflow-y-auto">
          {isLoading ? (
            <DropdownMenuItem disabled>Loading devices...</DropdownMenuItem>
          ) : activeTab === 'input' ? (
            // Microphone (Input) devices
            audioInputDevices.length === 0 ? (
              <DropdownMenuItem disabled>No microphones found</DropdownMenuItem>
            ) : (
              audioInputDevices.map(device => (
                <DropdownMenuItem
                  key={device.deviceId}
                  className={cn(
                    "flex items-center gap-2",
                    selectedInputDevice === device.deviceId && "bg-primary/10"
                  )}
                  onClick={() => handleDeviceChange('input', device.deviceId)}
                >
                  <Mic className={cn(
                    "h-3.5 w-3.5", 
                    selectedInputDevice === device.deviceId ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="flex-1 truncate">
                    {device.label || `Microphone (${device.deviceId.substring(0, 8)}...)`}
                  </span>
                  {selectedInputDevice === device.deviceId && (
                    <Badge variant="default" className="ml-auto py-0 px-1 h-4 text-[10px]">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))
            )
          ) : (
            // Speaker (Output) devices
            audioOutputDevices.length === 0 ? (
              <DropdownMenuItem disabled>No speakers found</DropdownMenuItem>
            ) : (
              audioOutputDevices.map(device => (
                <DropdownMenuItem
                  key={device.deviceId}
                  className={cn(
                    "flex items-center gap-2",
                    selectedOutputDevice === device.deviceId && "bg-primary/10"
                  )}
                  onClick={() => handleDeviceChange('output', device.deviceId)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={cn(
                      "h-3.5 w-3.5", 
                      selectedOutputDevice === device.deviceId ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                  <span className="flex-1 truncate">
                    {device.label || (device.deviceId === 'default' ? 'System Default' : `Speaker (${device.deviceId.substring(0, 8)}...)`)}
                  </span>
                  {selectedOutputDevice === device.deviceId && (
                    <Badge variant="default" className="ml-auto py-0 px-1 h-4 text-[10px]">
                      Active
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))
            )
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRefreshDevices}>
          <span className="text-xs">Refresh device list</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CallUI({ onLeave }: CallUIProps) {
  const daily = useDaily();
  const participantIds = useParticipantIds();
  const localSessionId = useLocalSessionId();
  const { screens } = useScreenShare();
  const isAnyScreenSharing = screens.length > 0;
  const [isMuted, setIsMuted] = useAtom(isMutedAtom);
  const [isVideoOff, setIsVideoOff] = useAtom(isVideoOffAtom);
  const [isScreenSharing, setIsScreenSharing] = useAtom(isScreenSharingAtom);
  const [, setParticipantCount] = useAtom(participantCountAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullyJoined, setIsFullyJoined] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [dailyInitError, setDailyInitError] = useState<string | null>(null);

  // Sort participant IDs to ensure consistent order
  const sortedParticipantIds = [...participantIds].sort((a, b) => {
    // Always put local participant first
    if (a === localSessionId) return -1;
    if (b === localSessionId) return 1;
    return a.localeCompare(b);
  });

  // Update fullscreen state when document fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Monitor meeting state events
  useDailyEvent("joined-meeting", () => {
    console.log("CallUI: joined-meeting event received");
    setConnectionState("joined");
    setDailyInitError(null);
    setTimeout(() => {
      setIsFullyJoined(true);
    }, 1000); // Short delay to ensure everything is loaded
  });

  // Handle meeting errors
  useDailyEvent("error", (ev) => {
    console.error("Daily.co error event:", ev);
    setDailyInitError(ev?.errorMsg || "Unknown Daily.co error");
    toast.error(`Call error: ${ev?.errorMsg || "Unknown error"}`);
  });

  useDailyEvent("participant-joined", (event) => {
    console.log("Participant joined:", event?.participant?.user_name || event?.participant?.session_id);
  });

  useDailyEvent("participant-left", (event) => {
    console.log("Participant left:", event?.participant?.user_name || event?.participant?.session_id);
  });

  // Keep track of participant count for the UI
  useEffect(() => {
    setParticipantCount(participantIds.length);
  }, [participantIds.length, setParticipantCount]);

  // Initialize the call when the component mounts
  useEffect(() => {
    const initializeCall = async () => {
      if (!daily) return;

      try {
        // Set initial audio/video state
        if (isVideoOff) {
          await daily.setLocalVideo(false);
        }

        if (isMuted) {
          await daily.setLocalAudio(false);
        } else {
          // Explicitly ensure microphone is enabled
          await daily.setLocalAudio(true);
          console.log("Microphone explicitly enabled");
        }

        // Verify audio transmission capabilities
        const mediaState = daily.participants().local?.tracks;
        console.log("Call audio state:", {
          isMuted,
          isVideoOff,
          localAudioActive: mediaState?.audio?.state === "playable",
          localAudioTrack: !!mediaState?.audio?.track,
          micPermission: !!navigator.mediaDevices,
          trackSettings: mediaState?.audio?.track?.getSettings(),
          participantCount: participantIds.length,
        });

        // Add network stats reporting for audio transmission verification
        const startAudioStats = async () => {
          try {
            if (daily && !isMuted) {
              const stats = await daily.getNetworkStats();
              // Type assertion for audio stats since the Daily.co typings are incomplete
              const statsData = stats?.stats?.latest as any;
              
              if (statsData?.audio?.send) {
                const audioStats = statsData.audio.send;
                console.log("Audio transmission stats:", {
                  bitrate: audioStats.bitrate,
                  packetLoss: audioStats.packetsLost,
                  jitter: audioStats.jitter,
                  audioLevel: audioStats.audioLevel,
                  active: audioStats.bitrate > 0
                });
                
                // If no bitrate, audio might not be transmitting
                if (audioStats.bitrate === 0 && !isMuted) {
                  console.warn("Warning: Audio bitrate is 0 - your audio may not be transmitting");
                }
              }
            }
          } catch (err) {
            console.error("Error getting audio stats:", err);
          }
        };
        
        // Run stats check after a short delay to allow the call to stabilize
        setTimeout(startAudioStats, 5000);
      } catch (error) {
        console.error("Error initializing call:", error);
        toast.error("Failed to initialize call settings");
      }
    };

    initializeCall();
  }, [daily, isMuted, isVideoOff, participantIds.length]);

  // Add active audio level monitoring for the local participant
  useEffect(() => {
    if (!daily || isMuted) return;
    
    // Create audio level tracker
    let lastAudioActivity = 0;
    let noAudioCount = 0;
    let hasShownTransmissionToast = false;
    
    const checkAudioTransmission = () => {
      try {
        // Use type assertion for audio_activity property
        const localParticipant = daily.participants().local as any;
        if (!localParticipant) return;
        
        const audioActivity = localParticipant.audio_activity || 0;
        
        // Update speaking state for visual indicator
        setIsSpeaking(audioActivity > 20);
        
        // Log significant audio activity changes and show a toast the first time audio is transmitted
        if (audioActivity > 30 && lastAudioActivity < 30) {
          console.log("Audio transmission active: your voice is being sent", { level: audioActivity });
          
          // Show a one-time toast notification to confirm audio transmission
          if (!hasShownTransmissionToast) {
            toast.success("✅ Microphone audio is transmitting!", {
              id: "mic-transmission-confirmed",
              duration: 3000
            });
            hasShownTransmissionToast = true;
          }
          
          noAudioCount = 0;
        }
        
        // Check for potential audio issues after some time without activity
        if (audioActivity < 5 && lastAudioActivity < 5) {
          noAudioCount++;
          
          // After ~10 seconds of no audio, suggest checking
          if (noAudioCount === 20 && !isMuted) {
            console.warn("No audio activity detected for 10 seconds while unmuted. Consider checking your microphone.");
            
            // Only show this warning toast if we've previously detected audio
            if (hasShownTransmissionToast) {
              toast.warning("No audio detected for a while. Try speaking or check your microphone.", {
                id: "mic-silence-warning",
                duration: 5000
              });
            }
          }
        }
        
        lastAudioActivity = audioActivity;
      } catch (err) {
        console.error("Error monitoring audio transmission:", err);
      }
    };
    
    // Check every 500ms
    const intervalId = setInterval(checkAudioTransmission, 500);
    
    // Also add a delayed check to warn if no audio has been detected after a reasonable time
    const delayedAudioCheck = setTimeout(() => {
      if (!hasShownTransmissionToast && !isMuted) {
        toast.info("Try speaking to verify your microphone is working", {
          id: "mic-check-reminder",
          duration: 5000
        });
      }
    }, 8000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(delayedAudioCheck);
    };
  }, [daily, isMuted]);

  // Toggle audio mute state
  const toggleAudio = async () => {
    if (!daily) return;

    try {
      await daily.setLocalAudio(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  // Toggle video state
  const toggleVideo = async () => {
    if (!daily) return;

    try {
      await daily.setLocalVideo(!isVideoOff);
      setIsVideoOff(!isVideoOff);
    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle camera");
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (!daily) return;
    
    // Don't allow screen sharing until fully joined
    if (!isFullyJoined) {
      toast.error("Please wait until call is fully connected before sharing your screen");
      return;
    }

    try {
      if (isScreenSharing) {
        await daily.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await daily.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      const errorMessage = (error as Error)?.message || "Failed to toggle screen sharing";
      
      // Special handling for user cancellation vs actual errors
      if (!errorMessage.includes("user denied screen share")) {
        toast.error(errorMessage);
      }
      
      // Reset the screen sharing state
      setIsScreenSharing(false);
    }
  };

  // Handle ending the call
  const handleEndCall = () => {
    endCall();
    onLeave();
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Render loading state if not fully joined
  if (!isFullyJoined || dailyInitError) {
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <div className="text-lg font-medium mb-1">
              {connectionState === "joined" ? "Call Connected" : "Connecting to call..."}
            </div>
            <div className="text-sm text-gray-500 mb-6">
              {connectionState === "joined" ? "Finalizing connection..." : "Setting up your call..."}
            </div>
            <div className="flex gap-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isMuted ? "outline" : "default"}
                      size="icon"
                      className={cn(
                        "rounded-full h-8 w-8 relative",
                        isMuted && "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-red-200",
                        !isMuted && isSpeaking && "ring-2 ring-green-400"
                      )}
                      onClick={toggleAudio}
                    >
                      {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {!isMuted && isSpeaking && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isMuted ? 'Unmute' : (isSpeaking ? 'Mute (Audio Transmitting)' : 'Mute')}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-full", 
                  isVideoOff ? "bg-red-100 text-red-600 border-red-200" : "bg-gray-100"
                )}
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4 mr-1" /> : <Video className="h-4 w-4 mr-1" />}
                {isVideoOff ? "Start Video" : "Stop Video"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col relative">
      {/* CSS for speaking pulses and background pattern */}
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
        
        .fullscreen-bg-pattern {
          background-color: #f8fafc;
          background-image: 
            linear-gradient(135deg, rgba(79, 70, 229, 0.03) 25%, transparent 25%),
            linear-gradient(225deg, rgba(79, 70, 229, 0.03) 25%, transparent 25%),
            linear-gradient(45deg, rgba(79, 70, 229, 0.03) 25%, transparent 25%),
            linear-gradient(315deg, rgba(79, 70, 229, 0.03) 25%, transparent 25%);
          background-position: 20px 0, 20px 0, 0 0, 0 0;
          background-size: 40px 40px;
          background-repeat: repeat;
        }
        
        .gradient-border {
          position: relative;
          border-radius: 100%;
          background: white;
        }
        
        .gradient-border:before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border-radius: 100%;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          z-index: -1;
          opacity: 0.5;
        }
        
        .blob-animation {
          animation: blob-move 30s ease-in-out infinite;
          transition: transform 0.3s ease-out;
        }
        
        @keyframes blob-move {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(5%, 5%) scale(1.05); }
          50% { transform: translate(-2%, 8%) scale(0.95); }
          75% { transform: translate(-5%, -3%) scale(1.03); }
        }
      `}</style>
      
      {/* Main content area with video/screen shares */}
      <div className={cn(
        "flex-1 overflow-hidden flex flex-col",
        !isAnyScreenSharing && "fullscreen-bg-pattern"
      )}>
        {/* Screen share with participant thumbnails overlay */}
        {isAnyScreenSharing ? (
          <div className="relative flex-1">
            {/* Screen share view */}
            <ScreenShareView />
            
            {/* Overlay participants at the right side - now side by side */}
            <div className="absolute bottom-4 right-4 max-w-[240px]">
              <div className="bg-black/30 backdrop-blur-sm p-1 rounded-md">
                <div className="flex flex-row gap-1">
                  {sortedParticipantIds.slice(0, 2).map(id => (
                    <div key={id} className="w-[110px] h-[80px] max-w-[110px]">
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
          /* Normal layout when no screen sharing */
          <div className={cn(
            "px-1 pt-1 pb-0.5 flex-1 flex relative",
            isFullscreen && "flex-col"
          )}>
            {/* Centered content when no screen is shared */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center",
              isFullscreen ? "z-0" : "z-0"
            )}>
              <div className={cn(
                "text-center",
                !isFullscreen && "scale-75 opacity-60"
              )}>
                {isFullscreen ? (
                  <>
                    {/* Full content for fullscreen mode */}
                    <div className="absolute -z-10 w-[400px] h-[400px] -top-[200px] -left-[200px] bg-primary/5 rounded-full blur-3xl opacity-50 blob-animation" />
                    <div className="absolute -z-10 w-[300px] h-[300px] -bottom-[150px] -right-[150px] bg-blue-400/5 rounded-full blur-3xl opacity-50 blob-animation" style={{ animationDelay: "-10s" }} />
                    
                    <div className="gradient-border w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" className="w-10 h-10 opacity-80">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <h3 className="text-gray-700 font-semibold text-lg mb-1">Waiting for screen share</h3>
                    <p className="text-gray-500 text-sm max-w-[300px] mx-auto">
                      You can share your screen using the controls below or wait for someone else to share
                    </p>
                    
                    <div className="mt-6 flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                        onClick={toggleScreenShare}
                      >
                        <MonitorUp className="h-3.5 w-3.5" />
                        Share your screen
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Simplified content for normal mode */}
                    <div className="absolute -z-10 w-[200px] h-[200px] -top-[80px] -left-[80px] bg-primary/5 rounded-full blur-3xl opacity-30 blob-animation" />
                    
                    <div className="gradient-border w-16 h-16 mx-auto mb-2 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" className="w-8 h-8 opacity-70">
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    
                    <p className="text-gray-500 text-xs font-medium">No screen shared</p>
                  </>
                )}
              </div>
            </div>
            
            {participantIds.length === 1 ? (
              /* Single participant - bottom-right aligned with responsive size */
              <div className="flex items-end justify-end w-full pb-2 pr-2 z-10">
                <div className={cn(
                  isFullscreen ? "w-[180px] h-[120px]" : "w-[150px] h-auto aspect-video"
                )}>
                  <ParticipantThumbnail 
                    sessionId={participantIds[0]} 
                    isLocal={participantIds[0] === localSessionId}
                  />
                </div>
              </div>
            ) : (
              /* Two participants - bottom-right aligned with responsive sizing */
              <div className="w-full flex items-end justify-end pb-2 pr-2 z-10">
                <div className={cn(
                  "flex gap-2",
                  isFullscreen ? "max-w-[420px]" : "max-w-full"
                )}>
                  {sortedParticipantIds.slice(0, 2).map(id => (
                    <div key={id} className={cn(
                      isFullscreen ? "w-[200px] h-[120px]" : "w-[150px] h-auto aspect-video"
                    )}>
                      <ParticipantThumbnail 
                        key={id}
                        sessionId={id} 
                        isLocal={id === localSessionId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Controls bar - more compact */}
      <div className="bg-white border-t py-2 px-2 shadow-sm">
        <div className="flex items-center justify-between">       
          {/* Center - Main call controls */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isMuted ? "outline" : "default"}
                    size="icon"
                    className={cn(
                      "rounded-full h-8 w-8 relative",
                      isMuted && "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-red-200",
                      !isMuted && isSpeaking && "ring-2 ring-green-400"
                    )}
                    onClick={toggleAudio}
                  >
                    {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    {!isMuted && isSpeaking && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMuted ? 'Unmute' : (isSpeaking ? 'Mute (Audio Transmitting)' : 'Mute')}
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
            
            <AudioDeviceSelector />
            
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
  );
}
