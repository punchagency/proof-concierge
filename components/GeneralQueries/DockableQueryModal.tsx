'use client';

import { useState, useEffect } from 'react';
import { GeneralQueriesProps } from '../GeneralQueries';
import { toast } from 'sonner';
import { acceptQuery, transferQueryToUser, resolveQuery, fetchAdminUsers } from '@/lib/api/donor-queries';
import { useRouter } from 'next/navigation';
import { UserPlus, CheckCircle, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { ChatPanel } from '../chat/ChatPanel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { useAuth } from '@/lib/auth/auth-context';

// Keep the original interface with number id
interface DockableQueryModalProps {
  data: GeneralQueriesProps; // This has id as number
  initiallyAccepted?: boolean;
}

// First, define a proper interface for admin users
interface AdminUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export function DockableQueryModal({ data, initiallyAccepted = false }: DockableQueryModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isAccepted, setIsAccepted] = useState(initiallyAccepted);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>('');
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  // Check localStorage on mount to see if this query was previously accepted
  useEffect(() => {
    if (!initiallyAccepted && data.id) {
      const acceptedQueries = JSON.parse(localStorage.getItem('acceptedQueries') || '{}');
      if (acceptedQueries[data.id]) {
        setIsAccepted(true);
      }
    }
  }, [data.id, initiallyAccepted]);

  // Fetch admin users for transfer
  useEffect(() => {
    const getAdminUsers = async () => {
      const result = await fetchAdminUsers();
      if (result && result.data) {
        setAdminUsers(result.data);
      }
    };
    getAdminUsers();
  }, []);

  const handleAcceptQuery = async () => {
    if (!data.id) {
      toast.error("Query ID is missing");
      return;
    }
    
    setIsAccepting(true);
    try {
      const success = await acceptQuery(data.id);
      
      // Even if the backend returns an error, we'll still proceed to the chat view
      // This is a temporary workaround until the backend is fixed
      setIsAccepted(true);
      
      // Store the accepted state in localStorage
      const acceptedQueries = JSON.parse(localStorage.getItem('acceptedQueries') || '{}');
      acceptedQueries[data.id] = true;
      localStorage.setItem('acceptedQueries', JSON.stringify(acceptedQueries));
      
      if (success) {
        toast.success(`Query from ${data.donor} accepted`);
      } else {
        // Show a warning instead of an error to indicate we're proceeding anyway
        toast.warning(`There was an issue accepting the query, but you can still proceed with the chat`);
      }
    } catch (error) {
      console.error("Error accepting query:", error);
      toast.warning("There was an issue with the server, but you can still proceed with the chat");
      // Still proceed to chat view despite the error
      setIsAccepted(true);
      
      // Store the accepted state in localStorage even if there was an error
      const acceptedQueries = JSON.parse(localStorage.getItem('acceptedQueries') || '{}');
      acceptedQueries[data.id] = true;
      localStorage.setItem('acceptedQueries', JSON.stringify(acceptedQueries));
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
        
        // Remove from accepted queries in localStorage
        const acceptedQueries = JSON.parse(localStorage.getItem('acceptedQueries') || '{}');
        delete acceptedQueries[data.id];
        localStorage.setItem('acceptedQueries', JSON.stringify(acceptedQueries));
        
        router.refresh();
        setTransferDialogOpen(false);
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
      // Use the current user's ID if available, otherwise use a default value
      const userId = user?.id || 1;
      console.log(`Resolving query ${data.id} with user ID ${userId}`);
      
      const success = await resolveQuery(data.id, userId);
      
      if (success) {
        toast.success(`Query resolved successfully`);
        
        // Remove from accepted queries in localStorage
        const acceptedQueries = JSON.parse(localStorage.getItem('acceptedQueries') || '{}');
        delete acceptedQueries[data.id];
        localStorage.setItem('acceptedQueries', JSON.stringify(acceptedQueries));
        
        // Force a refresh of the page to update the table
        router.refresh();
        
        // Close the dialog
        setResolveDialogOpen(false);
        
        // Add a small delay before redirecting to ensure the toast is visible
        setTimeout(() => {
          // Redirect to the resolved queries page
          router.push('/resolved-queries');
        }, 1500);
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

  // If the query is not yet accepted, show the details view
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

  // If the query is accepted, show the chat view with options in a hamburger menu
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <p className="text-sm text-gray-500">
            {data.test} - Donor ID: {data.donorId}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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
      
      <div className="flex-1 overflow-hidden">
        <ChatPanel donorQueryId={data.id || parseInt(data.id.toString())} />
      </div>
    </div>
  );
} 