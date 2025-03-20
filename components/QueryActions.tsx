"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  resolveQuery,
  transferQueryToUser,
  fetchAdminUsers,
  DonorQuery,
  sendQueryReminder,
} from "@/lib/api/donor-queries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCallManager } from "./providers/CallManagerProvider";
import { Video, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryRefresh } from "@/lib/hooks/use-query-refresh";

interface AdminUser {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

interface QueryActionsProps {
  query: DonorQuery;
  onActionComplete: () => void;
  showCommunicationButtons?: boolean;
}

export function QueryActions({
  query,
  onActionComplete,
  showCommunicationButtons = false,
}: QueryActionsProps) {
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [isTransferToUserDialogOpen, setIsTransferToUserDialogOpen] =
    useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [importantNote, setImportantNote] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { startVideoCall, startAudioCall, isInCall } = useCallManager();

  // Get the refresh function from the context
  const { triggerRefresh } = useQueryRefresh();

  // Fetch admin users when the component mounts
  useEffect(() => {
    const getAdminUsers = async () => {
      const response = await fetchAdminUsers();
      if (response && response.data) {
        setAdminUsers(response.data);
      }
    };

    getAdminUsers();
  }, []);

  const handleResolve = async () => {
    setIsLoading(true);
    try {
      const resolvedQuery = await resolveQuery(query.id);
      if (resolvedQuery) {
        toast.success("Query has been resolved successfully");
        setIsResolveDialogOpen(false);
        
        // Trigger the global refresh to update all tabs
        triggerRefresh();
        
        // Then call the local callback
        onActionComplete();
      } else {
        toast.error("Failed to resolve query");
      }
    } catch (error) {
      console.error("Error resolving query:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransferToUser = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user to transfer to");
      return;
    }

    setIsLoading(true);
    try {
      const success = await transferQueryToUser(
        query.id,
        selectedUserId,
        importantNote
      );
      if (success) {
        toast.success("Query has been transferred to user");
        setIsTransferToUserDialogOpen(false);
        
        // Trigger the global refresh to update all tabs
        triggerRefresh();
        
        // Then call the local callback
        onActionComplete();
      } else {
        toast.error("Failed to transfer query to user");
      }
    } catch (error) {
      console.error("Error transferring query to user:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCall) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    startVideoCall(query.id, parseInt(query.donorId), {
      name: query.donor,
      image: `/images/${query.donorId}.jpg`,
      status: "Available",
    });
  };

  const handleAudioCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInCall) {
      toast.error(
        "You are already in a call. Please end the current call first."
      );
      return;
    }

    startAudioCall(query.id, parseInt(query.donorId), {
      name: query.donor,
      image: `/images/${query.donorId}.jpg`,
      status: "Available",
    });
  };

  const handleSendReminder = async () => {
    setIsLoading(true);
    try {
      const success = await sendQueryReminder(query.id, reminderMessage);
      if (success) {
        toast.success(`Reminder sent to ${query.transferredTo}`);
        setIsReminderDialogOpen(false);
        setReminderMessage("");
        
        // Trigger the global refresh
        triggerRefresh();
      } else {
        toast.error("Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to stop event propagation
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Open dialog functions with stopPropagation
  const openResolveDialog = (e: React.MouseEvent) => {
    stopPropagation(e);
    setIsResolveDialogOpen(true);
  };

  const openTransferToUserDialog = (e: React.MouseEvent) => {
    stopPropagation(e);
    setIsTransferToUserDialogOpen(true);
  };

  const openReminderDialog = (e: React.MouseEvent) => {
    stopPropagation(e);
    setIsReminderDialogOpen(true);
  };

  return (
    <div
      className="flex flex-wrap gap-1 items-center justify-start"
      onClick={stopPropagation}
    >
      {showCommunicationButtons && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVideoCall}
            disabled={
              query.status === "Resolved" ||
              query.status === "Transferred" ||
              isInCall
            }
            className="px-2 h-7"
          >
            <Video className="h-3 w-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAudioCall}
            disabled={
              query.status === "Resolved" ||
              query.status === "Transferred" ||
              isInCall
            }
            className="px-2 h-7"
          >
            <Phone className="h-3 w-3" />
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={openResolveDialog}
        disabled={query.status === "Resolved" || query.status === "Transferred"}
        className="text-xs px-2 py-0.5 h-7"
      >
        Resolve
      </Button>
      {adminUsers.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={openTransferToUserDialog}
          disabled={
            query.status === "Resolved" || query.status === "Transferred"
          }
          className="text-xs px-2 py-0.5 h-7"
        >
          To Admin
        </Button>
      )}
      {query.status === "Transferred" && (
        <Button
          variant="outline"
          size="sm"
          onClick={openReminderDialog}
          className="text-xs px-2 py-0.5 h-7"
        >
          Reminder
        </Button>
      )}

      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent onClick={stopPropagation}>
          <DialogHeader>
            <DialogTitle>Resolve Query</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this query as resolved?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isLoading}>
              {isLoading ? "Resolving..." : "Resolve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer to User Dialog */}
      <Dialog
        open={isTransferToUserDialogOpen}
        onOpenChange={setIsTransferToUserDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer Query to User</DialogTitle>
            <DialogDescription>
              Select a user to transfer this query to. You can also add an
              important note.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user" className="text-right">
                User
              </Label>
              <Select
                value={selectedUserId?.toString() || ""}
                onValueChange={(value) => setSelectedUserId(parseInt(value))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {adminUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                Note
              </Label>
              <Textarea
                id="note"
                value={importantNote}
                onChange={(e) => setImportantNote(e.target.value)}
                placeholder="Add an important note for the user"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleTransferToUser}
              disabled={isLoading || !selectedUserId}
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                "Transfer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Reminder Dialog */}
      <Dialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
      >
        <DialogContent onClick={stopPropagation}>
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder to {query.transferredTo} about this query
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="col-span-4">
                <Textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Add an optional message to include with the reminder"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSendReminder} disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
