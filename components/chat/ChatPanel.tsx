"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ChatMessage,
  sendAdminMessage,
  getQueryMessages,
} from "@/lib/api/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Video, Phone } from "lucide-react";
import { useCallManager } from "@/components/providers/CallManagerProvider";
import { useAtom } from "jotai";
import { callStateAtom, startCallAtom } from "@/lib/atoms/callState";
import { CallModal } from "../communication/CallModal";
import { acceptCallRequestById, getCallSessionById } from "@/lib/api/communication";
import { CallMode } from "@/types/communication";

interface ChatPanelProps {
  donorQueryId: number;
}

// Update the ExtendedChatMessage interface to include callSession properties
interface ExtendedChatMessage extends ChatMessage {
  isFromAdmin: boolean;
  query?: {
    id: number;
    donor: string;
    donorId: string;
    test: string;
    stage: string;
    status: string;
    assignedToUser?: {
      id: number;
      name: string;
      role: string;
    };
  };
  callSession?: {
    id: number;
    mode: "VIDEO" | "AUDIO";
    status: "CREATED" | "STARTED" | "ENDED";
    roomName: string;
    roomUrl: string;
    roomToken: string;
    userToken: string;
    adminToken: string;
    startedAt: string | null;
    endedAt: string | null;
  };
  callMode?: "VIDEO" | "AUDIO";
  callRequestId?: number;
}

// Define type for message data from API
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MessageData {
  id: number;
  createdAt: string;
  content: string;
  messageType: string;
  senderId?: number;
  isFromAdmin?: boolean;
  sender?: {
    id: number;
    name: string;
    role: string;
  };
  callMode?: "VIDEO" | "AUDIO";
  callRequestId?: number;
}

// Define interface for call response
interface CallAcceptResponse {
  success: boolean;
  message?: string;
  data?: {
    roomUrl?: string;
    tokens?: {
      admin?: string;
    };
    adminToken?: string;
    callSession?: {
      roomUrl: string;
      roomToken: string;
    };
  };
}

// Function to construct a valid Daily.co room URL
const constructDailyUrl = (roomName: string) => {
  // Make sure we have a valid room name
  if (!roomName) return '';
  
  // If it already includes protocol, return as is
  if (roomName.startsWith('http')) return roomName;
  
  // If it's a full dailyco domain
  if (roomName.includes('daily.co/')) {
    return `https://${roomName}`;
  }
  
  // Handle the case of roomName like "prooftest/xyz123"
  if (roomName.startsWith('prooftest/')) {
    // Extract the actual room name part after prooftest/
    const actualRoomName = roomName.replace('prooftest/', '');
    return `https://prooftest.daily.co/${actualRoomName}`;
  }
  
  // Add full URL with domain
  return `https://prooftest.daily.co/${roomName}`;
};

export function ChatPanel({ donorQueryId }: ChatPanelProps) {
  const { user, token } = useAuth();
  const { isInCall } = useCallManager();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingVideoCall, setIsStartingVideoCall] = useState(false);
  const [isStartingAudioCall, setIsStartingAudioCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [callState] = useAtom(callStateAtom);
  const [, startCall] = useAtom(startCallAtom);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<{
    roomUrl: string;
    roomToken: string;
    mode: "audio" | "video";
  } | null>(null);

  // Define fetchMessages with useCallback to avoid dependency issues
  const fetchMessages = useCallback(async (showLoading = true) => {
    if (!donorQueryId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      // Get all messages using the new endpoint
      const messagesData = await getQueryMessages(donorQueryId);
      console.log("Raw messages data from API:", messagesData);
      
      // Check for call-related messages specifically
      const callMessages = messagesData.filter(msg => 
        msg.messageType === "CALL_STARTED" || 
        msg.messageType === "SYSTEM" || 
        msg.callSessionId || 
        msg.callRequestId
      );
      
      if (callMessages.length > 0) {
        console.log("Call-related messages found:", callMessages);
      }

      // Process the messages
      const formattedMessages: ExtendedChatMessage[] = [];
      
      // Loop through each message and format it
      for (const msg of messagesData) {
        let formattedMessage: ExtendedChatMessage;
        
        // Format call-related messages
        if (msg.messageType === "CALL_STARTED") {
          const callType = msg.callMode?.toLowerCase() || "unknown";
          const callText = `${callType === "video" ? "📹" : "📞"} ${
            msg.sender?.name || "Admin"
          } started a ${callType} call`;

          formattedMessage = {
            ...msg,
            content: msg.content || callText,
            isFromAdmin: true,
            sender: msg.sender || {
              id: msg.senderId || -1,
              name: "Admin",
              role: "admin",
            },
          } as ExtendedChatMessage;
        }
        // Format system messages (call requests)
        else if (msg.messageType === "SYSTEM") {
          // These are typically system-generated messages
          formattedMessage = {
            ...msg,
            // Call requests are typically from the user, not admin
            isFromAdmin: msg.isFromAdmin || false,
            sender: msg.sender || {
              id: msg.senderId || -1,
              name: msg.isFromAdmin ? "Admin" : "User",
              role: msg.isFromAdmin ? "admin" : "user",
            },
          } as ExtendedChatMessage;
        }
        else {
          // Determine if the message is from an admin
          const isFromAdmin =
            msg.isFromAdmin || msg.sender?.role?.toLowerCase() === "admin";

          formattedMessage = {
            ...msg,
            isFromAdmin,
            sender: msg.sender || {
              id: msg.senderId || -1,
              name: isFromAdmin ? "Admin" : "User",
              role: isFromAdmin ? "admin" : "user",
            },
          } as ExtendedChatMessage;
        }
        
        formattedMessages.push(formattedMessage);
      }

      // Sort messages by timestamp
      const sortedMessages = formattedMessages.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      console.log("Formatted messages:", sortedMessages);
      setMessages(sortedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (showLoading) {
        toast.error("Failed to load messages");
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [donorQueryId]);

  // Fetch messages on component mount and when donorQueryId changes
  useEffect(() => {
    if (donorQueryId) {
      fetchMessages();
    }
  }, [donorQueryId, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set up polling for new messages
  useEffect(() => {
    if (!donorQueryId) return;

    const interval = setInterval(() => {
      fetchMessages(false);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [donorQueryId, fetchMessages]);

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim() || !donorQueryId) return;

    try {
      setIsSending(true);

      await sendAdminMessage(donorQueryId, newMessage.trim(), "CHAT");

      setNewMessage("");
      await fetchMessages(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const startVideoCall = async () => {
    if (callState.isActive) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    if (!donorQueryId || !user || !token) {
      toast.error("Query ID or user information is missing");
      return;
    }

    setIsStartingVideoCall(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/communication/call/${donorQueryId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "VIDEO",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start video call: ${response.status}`);
      }

      const callData = await response.json();
      
      // Validate call data
      if (!callData.data?.roomUrl || !callData.data?.adminToken) {
        throw new Error("Invalid call data received from server");
      }

      toast.success("Video call started successfully");

      const roomUrl = callData.data.roomUrl;
      const roomToken = callData.data.adminToken;
      // Extract room name from URL safely
      const roomName = roomUrl.includes('/') ? roomUrl.split("/").pop() || "" : "";

      // Update internal call data state
      setCurrentCallData({
        roomUrl,
        roomToken,
        mode: "video",
      });
      
      // Initialize the call using Jotai
      startCall({
        queryId: donorQueryId,
        userId: user.id,
        mode: CallMode.VIDEO,
        roomUrl,
        roomToken,
        roomName,
      });
      
      setIsCallModalOpen(true);
      console.log("Call modal opened with current state:", callState);
      await fetchMessages(false);
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to start video call: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsStartingVideoCall(false);
    }
  };

  const startAudioCall = async () => {
    if (callState.isActive) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    if (!donorQueryId || !user || !token) {
      toast.error("Query ID or user information is missing");
      return;
    }

    setIsStartingAudioCall(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/communication/call/${donorQueryId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mode: "AUDIO",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to start audio call: ${response.status}`);
      }

      const callData = await response.json();

      // Validate call data
      if (!callData.data?.roomUrl || !callData.data?.adminToken) {
        throw new Error("Invalid call data received from server");
      }

      toast.success("Audio call started successfully");

      const roomUrl = callData.data.roomUrl;
      const roomToken = callData.data.adminToken;
      // Extract room name from URL safely
      const roomName = roomUrl.includes('/') ? roomUrl.split("/").pop() || "" : "";

      // Update internal call data state
      setCurrentCallData({
        roomUrl,
        roomToken,
        mode: "audio",
      });
      
      // Initialize the call using Jotai
      startCall({
        queryId: donorQueryId,
        userId: user.id,
        mode: CallMode.AUDIO,
        roomUrl,
        roomToken,
        roomName,
      });
      
      setIsCallModalOpen(true);
      console.log("Call modal opened with current state:", callState);
      await fetchMessages(false);
    } catch (error) {
      console.error("Error starting audio call:", error);
      toast.error("Failed to start audio call: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsStartingAudioCall(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const MessageItem = ({ message }: { message: ExtendedChatMessage }) => {
    // Query message type
    if ((message.messageType as string) === "QUERY") {
      return (
        <div
          className={`flex ${
            message.isFromAdmin ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`flex ${
              message.isFromAdmin ? "flex-row" : "flex-row-reverse"
            } items-start gap-2 max-w-[60%]`}
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={message.sender?.avatar || ""} />
              <AvatarFallback>
                {message.query?.donor?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full">
              <div
                className={`rounded-lg p-2 text-sm overflow-hidden break-words ${
                  message.isFromAdmin
                    ? "bg-gray-100 text-gray-900"
                    : "bg-blue-500 text-white"
                }`}
              >
                {message.content}
              </div>
              <div
                className={`text-xs text-gray-500 mt-0.5 ${
                  message.isFromAdmin ? "text-left" : "text-right"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular text message (CHAT or undefined messageType)
    if (!message.messageType || message.messageType === "CHAT") {
      return (
        <div
          className={`flex ${
            message.isFromAdmin ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`flex ${
              message.isFromAdmin ? "flex-row" : "flex-row-reverse"
            } items-start gap-2 max-w-[60%]`}
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={message.sender?.avatar || ""} />
              <AvatarFallback>
                {getInitials(message.sender?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full">
              <div
                className={`rounded-lg p-2 text-sm overflow-hidden break-words ${
                  message.isFromAdmin
                    ? "bg-gray-100 text-gray-900"
                    : "bg-blue-500 text-white"
                }`}
              >
                {message.content}
              </div>
              <div
                className={`text-xs text-gray-500 mt-0.5 ${
                  message.isFromAdmin ? "text-left" : "text-right"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Call-related message
    if (
      message.messageType === "CALL_STARTED" ||
      message.messageType === "CALL_ENDED"
    ) {
      const isActive =
        message.messageType === "CALL_STARTED" &&
        message.callSession?.status !== "ENDED";

      const callIcon =
        message.callMode === "VIDEO" ? (
          <Video className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        );

      const statusText =
        message.messageType === "CALL_STARTED"
          ? isActive
            ? "Active call"
            : "Call started"
          : "Call ended";

      // Function to handle accepting a call request
      const handleAcceptCallRequest = async (message: ExtendedChatMessage) => {
        if (!donorQueryId) return;

        try {
          // Show some loading state
          toast.loading("Accepting call request...");

          // Call the API to accept the request
          // If callRequestId is not available, we need a different approach
          if (message.callRequestId) {
            // Use the explicit call request ID if available
            const result = await acceptCallRequestById(
              donorQueryId,
              message.callRequestId
            );

            handleCallAcceptResponse(result, message);
          } else {
            // Use the latest call request endpoint if no specific ID is available
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/communication/call/${donorQueryId}/accept-request`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              throw new Error(
                `Failed to accept call request: ${response.status}`
              );
            }

            const result = await response.json();
            handleCallAcceptResponse(result, message);
          }
        } catch (error) {
          console.error("Error accepting call request:", error);
          toast.dismiss();
          toast.error("Failed to accept call request");
        }
      };

      // Function to handle joining a call
      const handleJoinCall = async (message: ExtendedChatMessage) => {
        try {
          // Enhanced debug logging
          console.log("Call join data:", {
            messageType: message.messageType,
            callMode: message.callMode,
            callSessionData: message.callSession,
            roomName: message.roomName,
            callRequestId: message.callRequestId,
            callSessionId: message.callSessionId
          });
          
          // Check if the message references a URL directly from a link
          if (message.content && message.content.includes('Click here to join')) {
            // Try to extract the URL from the markdown link
            const urlMatch = message.content.match(/\[Click here to join.*?\]\((.*?)\)/);
            if (urlMatch && urlMatch[1]) {
              console.log("Found URL in message content:", urlMatch[1]);
              const extractedUrl = urlMatch[1];
              
              // Add extra logging
              console.log("Original extracted URL:", extractedUrl);
              
              // Extract room name from URL
              const roomName = extractedUrl.split('/').pop();
              console.log("Extracted room name:", roomName);
              
              if (roomName) {
                const roomUrl = constructDailyUrl(roomName);
                // Add extra logging
                console.log("Constructed Daily URL:", roomUrl);
                
                // Look for adminToken - first check message.callSession
                let adminToken = message.callSession?.adminToken || "";
                
                // If we have a callSessionId but no token, try to fetch it
                if (!adminToken && message.callSessionId) {
                  try {
                    console.log("Fetching call session details for ID:", message.callSessionId);
                    const callSessionData = await getCallSessionById(message.callSessionId);
                    
                    if (callSessionData?.data?.adminToken) {
                      adminToken = callSessionData.data.adminToken;
                      console.log("Retrieved admin token from API:", adminToken.substring(0, 10) + "...");
                    }
                  } catch (error) {
                    console.error("Error fetching call session details:", error);
                  }
                }
                
                // Only proceed if we have a valid token
                if (!adminToken) {
                  console.log("No admin token found for URL in message content");
                  return;
                }

                console.log("Starting call with extracted URL data:", {
                  roomUrl,
                  roomName,
                  hasToken: true
                });
                
                // Initialize the call using Jotai
                startCall({
                  queryId: donorQueryId,
                  userId: user?.id || 0,
                  mode: (message.callMode?.toLowerCase() === "video") ? CallMode.VIDEO : CallMode.AUDIO,
                  roomUrl,
                  roomToken: adminToken,
                  roomName
                });
                
                // Update internal call data state
                setCurrentCallData({
                  roomUrl,
                  roomToken: adminToken,
                  mode: (message.callMode?.toLowerCase() || "video") as "audio" | "video",
                });
                
                // Add detailed logging here
                console.log("About to open call modal with data:", {
                  roomUrl,
                  tokenLength: adminToken.length,
                  tokenStart: adminToken.substring(0, 10) + "...",
                  mode: (message.callMode?.toLowerCase() === "video") ? "video" : "audio",
                  callStateBeforeOpen: callState
                });

                setIsCallModalOpen(true);
                console.log("Join Call button clicked for message:", {
                  id: message.id,
                  type: message.messageType,
                  hasCallSession: !!message.callSession,
                  roomName: message.roomName,
                  callSessionId: message.callSessionId
                });
                return; // Exit early since we've handled the call
              }
            }
          }

          // Standard handling path - Check if we have a complete callSession object
          if (message.callSession) {
            // Check if roomUrl is missing but we have roomName
            if (!message.callSession.roomUrl && message.callSession.roomName) {
              // Construct roomUrl from roomName
              message.callSession.roomUrl = constructDailyUrl(message.callSession.roomName);
              console.log("Created roomUrl from roomName:", message.callSession.roomUrl);
            }
            
            // Verify we have all required data
            if (message.callSession.roomUrl && message.callSession.adminToken) {
              const roomUrl = message.callSession.roomUrl;
              const roomToken = message.callSession.adminToken;
              const callMode = (message.callMode || "VIDEO").toLowerCase();
              
              // Extract room name from URL safely
              const roomName = roomUrl.includes('/') ? roomUrl.split("/").pop() || "" : "";
              
              console.log("Joining call with:", { roomUrl, roomToken: roomToken.substring(0, 10) + "...", roomName });
              
              // Initialize the call using Jotai
              startCall({
                queryId: donorQueryId,
                userId: user?.id || 0,
                mode: callMode === "video" ? CallMode.VIDEO : CallMode.AUDIO,
                roomUrl,
                roomToken,
                roomName
              });
              
              // Update internal call data state for future reference
              setCurrentCallData({
                roomUrl,
                roomToken,
                mode: callMode === "video" ? "video" : "audio",
              });
              
              // Add detailed logging here
              console.log("About to open call modal with data:", {
                roomUrl,
                tokenLength: roomToken.length,
                tokenStart: roomToken.substring(0, 10) + "...",
                mode: callMode === "video" ? "video" : "audio",
                callStateBeforeOpen: callState
              });

              setIsCallModalOpen(true);
              console.log("Join Call button clicked for message:", {
                id: message.id,
                type: message.messageType,
                hasCallSession: !!message.callSession,
                roomName: message.roomName,
                callSessionId: message.callSessionId
              });
            } else if (message.callSession.roomName && !message.callSession.roomUrl) {
              // Handle case where we only have roomName but no roomUrl or adminToken
              const roomName = message.callSession.roomName;
              const roomUrl = constructDailyUrl(roomName);
              
              console.error("Incomplete call session data - missing roomUrl or adminToken:", {
                roomName,
                hasAdminToken: !!message.callSession.adminToken
              });
              
              // Try to fetch call info if we only have roomName
              toast.loading("Retrieving call information...");
              
              // Attempt to join with what we have
              if (message.callSession.adminToken) {
                startCall({
                  queryId: donorQueryId,
                  userId: user?.id || 0,
                  mode: (message.callMode?.toLowerCase() === "video") ? CallMode.VIDEO : CallMode.AUDIO,
                  roomUrl,
                  roomToken: message.callSession.adminToken,
                  roomName
                });
                
                setCurrentCallData({
                  roomUrl,
                  roomToken: message.callSession.adminToken,
                  mode: (message.callMode?.toLowerCase() || "video") as "audio" | "video",
                });
                
                setIsCallModalOpen(true);
                console.log("Join Call button clicked for message:", {
                  id: message.id,
                  type: message.messageType,
                  hasCallSession: !!message.callSession,
                  roomName: message.roomName,
                  callSessionId: message.callSessionId
                });
                toast.dismiss();
              } else {
                toast.error("Call information is incomplete. Cannot join without admin token.");
              }
            } else {
              toast.error("Call information is missing or incomplete");
              console.error("Missing call info in callSession:", message.callSession);
            }
          } else if (message.callSessionId) {
            // If we have a callSessionId but no callSession object,
            // try to fetch the call session details from the API
            try {
              toast.loading("Retrieving call information...");
              // Add API endpoint logging
              console.log(`Calling API: ${process.env.NEXT_PUBLIC_BACKEND_URL}/communication/call-session/${message.callSessionId}`);
              const callSessionData = await getCallSessionById(message.callSessionId);
              
              if (callSessionData && callSessionData.data) {
                const callSession = callSessionData.data;
                console.log("Retrieved call session data:", callSession);
                
                // Check if we have the required information now
                if (callSession.roomName) {
                  const roomName = callSession.roomName;
                  const roomUrl = constructDailyUrl(roomName);
                  const roomToken = callSession.adminToken;
                  
                  if (roomToken) {
                    // Initialize the call using Jotai
                    startCall({
                      queryId: donorQueryId,
                      userId: user?.id || 0,
                      mode: (message.callMode?.toLowerCase() === "video") ? CallMode.VIDEO : CallMode.AUDIO,
                      roomUrl,
                      roomToken,
                      roomName
                    });
                    
                    // Update internal call data state
                    setCurrentCallData({
                      roomUrl,
                      roomToken,
                      mode: (message.callMode?.toLowerCase() || "video") as "audio" | "video",
                    });
                    
                    setIsCallModalOpen(true);
                    console.log("Join Call button clicked for message:", {
                      id: message.id,
                      type: message.messageType,
                      hasCallSession: !!message.callSession,
                      roomName: message.roomName,
                      callSessionId: message.callSessionId
                    });
                    toast.dismiss();
                  } else {
                    toast.error("Call information is incomplete. Missing admin token.");
                    console.error("Missing admin token in fetched call session:", callSession);
                  }
                } else {
                  toast.error("Failed to retrieve complete call information");
                  console.error("Retrieved call session is missing roomName:", callSession);
                }
              } else {
                toast.error("Failed to retrieve call information");
                console.error("Failed to retrieve call session data:", callSessionData);
              }
            } catch (error) {
              console.error("Error fetching call session:", error);
              toast.error("Failed to retrieve call information");
            }
          } else if (message.roomName) {
            // Legacy support for older call messages with just roomName
            const roomName = message.roomName;
            const roomUrl = constructDailyUrl(roomName);
            
            console.error("Using legacy roomName format. Missing callSession object:", {
              roomName,
              roomUrl
            });
            
            // Check if we have a token elsewhere in the message
            const messageAny = message as any; // Use type assertion for flexibility
            if (messageAny.adminToken) {
              const roomToken = messageAny.adminToken;
              
              startCall({
                queryId: donorQueryId,
                userId: user?.id || 0,
                mode: (message.callMode?.toLowerCase() === "video") ? CallMode.VIDEO : CallMode.AUDIO,
                roomUrl,
                roomToken,
                roomName
              });
              
              setCurrentCallData({
                roomUrl,
                roomToken,
                mode: (message.callMode?.toLowerCase() || "video") as "audio" | "video",
              });
              
            }
          }
        } catch (error) {
          console.error("Error handling call:", error);
          toast.error("Failed to handle call");
        }
      };

      return (
        <div
          className={`flex ${
            message.isFromAdmin ? "justify-start" : "justify-end"
          }`}
        >
          <div
            className={`flex ${
              message.isFromAdmin ? "flex-row" : "flex-row-reverse"
            } items-start gap-2 max-w-[60%]`}
          >
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={message.sender?.avatar || ""} />
              <AvatarFallback>
                {getInitials(message.sender?.name || "U")}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full">
              <div
                className={`rounded-lg p-2 text-sm overflow-hidden break-words ${
                  message.isFromAdmin
                    ? "bg-gray-100 text-gray-900"
                    : "bg-blue-500 text-white"
                }`}
              >
                {message.content}
              </div>
              <div
                className={`text-xs text-gray-500 mt-0.5 ${
                  message.isFromAdmin ? "text-left" : "text-right"
                }`}
              >
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
          {isActive && message.callSessionId && (
            <Button
              className="mt-2 w-full"
              size="sm"
              onClick={() => {
                console.log("Join Call button clicked for CALL_STARTED message:", {
                  messageId: message.id,
                  type: message.messageType,
                  hasCallSession: !!message.callSession,
                  roomName: message.roomName,
                  callSessionId: message.callSessionId,
                  callMode: message.callMode
                });
                handleJoinCall(message);
              }}
            >
              Join Call
            </Button>
          )}
        </div>
      );
    }

    return null;
  };

  // Add the missing function definition for handleCallAcceptResponse
  // Helper function to handle the response from accepting a call
  const handleCallAcceptResponse = (result: CallAcceptResponse, message: ExtendedChatMessage) => {
    toast.dismiss();
    
    if (result.success) {
      toast.success(result.message || "Call request accepted successfully");
      
      // If the response includes call session data, set it up to join
      if (
        (result.data?.roomUrl && (result.data?.tokens?.admin || result.data?.adminToken)) ||
          result.data?.callSession?.roomUrl
      ) {
        // Handle different response formats
        const roomUrl = result.data?.callSession?.roomUrl || result.data?.roomUrl || "";
        const token = result.data?.callSession?.roomToken || 
                    result.data?.tokens?.admin || 
                    result.data?.adminToken || "";
        
        // Only proceed if we have valid data
        if (roomUrl && token) {
          // Extract room name from URL safely
          const roomName = roomUrl.includes('/') ? roomUrl.split("/").pop() || "" : "";
          
          // Initialize the call using Jotai
          startCall({
            queryId: donorQueryId,
            userId: user?.id || 0,
            mode: (message.callMode?.toLowerCase() === "video") ? CallMode.VIDEO : CallMode.AUDIO,
            roomUrl,
            roomToken: token,
            roomName
          });
          
          // Update internal state
          setCurrentCallData({
            roomUrl,
            roomToken: token,
            mode: (message.callMode?.toLowerCase() || "video") as "audio" | "video",
          });
          
          setIsCallModalOpen(true);
          console.log("Call modal opened from handleCallAcceptResponse");
        } else {
          toast.error("Call information is incomplete");
          console.error("Invalid call data:", result.data);
        }
      } else {
        toast.error("Call session information is missing");
        console.error("Missing call session in response:", result);
      }
    } else {
      toast.error(result.message || "Failed to accept call request");
    }
    
    // Refresh messages to get the updated system message
    fetchMessages(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !==
                  formatDate(message.createdAt);

              return (
                <div key={message.id} className="space-y-2">
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  <MessageItem message={message} />
                </div>
              );
            })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={startVideoCall}
            disabled={isStartingVideoCall || isInCall}
          >
            {isStartingVideoCall ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Video className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={startAudioCall}
            disabled={isStartingAudioCall || isInCall}
          >
            {isStartingAudioCall ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Phone className="h-3 w-3" />
            )}
          </Button>
        </div>

        <div className="relative">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none pr-16 pb-8"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
            className="absolute right-2 bottom-2"
            size="sm"
          >
            {isSending ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </div>

      {/* Always render CallModal but control visibility with isOpen prop */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          console.log("Call modal close requested from ChatPanel");
          setIsCallModalOpen(false);
          setCurrentCallData(null);
        }}
        position={0}
        totalModals={1}
        profileData={{
          name: user?.name || "Admin",
          image: user?.avatar || "",
          status: "In Call",
        }}
      />
    </div>
  );
}
