"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  ChatMessage,
  sendChatMessage,
  getChatMessagesByDonorQuery,
} from "@/lib/api/chat";
import {
  requestCall,
  getCallRequestHistory,
  cancelCallRequest,
} from "@/lib/api/communication";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Video, Phone, Monitor, X } from "lucide-react";
import { useCallManager } from "@/components/providers/CallManagerProvider";
import { CallMode } from "@/types/communication";

interface ChatPanelProps {
  donorQueryId: number;
  fcmToken?: string;
}

interface CallRequest {
  id: string;
  type: "video" | "audio" | "screen";
  timestamp: Date;
  status: "pending" | "accepted" | "declined" | "cancelled";
}

// Interface for the API response
interface CallRequestResponse {
  id: number;
  queryId: number;
  adminId: number;
  mode: string;
  message?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: number;
    name: string;
    avatar?: string;
  };
}

// Extend the ChatMessage interface to include isFromAdmin
interface ExtendedChatMessage extends ChatMessage {
  isFromAdmin: boolean;
}

export function ChatPanel({ donorQueryId, fcmToken }: ChatPanelProps) {
  const { user, token } = useAuth();
  const { isInCall } = useCallManager();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRequestingVideo, setIsRequestingVideo] = useState(false);
  const [isRequestingAudio, setIsRequestingAudio] = useState(false);
  const [isRequestingScreenShare, setIsRequestingScreenShare] = useState(false);
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages and call request history on component mount and when donorQueryId changes
  useEffect(() => {
    if (donorQueryId) {
      fetchMessages();
      fetchCallRequestHistory();
    }
  }, [donorQueryId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, callRequests]);

  // Set up polling for new messages and call requests
  useEffect(() => {
    if (!donorQueryId) return;

    const interval = setInterval(() => {
      fetchMessages(false);
      fetchCallRequestHistory(false);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [donorQueryId]);

  const fetchMessages = async (showLoading = true) => {
    if (!donorQueryId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      // Fetch messages from both endpoints
      const [chatMessages, userMessages] = await Promise.all([
        getChatMessagesByDonorQuery(donorQueryId),
        fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/messages/${donorQueryId}`
        ).then((res) => res.json()),
      ]);

      // Convert chat messages (admin messages)
      const adminMessages = chatMessages.map((msg: ChatMessage) => ({
        ...msg,
        isFromAdmin: true,
      }));

      // Convert user messages
      const convertedUserMessages = (userMessages.data || [])
        .filter((msg: any) => !msg.isFromAdmin)
        .map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: {
            id: -1,
            name: msg.sender?.name || "User",
            role: "user",
          },
          isFromAdmin: false,
        }));

      // Combine and sort all messages by createdAt
      const sortedMessages = [...adminMessages, ...convertedUserMessages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

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

  const fetchCallRequestHistory = async (showLoading = true) => {
    if (!donorQueryId) return;

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      const response = await getCallRequestHistory(donorQueryId);

      // The backend returns { success: boolean, message: string, data: CallRequestResponse[] }
      const requests = response?.data || [];

      // Convert the API response to CallRequest format
      const formattedRequests = requests.map(
        (request: CallRequestResponse) => ({
          id: request.id.toString(),
          type: request.mode.toLowerCase() as "video" | "audio" | "screen",
          timestamp: new Date(request.createdAt),
          status: request.status.toLowerCase() as
            | "pending"
            | "accepted"
            | "declined"
            | "cancelled",
        })
      );

      setCallRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching call request history:", error);
      if (showLoading) {
        toast.error("Failed to load call request history");
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

      await sendChatMessage({
        content: newMessage.trim(),
        senderId: user.id,
        donorQueryId,
        fcmToken,
      });

      setNewMessage("");
      await fetchMessages(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestVideoCall = async () => {
    if (isInCall) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    if (!donorQueryId || !user) {
      toast.error("Query ID or user is missing");
      return;
    }

    setIsRequestingVideo(true);
    try {
      await requestCall(
        donorQueryId,
        CallMode.VIDEO,
        "Admin is requesting a video call"
      );

      // Send a chat message about the video call request
      await sendChatMessage({
        content: "📹 A video call request has been sent",
        senderId: user.id,
        donorQueryId,
        fcmToken,
      });

      toast.success("Video call request sent to donor");
      await fetchMessages(false);
      await fetchCallRequestHistory(false);
    } catch (error) {
      console.error("Error requesting video call:", error);
      toast.error("Failed to request video call");
    } finally {
      setIsRequestingVideo(false);
    }
  };

  const handleRequestAudioCall = async () => {
    if (isInCall) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    if (!donorQueryId || !user) {
      toast.error("Query ID or user is missing");
      return;
    }

    setIsRequestingAudio(true);
    try {
      await requestCall(
        donorQueryId,
        CallMode.AUDIO,
        "Admin is requesting an audio call"
      );

      // Send a chat message about the audio call request
      await sendChatMessage({
        content: "📞 An audio call request has been sent",
        senderId: user.id,
        donorQueryId,
        fcmToken,
      });

      toast.success("Audio call request sent to donor");
      await fetchMessages(false);
      await fetchCallRequestHistory(false);
    } catch (error) {
      console.error("Error requesting audio call:", error);
      toast.error("Failed to request audio call");
    } finally {
      setIsRequestingAudio(false);
    }
  };

  const handleRequestScreenShare = async () => {
    if (isInCall) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    if (!donorQueryId || !user) {
      toast.error("Query ID or user is missing");
      return;
    }

    setIsRequestingScreenShare(true);
    try {
      await requestCall(
        donorQueryId,
        CallMode.VIDEO,
        "Admin is requesting a screen sharing session"
      );

      // Send a chat message about the screen sharing request
      await sendChatMessage({
        content: "🖥️ A screen sharing request has been sent",
        senderId: user.id,
        donorQueryId,
        fcmToken,
      });

      toast.success("Screen sharing request sent to donor");
      await fetchMessages(false);
      await fetchCallRequestHistory(false);
    } catch (error) {
      console.error("Error requesting screen sharing:", error);
      toast.error("Failed to request screen sharing");
    } finally {
      setIsRequestingScreenShare(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!user) return;

    try {
      // Call the backend to cancel the request
      await cancelCallRequest(requestId);

      // Send a chat message about the cancellation
      await sendChatMessage({
        content: "❌ The call request has been cancelled",
        senderId: user.id,
        donorQueryId,
        fcmToken,
      });

      toast.success("Request cancelled");
      await fetchMessages(false);
      await fetchCallRequestHistory(false);
    } catch (error) {
      console.error("Error cancelling call request:", error);
      toast.error("Failed to cancel request");
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
        {messages.length === 0 && callRequests.length === 0 ? (
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
                  <div
                    className={`flex ${
                      message.isFromAdmin ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`flex ${
                        message.isFromAdmin ? "flex-row" : "flex-row-reverse"
                      } items-start gap-2 max-w-[80%]`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.sender?.avatar || ""} />
                        <AvatarFallback>
                          {getInitials(message.sender?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg p-2 text-sm ${
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
                </div>
              );
            })}

            {/* Call Request Messages */}
            {callRequests.map((request) => {
              const requestTypeText =
                request.type === "video"
                  ? "Video call"
                  : request.type === "audio"
                  ? "Audio call"
                  : "Screen sharing";

              return (
                <div key={request.id} className="flex justify-center my-4">
                  <div
                    className={`
                    rounded-lg p-3 shadow-sm max-w-sm w-full
                    ${
                      request.status === "pending"
                        ? "bg-blue-50 border border-blue-100"
                        : "bg-gray-50 border border-gray-100"
                    }
                  `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {request.type === "video" && (
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Video className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        {request.type === "audio" && (
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        {request.type === "screen" && (
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Monitor className="h-4 w-4 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {requestTypeText} Request
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.status === "pending"
                              ? "Waiting for donor to join..."
                              : request.status === "accepted"
                              ? "Request accepted"
                              : request.status === "declined"
                              ? "Request declined"
                              : "Request cancelled"}
                          </div>
                        </div>
                      </div>

                      {request.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <X className="h-4 w-4" />
                          <span className="ml-1">Cancel</span>
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 text-center">
                      {formatTime(request.timestamp.toString())}
                    </div>
                  </div>
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
            onClick={handleRequestVideoCall}
            disabled={isRequestingVideo || isInCall}
          >
            {isRequestingVideo ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Video className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={handleRequestAudioCall}
            disabled={isRequestingAudio || isInCall}
          >
            {isRequestingAudio ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Phone className="h-3 w-3" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8"
            onClick={handleRequestScreenShare}
            disabled={isRequestingScreenShare || isInCall}
          >
            {isRequestingScreenShare ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></span>
            ) : (
              <Monitor className="h-3 w-3" />
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
    </div>
  );
}
