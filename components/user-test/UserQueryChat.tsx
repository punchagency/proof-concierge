'use client'

import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth/auth-context';
import { 
  ChatMessage, 
  getChatMessagesByDonorQuery 
} from '@/lib/api/chat';
import { 
  requestCall,
  getCallRequestHistory,
} from '@/lib/api/communication';
import { Video, Phone, Monitor } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { CallMode } from '@/types/communication';

interface Message extends ChatMessage {
  isFromAdmin: boolean;
}

interface CallRequest {
  id: number;
  queryId: number;
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

interface UserQueryChatProps {
  query: {
    id: number;
    sid: string;
    donor: string;
    messages: Message[];
  };
}

export default function UserQueryChat({ query }: UserQueryChatProps) {
  const [messages, setMessages] = useState<Message[]>(query.messages || []);
  const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (showError = true) => {
    try {
      // Fetch messages from both endpoints
      const [chatMessages, userMessages] = await Promise.all([
        getChatMessagesByDonorQuery(query.id),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/messages/${query.id}`).then(res => res.json())
      ]);

      // Convert chat messages (admin messages)
      const adminMessages = chatMessages.map((msg: ChatMessage) => ({
        ...msg,
        isFromAdmin: true
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
            name: query.donor,
            role: 'user'
          },
          isFromAdmin: false
        }));

      // Combine and sort all messages by createdAt
      const allMessages = [...adminMessages, ...convertedUserMessages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(allMessages);
      scrollToBottom();
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (showError) {
        toast.error("Failed to fetch messages");
      }
    }
  };

  const fetchCallRequestHistory = async (showError = true) => {
    try {
      const response = await getCallRequestHistory(query.id);
      // The backend returns { success: boolean, message: string, data: CallRequest[] }
      const requests = response?.data || [];
      setCallRequests(Array.isArray(requests) ? requests : []);
    } catch (error) {
      console.error("Error fetching call requests:", error);
      if (showError) {
        toast.error("Failed to fetch call requests");
      }
      setCallRequests([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setIsLoading(true);
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          queryId: query.id,
          isFromAdmin: false,
        }),
      });
      setNewMessage("");
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleCallAction = async (requestId: number, action: 'accept' | 'decline') => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/communication/call-requests/${query.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: action === 'accept' ? "ACCEPTED" : "DECLINED",
          callRequestId: requestId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} call request`);
      }

      const data = await response.json();
      toast.success(`Call request ${action}ed successfully`);
      
      // If accepted and it's a video/audio call, redirect to the call room
      if (action === 'accept' && data.roomUrl) {
        window.location.href = data.roomUrl;
      }

      // Refresh the call requests
      await fetchCallRequestHistory();
    } catch (error) {
      console.error(`Error ${action}ing call request:`, error);
      toast.error(`Failed to ${action} call request`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestCall = async (mode: string) => {
    try {
      setIsLoading(true);
      await requestCall(query.id, mode as CallMode, "User is requesting a call");
      toast.success(`${mode.replace(/_/g, ' ').toLowerCase()} request sent`);
      await fetchCallRequestHistory();
    } catch (error) {
      console.error('Error requesting call:', error);
      toast.error('Failed to request call');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Set initial messages from the query
    setMessages(query.messages || []);
    scrollToBottom();

    // Initial fetch
    fetchMessages();
    fetchCallRequestHistory();

    // Poll for new messages and call requests every 10 seconds
    const interval = setInterval(() => {
      fetchMessages(false);
      fetchCallRequestHistory(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [query.id, query.messages]);

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4">
        {messages.length === 0 && callRequests.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt);
              
              return (
                <div key={message.id} className="space-y-2">
                  {showDate && (
                    <div className="text-center text-xs text-gray-500 my-2">
                      {formatDate(message.createdAt)}
                    </div>
                  )}
                  <div 
                    className={`flex ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex ${message.isFromAdmin ? 'flex-row' : 'flex-row-reverse'} items-start gap-2 max-w-[80%]`}>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={message.sender?.avatar || ''} />
                        <AvatarFallback>{getInitials(message.sender?.name || 'U')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className={`rounded-lg p-2 text-sm ${
                          message.isFromAdmin 
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-500 text-white'
                        }`}>
                          {message.content}
                        </div>
                        <div className={`text-xs text-gray-500 mt-0.5 ${
                          message.isFromAdmin ? 'text-left' : 'text-right'
                        }`}>
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
              const getCallIcon = () => {
                switch (request.mode.toLowerCase()) {
                  case 'video_call':
                    return <Video className="h-4 w-4" />;
                  case 'audio_call':
                    return <Phone className="h-4 w-4" />;
                  case 'screen_share':
                    return <Monitor className="h-4 w-4" />;
                  default:
                    return null;
                }
              };
              
              return (
                <div key={request.id} className="flex justify-start my-4">
                  <div className="flex flex-col max-w-[80%] w-full">
                    <div className="flex items-start gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" />
                        <AvatarFallback>{getInitials(request.admin.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className={`
                          rounded-lg p-3
                          ${request.status === 'PENDING'
                            ? 'bg-blue-50 border border-blue-100'
                            : request.status === 'ACCEPTED'
                            ? 'bg-green-50 border border-green-100'
                            : request.status === 'DECLINED'
                            ? 'bg-red-50 border border-red-100'
                            : 'bg-gray-50 border border-gray-100'
                          }
                        `}>
                          <div className="flex items-center gap-2 mb-2">
                            {getCallIcon()}
                            <span className="font-medium text-sm">
                              {request.mode.replace(/_/g, ' ')} Request
                            </span>
                          </div>
                          {request.message && (
                            <p className="text-sm text-gray-600 mb-3">{request.message}</p>
                          )}
                          {request.status === 'PENDING' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleCallAction(request.id, 'decline')}
                              >
                                Decline
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleCallAction(request.id, 'accept')}
                              >
                                Accept
                              </Button>
                            </div>
                          ) : (
                            <div className={`
                              text-sm font-medium text-center
                              ${request.status === 'ACCEPTED'
                                ? 'text-green-600'
                                : request.status === 'DECLINED'
                                ? 'text-red-600'
                                : 'text-gray-600'
                              }
                            `}>
                              {request.status === 'ACCEPTED'
                                ? 'Call request accepted'
                                : request.status === 'DECLINED'
                                ? 'Call request declined'
                                : 'Call request cancelled'
                              }
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTime(request.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="relative p-4">
        <div className="flex items-center gap-2 mb-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => handleRequestCall('VIDEO_CALL')}
            disabled={isLoading}
          >
            <Video className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => handleRequestCall('AUDIO_CALL')}
            disabled={isLoading}
          >
            <Phone className="h-3 w-3" />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={() => handleRequestCall('SCREEN_SHARE')}
            disabled={isLoading}
          >
            <Monitor className="h-3 w-3" />
          </Button>
        </div>
        
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="resize-none pr-16 pb-8"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button 
          onClick={sendMessage}
          disabled={isLoading || !newMessage.trim()}
          className="absolute right-6 bottom-6"
          size="sm"
        >
          {isLoading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          ) : (
            'Send'
          )}
        </Button>
      </div>
    </div>
  );
} 