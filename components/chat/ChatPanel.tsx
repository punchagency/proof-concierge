"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ChatMessage,
  sendChatMessage,
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
import { callStateAtom } from "../communication/DailyCall";
import { CallModal } from "../communication/CallModal";
import { acceptCallRequestById } from "@/lib/api/communication";

interface ChatPanelProps {
  donorQueryId: number;
  fcmToken?: string;
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

export function ChatPanel({ donorQueryId, fcmToken }: ChatPanelProps) {
  const { user, token } = useAuth();
  const { isInCall } = useCallManager();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStartingVideoCall, setIsStartingVideoCall] = useState(false);
  const [isStartingAudioCall, setIsStartingAudioCall] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [callState, setCallState] = useAtom(callStateAtom);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [currentCallData, setCurrentCallData] = useState<{
    roomUrl: string;
    roomToken: string;
    mode: "audio" | "video";
  } | null>(null);

  // Fetch messages on component mount and when donorQueryId changes
  useEffect(() => {
    if (donorQueryId) {
      fetchMessages();
    }
  }, [donorQueryId]);

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
  }, [donorQueryId]);

  const fetchMessages = async (showLoading = true) => {
    if (!donorQueryId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      // Get all messages using the new endpoint
      const messagesData = await getQueryMessages(donorQueryId);
      console.log("Messages data:", messagesData);

      // Process the messages
      const formattedMessages = messagesData.map((msg: any) => {
        // For messages directly from the query (not from a specific user)
        if (msg.messageType === "QUERY") {
          return {
            ...msg,
            isFromAdmin: false, // These are from the user/system
            sender: msg.sender || {
              id: -1,
              name: "User",
              role: "user",
            },
          };
        }

        // Determine if the message is from an admin
        const isFromAdmin =
          msg.isFromAdmin || msg.sender?.role?.toLowerCase() === "admin";

        // Format call-related messages
        if (msg.messageType === "CALL_STARTED") {
          const callType = msg.callMode?.toLowerCase() || "unknown";
          const callText = `${callType === "video" ? "📹" : "📞"} ${
            msg.sender?.name || "Admin"
          } started a ${callType} call`;

          return {
            ...msg,
            content: msg.content || callText,
            isFromAdmin: true,
            sender: msg.sender || {
              id: msg.senderId || -1,
              name: "Admin",
              role: "admin",
            },
          };
        }

        // Format system messages (call requests)
        if (msg.messageType === "SYSTEM") {
          // These are typically system-generated messages
          return {
            ...msg,
            // Call requests are typically from the user, not admin
            isFromAdmin: msg.isFromAdmin || false,
            sender: msg.sender || {
              id: msg.senderId || -1,
              name: msg.isFromAdmin ? "Admin" : "User",
              role: msg.isFromAdmin ? "admin" : "user",
            },
          };
        }

        return {
          ...msg,
          isFromAdmin,
          sender: msg.sender || {
            id: msg.senderId || -1,
            name: isFromAdmin ? "Admin" : "User",
            role: isFromAdmin ? "admin" : "user",
          },
        };
      });

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
  };

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

      toast.success("Video call started successfully");

      setCurrentCallData({
        roomUrl: callData.data.roomUrl,
        roomToken: callData.data.adminToken,
        mode: "video",
      });
      setIsCallModalOpen(true);

      await fetchMessages(false);
    } catch (error) {
      console.error("Error starting video call:", error);
      toast.error("Failed to start video call");
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

      toast.success("Audio call started successfully");

      setCurrentCallData({
        roomUrl: callData.data.roomUrl,
        roomToken: callData.data.adminToken,
        mode: "audio",
      });
      setIsCallModalOpen(true);

      await fetchMessages(false);
    } catch (error) {
      console.error("Error starting audio call:", error);
      toast.error("Failed to start audio call");
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

      // Function to handle joining a call from a message
      const handleJoinCall = () => {
        if (message.callSession) {
          // For older call messages that might not have roomUrl/roomToken
          if (message.callSession.roomUrl && message.callSession.adminToken) {
            setCurrentCallData({
              roomUrl: message.callSession.roomUrl,
              roomToken: message.callSession.adminToken,
              mode: (message.callMode || "AUDIO").toLowerCase() as
                | "audio"
                | "video",
            });
            setIsCallModalOpen(true);
          } else if (message.callSession.roomName) {
            // Legacy support for older call messages
            window.open(
              `https://prooftest.daily.co/${message.callSession.roomName}`,
              "_blank"
            );
          }
        }
      };

      return (
        <div className="flex justify-start">
          <div className="flex flex-row items-start gap-2 max-w-[60%]">
            <Avatar className="h-6 w-6 flex-shrink-0">
              <AvatarImage src={message.sender?.avatar || ""} />
              <AvatarFallback>
                {getInitials(message.sender?.name || "Admin")}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full">
              <div
                className={`rounded-lg p-3 text-sm overflow-hidden break-words 
                ${
                  isActive ? "bg-blue-50 border border-blue-100" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {callIcon}
                  <span className="font-medium">
                    {message.callMode || "Call"}{" "}
                    {message.messageType === "CALL_ENDED" ? "Ended" : "Started"}
                  </span>
                </div>

                <div className="text-gray-600">
                  {message.content ||
                    `${message.sender?.name || "Admin"} ${statusText}`}
                </div>

                {isActive && message.callSession && (
                  <Button
                    className="mt-2 w-full"
                    size="sm"
                    onClick={handleJoinCall}
                  >
                    Join Call
                  </Button>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {formatTime(message.createdAt)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // System message (for call requests)
    if (message.messageType === "SYSTEM") {
      const callIcon =
        message.callMode === "VIDEO" ? (
          <Video className="h-4 w-4" />
        ) : (
          <Phone className="h-4 w-4" />
        );

      // Check if this is a call request message
      const isCallRequest = message.content?.includes("Donor requested");

      // Check if the call has been accepted
      const isCallAccepted =
        message.content?.includes("ACCEPTED") &&
        message.callSessionId &&
        message.roomName;

      // Function to handle accepting a call request
      const handleAcceptCallRequest = async () => {
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

            handleCallAcceptResponse(result);
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
            handleCallAcceptResponse(result);
          }
        } catch (error) {
          console.error("Error accepting call request:", error);
          toast.dismiss();
          toast.error("Failed to accept call request");
        }
      };

      // Function to handle joining a call
      const handleJoinCall = () => {
        // Get call session info from the message
        if (message.callSession) {
          // Use the call session info directly
          setCurrentCallData({
            roomUrl: `https://prooftest.daily.co/${message.roomName}`,
            roomToken: message.callSession.userToken,
            mode: (message.callMode?.toLowerCase() || "video") as
              | "audio"
              | "video",
          });
          setIsCallModalOpen(true);
        } else if (message.roomName) {
          // If no call session but roomName is available, try to construct a URL
          const roomUrl = `https://prooftest.daily.co/${message.roomName}`;
          window.open(roomUrl, "_blank");
        } else {
          toast.error("Call information is missing");
        }
      };

      // Helper function to handle the response from accepting a call
      const handleCallAcceptResponse = (result: any) => {
        toast.dismiss();
        toast.success("Call request accepted successfully");

        // If the response includes call session data, set it up to join
        if (
          result.data?.roomUrl &&
          (result.data?.tokens?.admin || result.data?.adminToken)
        ) {
          const token = result.data.tokens?.admin || result.data.adminToken;

          setCurrentCallData({
            roomUrl: result.data.roomUrl,
            roomToken: token,
            mode: (message.callMode?.toLowerCase() || "video") as
              | "audio"
              | "video",
          });
          setIsCallModalOpen(true);
        }

        // Refresh messages to get the updated system message
        fetchMessages(false);
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
                {getInitials(
                  message.sender?.name ||
                    (message.isFromAdmin ? "Admin" : "User")
                )}
              </AvatarFallback>
            </Avatar>
            <div className="max-w-full">
              <div
                className={`rounded-lg p-3 text-sm overflow-hidden break-words ${
                  message.isFromAdmin
                    ? "bg-gray-100 text-gray-900"
                    : "bg-blue-500 text-white"
                }`}
              >
                {isCallRequest && (
                  <div className="flex items-center gap-2 mb-1">
                    {callIcon}
                    <span className="font-medium">
                      {isCallAccepted ? "Call Ready" : "Call Request"} (
                      {message.callMode || "VIDEO"})
                    </span>
                  </div>
                )}
                <div
                  className={
                    message.isFromAdmin ? "text-gray-600" : "text-white"
                  }
                >
                  {/* Use dangerouslySetInnerHTML to render markdown-style content in the message */}
                  <div
                    dangerouslySetInnerHTML={{
                      __html:
                        message.content
                          ?.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          ?.replace(
                            /\[([^\]]+)\]\(([^)]+)\)/g,
                            '<a href="$2" target="_blank" class="underline text-blue-500">$1</a>'
                          )
                          ?.replace(/\n/g, "<br />") || "",
                    }}
                  />
                </div>

                {isCallRequest &&
                  !isCallAccepted &&
                  message.content?.includes("Donor requested") && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={handleAcceptCallRequest}
                      >
                        Accept Call Request
                      </Button>
                    </div>
                  )}

                {isCallAccepted && message.callSessionId && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={handleJoinCall}
                    >
                      Join Call
                    </Button>
                  </div>
                )}
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

    // Fallback for unknown message types
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

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

      {isCallModalOpen && currentCallData && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setCurrentCallData(null);
          }}
          position={0}
          totalModals={1}
          roomUrl={currentCallData.roomUrl}
          roomToken={currentCallData.roomToken}
          mode={currentCallData.mode}
          profileData={{
            name: user?.name || "Admin",
            image: user?.avatar || "",
            status: "In Call",
          }}
        />
      )}
    </div>
  );
}
