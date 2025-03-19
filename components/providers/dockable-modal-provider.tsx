"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { DockableModal } from "../ui/dockable-modal";
import { CallManagerProvider } from "./CallManagerProvider";
import { QueryDetails } from "../QueryDetails";
import { DockableQueryModal } from "../GeneralQueries/DockableQueryModal";
import { GeneralQuery } from "@/lib/api/donor-queries";
import { callStateAtom, endCallAtom } from "@/lib/atoms/callState";
import { useAtom } from "jotai";
import { endCall as endCallApi, updateQueryMode } from "@/lib/api/communication";

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

const DockableModalContext = createContext<
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

export function DockableModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modals, setModals] = useState<Modal[]>([]);
  const [maxModals, setMaxModals] = useState(5);
  const [callState] = useAtom(callStateAtom);
  const [, endCall] = useAtom(endCallAtom);

  // Restore modals from localStorage on mount
  useEffect(() => {
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
  }, []);

  // Save modals to localStorage whenever they change
  useEffect(() => {
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
  }, [modals]);

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

  const closeModal = useCallback(async (id: string) => {
    // Check if call state is active
    if (callState.isActive && callState.roomName) {
      try {
        console.log("Ending call due to modal closing");
        
        // First, if there's a Daily instance, use it to ensure proper cleanup
        try {
          // Find all Daily.co iframes and attempt to access their daily instance
          document.querySelectorAll('iframe').forEach(iframe => {
            try {
              // Check if this is a Daily iframe
              if (iframe.src && iframe.src.includes('daily')) {
                const dailyInstance = (iframe as any).daily;
                if (dailyInstance && typeof dailyInstance.leave === 'function') {
                  // Leave call properly before destroying
                  dailyInstance.leave();
                  dailyInstance.destroy();
                  console.log("Successfully left and destroyed Daily call");
                }
              }
            } catch (e) {
              console.error("Error accessing Daily instance:", e);
            }
          });
        } catch (e) {
          console.error("Error cleaning up Daily instance:", e);
        }
        
        // End the call on the backend
        await endCallApi(callState.roomName);
        
        // Reset call state via Jotai atom
        endCall();
        
        // More aggressive approach to stop all media tracks
        try {
          // Method 1: Get all media streams from elements and stop tracks
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

          // Method 2: Find all iframes that could contain Daily.co and remove them
          document.querySelectorAll('iframe').forEach(iframe => {
            if (iframe.src && (iframe.src.includes('daily') || iframe.hasAttribute('data-daily-iframe'))) {
              console.log(`Removing Daily iframe: ${iframe.src}`);
              iframe.remove();
            }
          });

          // Method 3: Find and stop any active media tracks globally
          if (navigator && navigator.mediaDevices) {
            // Get current active tracks from getUserMedia
            navigator.mediaDevices.getUserMedia({ audio: true, video: true })
              .then(stream => {
                stream.getTracks().forEach(track => {
                  track.stop();
                  console.log(`Stopped media track: ${track.kind}`);
                });
              })
              .catch(err => console.log('No media streams to stop'));
            
            // Also check for any enumerateDevices change to reset permissions
            navigator.mediaDevices.enumerateDevices()
              .then(() => console.log("Media device enumeration complete"))
              .catch(err => console.log("Media device enumeration error", err));
          }

          console.log("Successfully released all camera and microphone resources");
        } catch (mediaError) {
          console.error("Error stopping media tracks:", mediaError);
        }
        
        // If the query has an ID, update its mode back to Text
        if (callState.queryId) {
          await updateQueryMode(callState.queryId, "Text");
        }
      } catch (error) {
        console.error("Error ending call when closing modal:", error);
      }
    }
    
    // Remove the modal
    setModals((prev) => prev.filter((modal) => modal.id !== id));
  }, [callState.isActive, callState.roomName, callState.queryId, endCall]);

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
          <CallManagerProvider>
            {modal.content}
          </CallManagerProvider>
        </DockableModal>
      ))}
    </DockableModalContext.Provider>
  );
}
