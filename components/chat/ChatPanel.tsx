"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { Video, Phone, X } from "lucide-react";
import { useCallManager } from "@/components/providers/CallManagerProvider";
import { useAtom } from "jotai";
import { callStateAtom, startCallAtom } from "@/lib/atoms/callState";
import { CallModal } from "../communication/CallModal";
import {
  acceptCallRequestById,
  getCallSessionById,
} from "@/lib/api/communication";
import { CallMode } from "@/types/communication";
import { cn, blueToast } from "@/lib/utils";
import { endCall } from "@/lib/api/communication";

interface ChatPanelProps {
  donorQueryId: number;
}

// Update the ExtendedChatMessage interface to include new properties
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

  // UI-related properties for grouping and display
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showDateDivider?: boolean;
  showAvatar?: boolean;
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

// Function to construct a valid Daily.co room URL
const constructDailyUrl = (roomName: string) => {
  // Make sure we have a valid room name
  if (!roomName) return "";

  // Clean up the room name to handle potential edge cases
  const cleanedRoomName = roomName.trim();
  
  // If it already includes protocol, return as is
  if (cleanedRoomName.startsWith("http://") || cleanedRoomName.startsWith("https://")) {
    console.log("URL already has protocol:", cleanedRoomName);
    return cleanedRoomName;
  }

  // If it's a domain with daily.co
  if (cleanedRoomName.includes("daily.co")) {
    // If it's missing the protocol, add https://
    if (!cleanedRoomName.startsWith("http")) {
      console.log("Adding https to daily.co domain:", cleanedRoomName);
      return `https://${cleanedRoomName}`;
    }
    return cleanedRoomName;
  }

  // Handle the case of roomName like "prooftest/xyz123"
  if (cleanedRoomName.includes("/")) {
    // Split by slash to get domain and room parts
    const parts = cleanedRoomName.split("/");
    const domain = parts[0];
    const room = parts[parts.length - 1];
    
    // If domain is prooftest or something similar, construct properly
    console.log(`Constructing URL from domain "${domain}" and room "${room}"`);
    return `https://${domain}.daily.co/${room}`;
  }

  // Default case: assume it's just a room name for the prooftest domain
  console.log("Constructing URL with default domain for room:", cleanedRoomName);
  return `https://prooftest.daily.co/${cleanedRoomName}`;
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
  const [isJoiningCall, setIsJoiningCall] = useState(false);
  const [isAcceptingCall, setIsAcceptingCall] = useState<number | null>(null);
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
  const fetchMessages = useCallback(
    async (showLoading = true) => {
      if (!donorQueryId) return;

      try {
        if (showLoading) {
          setIsLoading(true);
        }

        // Get all messages using the new endpoint
        const messagesData = await getQueryMessages(donorQueryId);
        console.log("Raw messages data from API:", messagesData);

        // Check for call-related messages specifically
        const callMessages = messagesData.filter(
          (msg) =>
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
          } else {
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
          blueToast("Failed to load messages", {}, 'error');
        }
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    },
    [donorQueryId]
  );

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
      blueToast("Failed to send message", {}, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const startVideoCall = async () => {
    if (callState.isActive) {
      blueToast("You are already in a call. Please end the current call first.", {}, 'error');
      return;
    }

    if (!donorQueryId || !user || !token) {
      blueToast("Query ID or user information is missing", {}, 'error');
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
        const errorData = await response.json();
        
        // Handle specific error for active calls
        if (errorData?.statusCode === 500 && errorData?.message?.includes("already an active call")) {
          blueToast("There is already an active call for this query. Please end the existing call before starting a new one.", {}, 'error');
          return;
        }
        
        throw new Error(`Failed to start video call: ${response.status}`);
      }

      const callData = await response.json();

      // Validate call data
      if (!callData.data?.roomUrl || !callData.data?.adminToken) {
        throw new Error("Invalid call data received from server");
      }

      blueToast("Video call started successfully", {}, 'success');

      const roomUrl = callData.data.roomUrl;
      const roomToken = callData.data.adminToken;
      // Extract room name from URL safely
      const roomName = roomUrl.includes("/")
        ? roomUrl.split("/").pop() || ""
        : "";

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
      blueToast("Failed to start video call: " + (error instanceof Error ? error.message : "Unknown error"), {}, 'error');
    } finally {
      setIsStartingVideoCall(false);
    }
  };

  const startAudioCall = async () => {
    if (callState.isActive) {
      blueToast("You are already in a call. Please end the current call first.", {}, 'error');
      return;
    }

    if (!donorQueryId || !user || !token) {
      blueToast("Query ID or user information is missing", {}, 'error');
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
        const errorData = await response.json();
        
        // Handle specific error for active calls
        if (errorData?.statusCode === 500 && errorData?.message?.includes("already an active call")) {
          blueToast("There is already an active call for this query. Please end the existing call before starting a new one.", {}, 'error');
          return;
        }
        
        throw new Error(`Failed to start audio call: ${response.status}`);
      }

      const callData = await response.json();

      // Validate call data
      if (!callData.data?.roomUrl || !callData.data?.adminToken) {
        throw new Error("Invalid call data received from server");
      }

      blueToast("Audio call started successfully", {}, 'success');

      const roomUrl = callData.data.roomUrl;
      const roomToken = callData.data.adminToken;
      // Extract room name from URL safely
      const roomName = roomUrl.includes("/")
        ? roomUrl.split("/").pop() || ""
        : "";

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
      blueToast("Failed to start audio call: " + (error instanceof Error ? error.message : "Unknown error"), {}, 'error');
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
    // Get sender information for display
    const senderName =
      message.sender?.name || (message.isFromAdmin ? "Admin" : "Donor");

    // Check if message is a call request with specific text
    const isCallRequest =
      message.messageType === "SYSTEM" &&
      message.content &&
      (message.content.includes("requested a") ||
        message.content.includes("Click here to join"));

    // Try to extract call request ID from content if not directly available
    let extractedCallRequestId = message.callRequestId;
    if (isCallRequest && !extractedCallRequestId && message.content) {
      // Look for patterns like "Call request ID: 123" or "requestId: 123"
      const requestIdMatch = message.content.match(
        /(?:call request|request|call)(?:\s+)?(?:id|ID)(?:\s*)?[:=](?:\s*)(\d+)/i
      );
      if (requestIdMatch && requestIdMatch[1]) {
        extractedCallRequestId = parseInt(requestIdMatch[1], 10);
      }
    }

    // Debug call requests
    if (isCallRequest) {
      console.log("Found call request message:", {
        id: message.id,
        content: message.content,
        isFromAdmin: message.isFromAdmin,
        callMode: message.callMode,
        callRequestId: message.callRequestId,
        extractedCallRequestId,
        isDonorRequest: message.content
          ?.toLowerCase()
          .includes("donor requested"),
      });
    }

    // Additional check for donor identification, examining multiple properties
    const isDonorMessage =
      message.isFromAdmin === false ||
      (message.content &&
        message.content.toLowerCase().includes("donor requested"));

    // More specific check for donor call requests
    const isDonorCallRequest =
      isCallRequest &&
      isDonorMessage &&
      !message.content.includes("✅ ACCEPTED");

    // Try to extract call mode if not available
    let callModeFromContent = message.callMode;
    if (isCallRequest && !callModeFromContent && message.content) {
      if (
        message.content.includes("VIDEO call") ||
        message.content.toLowerCase().includes("video call")
      ) {
        callModeFromContent = "VIDEO";
      } else if (
        message.content.includes("AUDIO call") ||
        message.content.toLowerCase().includes("audio call")
      ) {
        callModeFromContent = "AUDIO";
      }
    }

    // Check if message is a call ended notification
    const isCallEnded =
      message.messageType === "CALL_ENDED" ||
      (message.callSession?.status === "ENDED" &&
        (message.messageType === "SYSTEM" ||
          message.messageType === "CALL_STARTED"));

    // Define common avatar component
    const AvatarComponent = (
      <Avatar className="h-8 w-8 flex-shrink-0 drop-shadow-sm">
        <AvatarImage src={message.sender?.avatar || ""} />
        <AvatarFallback
          className={
            message.isFromAdmin
              ? "bg-primary text-white"
              : "bg-gray-400 text-white"
          }
        >
          {getInitials(
            message.isFromAdmin
              ? message.sender?.name || "A"
              : message.query?.donor || "D"
          )}
        </AvatarFallback>
      </Avatar>
    );

    // Regular text message (CHAT, QUERY or undefined messageType)
    if (
      !message.messageType ||
      message.messageType === "CHAT" ||
      message.messageType === "QUERY"
    ) {
      return (
        <div className="group relative mb-4">
          {/* Date divider if needed */}
          {message.showDateDivider && (
            <div className="flex justify-center my-4">
              <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                {formatDate(message.createdAt)}
              </div>
            </div>
          )}

          <div
            className={`flex ${
              message.isFromAdmin ? "justify-start" : "justify-end"
            }`}
          >
            <div
              className={`flex ${
                message.isFromAdmin ? "flex-row" : "flex-row-reverse"
              } max-w-[75%] items-start gap-2`}
            >
              {/* Show avatar for the first message in a group or if explicitly required */}
              {(message.showAvatar || message.isFirstInGroup) &&
                AvatarComponent}

              {/* Empty space to maintain alignment when avatar is hidden */}
              {!message.showAvatar && !message.isFirstInGroup && (
                <div className="w-8" />
              )}

              <div className="flex flex-col">
                {/* Show name for the first message in a group */}
                {message.isFirstInGroup && message.isFromAdmin && (
                  <span className="text-xs font-medium text-gray-500 ml-1 mb-1">
                    {senderName}
                  </span>
                )}

                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm break-words",
                    "shadow-sm",
                    message.isFromAdmin
                      ? "bg-gray-100 text-gray-900 rounded-tl-sm"
                      : "bg-primary text-primary-foreground rounded-tr-sm"
                  )}
                >
                  {message.content}
                  <span className="ml-2 inline-flex items-center float-right text-[10px] text-gray-400 mt-1">
                    {formatTime(message.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Call request message (SYSTEM with call request)
    if (isCallRequest) {
      // Extract call mode from content
      const callMode =
        callModeFromContent ||
        message.callMode ||
        (message.content.includes("VIDEO call")
          ? "VIDEO"
          : message.content.includes("AUDIO call")
          ? "AUDIO"
          : "VIDEO");

      // Check if this is an accepted call request
      const isAccepted = message.content.includes("✅ ACCEPTED");

      const callIcon =
        callMode === "VIDEO" ? (
          <Video className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        );

      return (
        <div className="mb-4">
          {/* Date divider if needed */}
          {message.showDateDivider && (
            <div className="flex justify-center my-4">
              <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                {formatDate(message.createdAt)}
              </div>
            </div>
          )}

          {/* System message for call request */}
          <div className="flex justify-center my-2">
            <div
              className={cn(
                "bg-gray-50 border rounded-xl text-gray-600 text-xs px-4 py-2.5 max-w-[85%]",
                isAccepted ? "bg-blue-50 border-blue-100" : "border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {callIcon}
                <span className="font-medium">
                  {message.isFromAdmin ? "Admin" : "Donor"} requested a{" "}
                  {callMode.toLowerCase()} call
                </span>
              </div>

              {isAccepted && (
                <div className="flex items-center text-green-600 gap-1 ml-6 mb-1">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span>
                    Accepted by{" "}
                    {message.content.match(/ACCEPTED by ([^*]+)/)
                      ? (message.content.match(/ACCEPTED by ([^*]+)/) || [
                          "",
                          "Admin",
                        ])[1]
                      : "Admin"}
                  </span>
                </div>
              )}

              <div className="text-right text-gray-400 text-[10px] mt-1">
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>

          {/* Show Accept Call button for donor requests that aren't accepted yet */}
          {isDonorCallRequest && (
            <div className="flex justify-center mt-1">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs px-4 py-1 h-auto bg-primary text-white hover:bg-primary/90"
                onClick={() => {
                  const requestId = extractedCallRequestId || 0;
                  console.log(
                    `Accepting call with requestId: ${requestId}, mode: ${callMode}`
                  );
                  handleCallAcceptResponse(
                    requestId,
                    callMode as "VIDEO" | "AUDIO"
                  );
                }}
                disabled={isAcceptingCall === extractedCallRequestId}
              >
                {isAcceptingCall === extractedCallRequestId ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></span>
                    Accepting...
                  </>
                ) : (
                  "Accept Call"
                )}
              </Button>
            </div>
          )}

          {/* Join call button if active and accepted */}
          {isAccepted &&
            message.callSession &&
            message.callSession.status !== "ENDED" && (
              <div className="flex justify-center mt-1 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full text-xs px-4 py-1 h-auto bg-primary/5 border-primary/10 text-primary hover:bg-primary/10"
                  onClick={() => {
                    console.log("Join Call button clicked for call request:", {
                      messageId: message.id,
                      type: message.messageType,
                      hasCallSession: !!message.callSession,
                      roomName: message.roomName,
                      callSessionId: message.callSessionId,
                      callMode: message.callMode,
                    });
                    handleJoinCall(message);
                  }}
                  disabled={isJoiningCall}
                >
                  {isJoiningCall ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></span>
                      Joining...
                    </>
                  ) : (
                    "Join Call"
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full text-xs px-3 py-1 h-auto cursor-pointer hover:bg-red-600 transition-colors"
                  onClick={() => {
                    if (message.callSession?.roomName) {
                      endCall(message.callSession.roomName)
                        .then(() => {
                          blueToast("Call ended", {}, 'success');
                          // Refresh messages after ending the call
                          fetchMessages(false);
                        })
                        .catch((error) => {
                          console.error("Error ending call:", error);
                          blueToast("Failed to end call", {}, 'error');
                        });
                    }
                  }}
                >
                  <X className="h-3 w-3 text-white mr-1" />
                  <span className="text-white">End</span>
                </Button>
              </div>
            )}
        </div>
      );
    }

    // Call-related message (CALL_STARTED or CALL_ENDED or general SYSTEM)
    if (
      message.messageType === "CALL_STARTED" ||
      message.messageType === "CALL_ENDED" ||
      message.messageType === "SYSTEM"
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

      let statusText = "System message";

      if (message.messageType === "CALL_STARTED") {
        statusText = isActive ? "Active call" : "Call started";
      } else if (isCallEnded) {
        statusText = "Call ended";
      } else if (message.messageType === "SYSTEM") {
        statusText = "System message";
      }

      return (
        <div className="mb-4">
          {/* Date divider if needed */}
          {message.showDateDivider && (
            <div className="flex justify-center my-4">
              <div className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                {formatDate(message.createdAt)}
              </div>
            </div>
          )}

          {/* System message for calls */}
          <div className="flex justify-center my-2">
            <div
              className={cn(
                "bg-gray-50 border text-gray-600 rounded-full text-xs px-3 py-1.5 flex items-center gap-2",
                isActive && "bg-blue-50 border-blue-100 text-blue-600",
                isCallEnded && "bg-red-50 border-red-100 text-red-600"
              )}
            >
              {callIcon}
              <span>{statusText}</span>
              <span className="text-gray-400 text-[10px]">
                {formatTime(message.createdAt)}
              </span>
            </div>
          </div>

          {/* Join call button if active */}
          {isActive && message.callSessionId && (
            <div className="flex justify-center mt-1 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs px-4 py-1 h-auto bg-primary/5 border-primary/10 text-primary hover:bg-primary/10"
                onClick={() => {
                  console.log(
                    "Join Call button clicked for CALL_STARTED message:",
                    {
                      messageId: message.id,
                      type: message.messageType,
                      hasCallSession: !!message.callSession,
                      roomName: message.roomName,
                      callSessionId: message.callSessionId,
                      callMode: message.callMode,
                    }
                  );
                  handleJoinCall(message);
                }}
                disabled={isJoiningCall}
              >
                {isJoiningCall ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-2"></span>
                    Joining...
                  </>
                ) : (
                  "Join Call"
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="rounded-full text-xs px-3 py-1 h-auto cursor-pointer hover:bg-red-600 transition-colors"
                onClick={() => {
                  if (message.roomName) {
                    endCall(message.roomName)
                      .then(() => {
                        blueToast("Call ended", {}, 'success');
                        // Refresh messages after ending the call
                        fetchMessages(false);
                      })
                      .catch((error) => {
                        console.error("Error ending call:", error);
                        blueToast("Failed to end call", {}, 'error');
                      });
                  }
                }}
              >
                <X className="h-3 w-3 text-white mr-1" />
                <span className="text-white">End</span>
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // Process messages to add grouping information
  const processedMessages = messages.map((message, index, allMessages) => {
    const prevMessage = index > 0 ? allMessages[index - 1] : null;
    const nextMessage =
      index < allMessages.length - 1 ? allMessages[index + 1] : null;

    // Check if this message is part of a group
    const isFirstInGroup =
      !prevMessage ||
      prevMessage.isFromAdmin !== message.isFromAdmin ||
      new Date(message.createdAt).getTime() -
        new Date(prevMessage.createdAt).getTime() >
        60000;

    const isLastInGroup =
      !nextMessage ||
      nextMessage.isFromAdmin !== message.isFromAdmin ||
      new Date(nextMessage.createdAt).getTime() -
        new Date(message.createdAt).getTime() >
        60000;

    // Check if we should show a date divider
    const messageDate = new Date(message.createdAt).toDateString();
    const prevMessageDate = prevMessage
      ? new Date(prevMessage.createdAt).toDateString()
      : null;
    const showDateDivider = !prevMessage || messageDate !== prevMessageDate;

    // Only show avatar for first message in group or for every 5th message in a long sequence
    const showAvatar =
      isFirstInGroup || (index % 5 === 0 && message.isFromAdmin);

    return {
      ...message,
      isFirstInGroup,
      isLastInGroup,
      showDateDivider,
      showAvatar,
    };
  });

  // Function to handle joining a call
  const handleJoinCall = async (message: ExtendedChatMessage) => {
    try {
      setIsJoiningCall(true);

      // Enhanced debug logging
      console.log("Call join data:", {
        messageType: message.messageType,
        callMode: message.callMode,
        callSessionData: message.callSession,
        roomName: message.roomName,
        callRequestId: message.callRequestId,
        callSessionId: message.callSessionId,
      });

      // Check if we have a complete callSession object
      if (message.callSession) {
        // Check if roomUrl is missing but we have roomName
        if (!message.callSession.roomUrl && message.callSession.roomName) {
          // Construct roomUrl from roomName
          const constructedUrl = constructDailyUrl(message.callSession.roomName);
          if (!constructedUrl) {
            blueToast("Invalid room name. Unable to construct a valid URL.", {}, 'error');
            setIsJoiningCall(false);
            return;
          }
          message.callSession.roomUrl = constructedUrl;
          console.log("Constructed Room URL:", constructedUrl);
        }

        // Verify we have all required data
        if (message.callSession.roomUrl && message.callSession.adminToken) {
          const roomUrl = message.callSession.roomUrl;
          const roomToken = message.callSession.adminToken;
          const callMode = (message.callMode || "VIDEO").toLowerCase();

          // Extract room name from URL safely
          let roomName = "";
          try {
            const urlObj = new URL(roomUrl);
            const pathParts = urlObj.pathname.split('/').filter(Boolean);
            roomName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "";
            console.log("Extracted room name from URL:", roomName);
          } catch (urlError) {
            console.error("Error parsing room URL:", urlError);
            // Fallback to using the existing room name if available
            roomName = message.callSession.roomName || "";
            console.log("Using fallback room name:", roomName);
          }

          if (!roomName) {
            blueToast("Invalid room information. Please try again.", {}, 'error');
            setIsJoiningCall(false);
            return;
          }

          try {
            // Initialize the call using Jotai
            startCall({
              queryId: donorQueryId,
              userId: user?.id || 0,
              mode: callMode === "video" ? CallMode.VIDEO : CallMode.AUDIO,
              roomUrl,
              roomToken,
              roomName,
            });

            // Update internal call data state
            setCurrentCallData({
              roomUrl,
              roomToken,
              mode: callMode === "video" ? "video" : "audio",
            });

            setIsCallModalOpen(true);
          } catch (callError) {
            console.error("Error starting call:", callError);
            blueToast("Failed to start the call. Please try again.", {}, 'error');
            setIsJoiningCall(false);
          }
        } else {
          blueToast("Call information is incomplete", {}, 'error');
          setIsJoiningCall(false);
        }
      } else if (message.callSessionId) {
        // If we have a callSessionId but no callSession object,
        // try to fetch the call session details from the API
        try {
          toast.loading("Retrieving call information...");
          const callSessionData = await getCallSessionById(
            message.callSessionId
          );

          if (callSessionData && callSessionData.data) {
            const callSession = callSessionData.data;

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
                  mode:
                    message.callMode?.toLowerCase() === "video"
                      ? CallMode.VIDEO
                      : CallMode.AUDIO,
                  roomUrl,
                  roomToken,
                  roomName,
                });

                // Update internal call data state
                setCurrentCallData({
                  roomUrl,
                  roomToken,
                  mode: (message.callMode?.toLowerCase() || "video") as
                    | "audio"
                    | "video",
                });

                setIsCallModalOpen(true);
                toast.dismiss();
              } else {
                blueToast("Call information is incomplete. Missing admin token.", {}, 'error');
              }
            } else {
              blueToast("Failed to retrieve complete call information", {}, 'error');
            }
          } else {
            blueToast("Failed to retrieve call information", {}, 'error');
          }
        } catch (error) {
          console.error("Error fetching call session:", error);
          blueToast("Failed to retrieve call information", {}, 'error');
        }
      } else {
        blueToast("Call information is missing", {}, 'error');
      }
    } catch (error) {
      console.error("Error handling call:", error);
      blueToast("Failed to handle call", {}, 'error');
    } finally {
      setIsJoiningCall(false);
    }
  };

  // Add function to handle accepting a call
  const handleCallAcceptResponse = async (
    callRequestId: number,
    callMode: "VIDEO" | "AUDIO"
  ) => {
    if (!token) {
      blueToast("You must be logged in to accept calls", {}, 'error');
      return;
    }

    try {
      setIsAcceptingCall(callRequestId);
      toast.loading("Accepting call request...");

      const response = await acceptCallRequestById(donorQueryId, callRequestId);

      if (response && response.success) {
        toast.dismiss();
        blueToast("Call accepted successfully", {}, 'success');

        // Refresh messages to get updated call information
        await fetchMessages(false);

        // If we have call data, join the call
        if (response.data?.roomUrl && response.data?.adminToken) {
          const roomUrl = response.data.roomUrl;
          const roomToken = response.data.adminToken;
          const roomName = roomUrl.includes("/")
            ? roomUrl.split("/").pop() || ""
            : "";

          // Initialize the call using Jotai
          startCall({
            queryId: donorQueryId,
            userId: user?.id || 0,
            mode: callMode === "VIDEO" ? CallMode.VIDEO : CallMode.AUDIO,
            roomUrl,
            roomToken,
            roomName,
          });

          // Update internal call data state
          setCurrentCallData({
            roomUrl,
            roomToken,
            mode: callMode === "VIDEO" ? "video" : "audio",
          });

          setIsCallModalOpen(true);
        } else {
          blueToast("Call information is incomplete", {}, 'error');
        }
      } else {
        toast.dismiss();
        blueToast(response?.message || "Failed to accept call", {}, 'error');
      }
    } catch (error) {
      console.error("Error accepting call:", error);
      toast.dismiss();
      blueToast("Failed to accept call request", {}, 'error');
    } finally {
      setIsAcceptingCall(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                <div className="text-sm text-gray-500">Loading messages...</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <p className="text-sm">No messages yet</p>
                </div>
                <p className="text-xs text-gray-500">
                  Send a message to start the conversation
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-1">
            {processedMessages.map((message, index) => (
              <MessageItem key={message.id || index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t p-3 bg-white">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9 hover:bg-gray-100"
            onClick={startVideoCall}
            disabled={isStartingVideoCall || isInCall}
          >
            {isStartingVideoCall ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Video className="h-4 w-4 text-primary" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9 hover:bg-gray-100"
            onClick={startAudioCall}
            disabled={isStartingAudioCall || isInCall}
          >
            {isStartingAudioCall ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Phone className="h-4 w-4 text-primary" />
            )}
          </Button>
        </div>

        <div className="relative bg-gray-50 rounded-2xl overflow-hidden">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="resize-none pr-16 pb-2 border-0 shadow-none focus:ring-0 min-h-[52px] max-h-32 bg-transparent"
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
            className="absolute right-2 bottom-2 rounded-full h-8 w-8 p-0"
            size="icon"
          >
            {isSending ? (
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>

      {/* CallModal component */}
      <CallModal
        isOpen={isCallModalOpen}
        onClose={() => {
          setIsCallModalOpen(false);
          setCurrentCallData(null);
        }}
        position={0}
        totalModals={1}
        profileData={{
          name: user?.name || "Admin",
          image: user?.avatar || "",
          status:
            currentCallData?.mode === "video" ? "Video Call" : "Audio Call",
        }}
      />
    </div>
  );
}
