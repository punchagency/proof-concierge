"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { DockableModal } from "../ui/dockable-modal";
import { QueryDetails } from "../QueryDetails";
import { DockableQueryModal } from "../GeneralQueries/DockableQueryModal";
import { GeneralQuery } from "@/lib/api/donor-queries";
import { callStateAtom, endCallAtom } from "@/lib/atoms/callState";
import { useAtom } from "jotai";
import { endCall as endCallApi, updateQueryMode } from "@/lib/api/communication";
import { usePathname } from "next/navigation";
import { CallManagerProvider } from "./CallManagerProvider";
import contextBridge from "@/lib/context-bridge";

// Serializable modal data structure
interface SerializableModalData {
  id: string;
  type: 'query' | 'details';
  queryData?: GeneralQuery;  // Use GeneralQuery type
  profileData: {
    name: string;
    image: string;
    status: string;
  };
}

interface Modal {
  id: string;
  content: React.ReactNode;
  profileData: {
    name: string;
    image: string;
    status: string;
  };
}

interface DockableModalContextType {
  openModal: (
    id: string,
    content: React.ReactNode,
    profileData: { name: string; image: string; status: string }
  ) => void;
  closeModal: (id: string) => void;
}

export const DockableModalContext = createContext<
  DockableModalContextType | undefined
>(undefined);

export function useDockableModal() {
  const context = useContext(DockableModalContext);
  if (!context) {
    throw new Error(
      "useDockableModal must be used within a DockableModalProvider"
    );
  }
  return context;
}

// Define type for iframe with Daily instance
interface DailyIframe extends HTMLIFrameElement {
  daily?: {
    leave: () => void;
    destroy: () => void;
  };
}

// New component to avoid circular dependency - this component is used only in this file
function ModalCallProvider({ children }: { children: React.ReactNode }) {
  return <CallManagerProvider>{children}</CallManagerProvider>;
}

export function DockableModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modals, setModals] = useState<Modal[]>([]);
  const [maxModals, setMaxModals] = useState(5);
  const [callState] = useAtom(callStateAtom);
  const [, endCall] = useAtom(endCallAtom);
  const pathname = usePathname();
  const isDonorQueriesPage = pathname === '/donor-queries';

  // Restore modals from localStorage on mount - only on donor-queries page
  useEffect(() => {
    if (!isDonorQueriesPage) return;
    
    const savedModals = localStorage.getItem('openModals');
    if (savedModals) {
      try {
        const parsedModals: SerializableModalData[] = JSON.parse(savedModals);
        
        // Convert serializable data back to Modal objects with proper React components
        const reconstructedModals = parsedModals.map(modalData => {
          let content: React.ReactNode;
          
          // Add dateNdTime if it's missing
          const queryData = modalData.queryData ? {
            ...modalData.queryData,
            dateNdTime: modalData.queryData.dateNdTime || new Date(modalData.queryData.createdAt).toLocaleString()
          } : undefined;
          
          // Reconstruct the appropriate component based on the type
          if (modalData.type === 'query') {
            content = <DockableQueryModal data={queryData!} />;
          } else if (modalData.type === 'details') {
            content = <QueryDetails data={queryData!} />;
          }
          
          return {
            id: modalData.id,
            content,
            profileData: modalData.profileData
          };
        });
        
        setModals(reconstructedModals);
      } catch (error) {
        console.error('Error restoring modals from localStorage:', error);
      }
    }
  }, [isDonorQueriesPage]);

  // Save modals to localStorage whenever they change - only on donor-queries page
  useEffect(() => {
    if (!isDonorQueriesPage) return;
    
    // Convert Modal objects to serializable format
    const serializableModals: SerializableModalData[] = modals.map(modal => {
      // Determine the type and extract necessary data based on the content
      const isQueryModal = React.isValidElement(modal.content) && modal.content.type === DockableQueryModal;
      const isDetailsModal = React.isValidElement(modal.content) && modal.content.type === QueryDetails;
      
      const queryData = isQueryModal || isDetailsModal 
        ? (modal.content as React.ReactElement<{ data: GeneralQuery }>)?.props?.data 
        : undefined;

      return {
        id: modal.id,
        type: isQueryModal ? 'query' : 'details',
        queryData,
        profileData: modal.profileData
      };
    });

    localStorage.setItem('openModals', JSON.stringify(serializableModals));
  }, [modals, isDonorQueriesPage]);

  // Modal width and spacing constants
  const MODAL_WIDTH = 373;
  const MODAL_SPACING = 7.5;

  // Calculate max modals based on screen width
  useEffect(() => {
    const calculateMaxModals = () => {
      const screenWidth = window.innerWidth;
      // Calculate how many modals can fit with spacing
      const calculatedMax = Math.floor(
        screenWidth / (MODAL_WIDTH + MODAL_SPACING)
      );
      // Limit to 5 modals maximum, and ensure at least 1
      setMaxModals(Math.min(Math.max(calculatedMax, 1), 5));
    };

    // Calculate on mount
    calculateMaxModals();

    // Recalculate when window is resized
    window.addEventListener("resize", calculateMaxModals);

    // Cleanup
    return () => window.removeEventListener("resize", calculateMaxModals);
  }, []);

  const openModal = useCallback(
    (
      id: string,
      content: React.ReactNode,
      profileData: { name: string; image: string; status: string }
    ) => {
      // Check if modal with this id already exists
      if (modals.some((modal) => modal.id === id)) {
        // If it exists, bring it to the front by removing and adding it again
        setModals((prev) => {
          const filtered = prev.filter((modal) => modal.id !== id);
          return [...filtered, { id, content, profileData }];
        });
        return;
      }

      // Check if we already have the maximum number of modals open
      if (modals.length >= maxModals) {
        // Remove the oldest modal (first in the array) and add the new one
        setModals((prev) => {
          const newModals = [...prev.slice(1), { id, content, profileData }];
          return newModals;
        });
        return;
      }

      // Otherwise, just add the new modal
      setModals((prev) => [...prev, { id, content, profileData }]);
    },
    [modals, maxModals]
  );

  const closeModal = useCallback((id: string) => {
    const modalToClose = modals.find(modal => modal.id === id);
    const isActiveCall = callState.isActive && callState.roomName;
    
    // Immediately remove the modal to make the UI responsive
    setModals((prev) => prev.filter((modal) => modal.id !== id));
    
    // If no call is active, we're done
    if (!isActiveCall) return;
    
    console.log("Ending call due to modal closing");
    
    // Immediately end call state for UI responsiveness
    endCall();
    
    // Handle API cleanup separately in the background
    queueMicrotask(() => {
      try {
        // First, try to find and clean up Daily iframe
        document.querySelectorAll('iframe').forEach(iframe => {
          if (iframe.src && iframe.src.includes('daily')) {
            try {
              const dailyInstance = (iframe as DailyIframe).daily;
              if (dailyInstance?.leave) dailyInstance.leave();
              if (dailyInstance?.destroy) dailyInstance.destroy();
            } catch (e) {}
            // Remove the iframe for immediate visual cleanup
            iframe.remove();
          }
        });
        
        // Then handle API calls without blocking UI
        endCallApi(callState.roomName!)
          .then(() => {
            if (callState.queryId) {
              return updateQueryMode(callState.queryId, "Text");
            }
          })
          .catch(() => {});
        
        // Clean up media in background
        setTimeout(cleanupMediaResources, 100);
      } catch (error) {
        console.error("Error in background cleanup:", error);
      }
    });
  }, [modals, callState.isActive, callState.roomName, callState.queryId, endCall]);

  // Register the context with the bridge to avoid circular dependencies
  useEffect(() => {
    contextBridge.registerDockableModalContext(openModal, closeModal);
    return () => {
      // Clear the registration on unmount
      contextBridge.registerDockableModalContext(() => {}, () => {});
    };
  }, [openModal, closeModal]);

  // Helper function to clean up media resources
  const cleanupMediaResources = () => {
    // Cleanup method 1: Get all media streams from elements and stop tracks
    document.querySelectorAll('video, audio').forEach(element => {
      const mediaElement = element as HTMLMediaElement;
      if (mediaElement.srcObject instanceof MediaStream) {
        const stream = mediaElement.srcObject;
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped track: ${track.kind}, enabled: ${track.enabled}, state: ${track.readyState}`);
        });
        mediaElement.srcObject = null;
      }
    });

    // Cleanup method 2: Find all iframes that could contain Daily.co and remove them
    document.querySelectorAll('iframe').forEach(iframe => {
      if (iframe.src && (iframe.src.includes('daily') || iframe.hasAttribute('data-daily-iframe'))) {
        console.log(`Removing Daily iframe: ${iframe.src}`);
        iframe.remove();
      }
    });

    // Cleanup method 3: Find and stop any active media tracks globally
    if (navigator && navigator.mediaDevices) {
      // Get current active tracks from getUserMedia
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log(`Stopped media track: ${track.kind}`);
          });
        })
        .catch(() => console.log('No media streams to stop'));
      
      // Also check for any enumerateDevices change to reset permissions
      navigator.mediaDevices.enumerateDevices()
        .then(() => console.log("Media device enumeration complete"))
        .catch(() => console.log("Media device enumeration error"));
    }

    console.log("Successfully released all camera and microphone resources");
  };

  return (
    <DockableModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modals.map((modal, index) => (
        <DockableModal
          key={modal.id}
          isOpen={true}
          onClose={() => closeModal(modal.id)}
          position={index}
          totalModals={modals.length}
          profileData={modal.profileData}
        >
          <ModalCallProvider>
            {modal.content}
          </ModalCallProvider>
        </DockableModal>
      ))}
    </DockableModalContext.Provider>
  );
}
