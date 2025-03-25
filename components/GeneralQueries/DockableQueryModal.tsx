'use client';

import { useState, useEffect } from 'react';
import { GeneralQueriesProps } from '../GeneralQueries';
import { toast } from 'sonner';
import { acceptQuery, transferQueryToUser, resolveQuery, fetchAdminUsers } from '@/lib/api/donor-queries';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle, MoreVertical, PhoneOff } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatPanel } from '../chat/ChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-context';
import { blueToast } from '@/lib/utils';
import { useAtom } from 'jotai';
import { callStateAtom, endCallAtom } from '@/lib/atoms/callState';
import { DailyCall } from '../communication/DailyCall';
import { CallUI } from '../communication/CallUI';
import contextBridge from '@/lib/context-bridge';

// Interface for admin users
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

// Interface for the component props
interface DockableQueryModalProps {
  data: GeneralQueriesProps & {
    assignedToUser?: {
      id: number;
      name: string;
      role: string;
    };
  };
  initiallyAccepted?: boolean;
}

export function DockableQueryModal({ data, initiallyAccepted = false }: DockableQueryModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Core states
  const [isAccepted, setIsAccepted] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  
  // Transfer and resolve states
  const [isTransferring, setIsTransferring] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  // Call states
  const [callState] = useAtom(callStateAtom);
  const [, endCall] = useAtom(endCallAtom);
  const [isInCall, setIsInCall] = useState(false);

  // Monitor call state changes
  useEffect(() => {
    const shouldBeInCall = callState.isActive && 
      callState.queryId === data.id && 
      Boolean(callState.roomUrl) && 
      Boolean(callState.roomToken);
    
    setIsInCall(shouldBeInCall);
  }, [callState, data.id]);

  // Main useEffect - determine if the query is accepted
  useEffect(() => {
    // Check if the query is accepted based on direct data properties
    let queryIsAccepted = false;

    // 1. Check if initiallyAccepted prop is true
    if (initiallyAccepted) {
      queryIsAccepted = true;
    }
    // 2. Check if the query is assigned to a user
    else if (data.assignedToUser?.id) {
      queryIsAccepted = true;
    }

    // Set the state based on direct data properties
    setIsAccepted(queryIsAccepted);
  }, [data.id, data.assignedToUser, initiallyAccepted]);

  // Fetch admin users for transfer
  useEffect(() => {
    const getAdminUsers = async () => {
      try {
        const result = await fetchAdminUsers();
        if (result && result.data) {
          setAdminUsers(result.data);
        }
      } catch (error) {
        console.error("Error fetching admin users:", error);
      }
    };
    getAdminUsers();
  }, []);

  const handleAcceptQuery = async () => {
    if (!data.id) {
      blueToast("Query ID is missing", {}, 'error');
      return;
    }
    
    // Check if query is already resolved or transferred
    if (data.status === "Resolved" || data.status === "Transferred") {
      blueToast(`Cannot accept a ${data.status.toLowerCase()} query`, {
        description: "This query has already been processed."
      }, 'error');
      return;
    }
    
    // Check if already assigned to another user
    if (data.assignedToUser?.id) {
      blueToast(`Query already accepted`, {
        description: `This query has already been accepted by ${data.assignedToUser.name || "another admin"}`
      }, 'info');
      setIsAccepted(true);
      return;
    }
    
    // Show loading state
    setIsAccepting(true);
    
    try {
      blueToast("Accepting query...", {}, 'default');
      
      // Call the API to accept the query
      const success = await acceptQuery(data.id);
      
      if (success) {
        // Mark as accepted in the UI
        setIsAccepted(true);
        
        blueToast(`Query from ${data.donor} accepted`, {
          description: "You can now chat with the donor"
        }, 'success');
        
        // Force refresh to update the table
        router.refresh();
      } else {
        blueToast("Failed to accept query", {
          description: "Please try again or contact support"
        }, 'error');
      }
    } catch (error) {
      console.error("Error accepting query:", error);
      blueToast("Server error", {
        description: "Could not connect to the server"
      }, 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleTransferQuery = async () => {
    if (!data.id || !selectedAdmin) {
      toast.error("Please select an admin to transfer to");
      return;
    }
    
    setIsTransferring(true);
    try {
      const success = await transferQueryToUser(data.id, parseInt(selectedAdmin));
      if (success) {
        toast.success(`Query transferred successfully`);
        router.refresh();
        setTransferDialogOpen(false);
        
        // Get modal context and close this modal
        const modalContext = contextBridge.getDockableModalContext();
        if (modalContext) {
          setTimeout(() => {
            modalContext.closeModal(`query-${data.id}`);
          }, 500); // Short delay to let the success message be seen
        }
      } else {
        toast.error("Failed to transfer query");
      }
    } catch (error) {
      console.error("Error transferring query:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleResolveQuery = async () => {
    if (!data.id) {
      toast.error("Query ID is missing");
      return;
    }
    
    setIsResolving(true);
    try {
      const userId = user?.id || 1;
      
      const success = await resolveQuery(data.id);
      
      if (success) {
        toast.success(`Query resolved successfully`);
        router.refresh();
        setResolveDialogOpen(false);
        
        // Get modal context and close this modal
        const modalContext = contextBridge.getDockableModalContext();
        if (modalContext) {
          setTimeout(() => {
            modalContext.closeModal(`query-${data.id}`);
          }, 500); // Short delay to let the success message be seen
        }
      } else {
        toast.error("Failed to resolve query");
      }
    } catch (error) {
      console.error("Error resolving query:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsResolving(false);
    }
  };

  const handleEndCall = () => {
    if (callState.isActive) {
      endCall();
      blueToast("Call ended", {}, 'default');
    }
  };

  // QUERY INFO VIEW - Show this if the query is not accepted
  if (!isAccepted) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex flex-col gap-y-2">
          <div>
            <label className="text-[12px] text-gray-500">Session ID</label>
            <p className="font-semibold text-[14px]">SID_{data.id}</p>
          </div>
          <div className="flex flex-row gap-x-[72px]">
            <div>
              <label className="text-[12px] text-gray-500">Donor</label>
              <p className="font-semibold text-[14px]">{data.donor}</p>
            </div>
            <div>
              <label className="text-[12px] text-gray-500">Donor ID</label>
              <p className="font-semibold text-[14px]">{data.donorId}</p>
            </div>
          </div>
          <div>
            <label className="text-[12px] text-gray-500">Test</label>
            <p className="font-semibold text-[14px]">{data.test}</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-500">Device</label>
            <p className="font-semibold text-[14px]">{data.device}</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-500">Stage</label>
            <p className="font-semibold text-[14px]">{data.stage}</p>
          </div>
          <div>
            <label className="text-[12px] text-gray-500">Date & Time</label>
            <p className="font-semibold text-[14px]">
              {new Date(data.dateNdTime).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>

          {/* Accept Button */}
          <div className="flex justify-center mt-4">
            <button
              className="w-full py-3 px-4 bg-[#009CF9] text-white rounded-md font-medium hover:bg-[#0084d6] transition-colors"
              onClick={handleAcceptQuery}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Accepting...
                </span>
              ) : (
                "Accept Query"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CHAT VIEW WITH POTENTIAL CALL - Show this if the query is accepted
  return (
    <div className="flex flex-col h-full">
      {/* Top header section with controls */}
      <div className="flex justify-between items-center mb-2 px-2">
        <div>
          <p className="text-sm text-gray-500">
            {data.test} - Donor ID: {data.donorId}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {isInCall && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="h-7 flex items-center gap-1" 
              onClick={handleEndCall}
            >
              <PhoneOff className="h-3.5 w-3.5" />
              <span className="text-xs">End Call</span>
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span>Transfer</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span>Resolve</span>
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Dialog for transferring query */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Query</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Select an admin to transfer this query to:</p>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger>
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {adminUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleTransferQuery} 
                disabled={isTransferring}
              >
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for resolving query */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Query</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to resolve this query?</p>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleResolveQuery} 
                disabled={isResolving}
              >
                {isResolving ? 'Resolving...' : 'Resolve'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Main content area - either call UI or chat panel */}
      <div className="flex-1 overflow-hidden relative">
        {isInCall ? (
          <div className="absolute inset-0 z-10">
            <DailyCall
              roomUrl={callState.roomUrl || ''}
              roomToken={callState.roomToken || ''}
              mode={callState.mode === 'video' ? 'video' : 'audio'}
            >
              <CallUI onLeave={handleEndCall} />
            </DailyCall>
          </div>
        ) : (
          <ChatPanel donorQueryId={data.id || parseInt(data.id.toString())} />
        )}
      </div>
    </div>
  );
} 