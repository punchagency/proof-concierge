// context-bridge.ts
// This file serves as a bridge between contexts to prevent circular dependencies

import React from 'react';

// A bridge for sharing context references without direct imports
// This helps break circular dependencies between components
interface ContextBridge {
  registerDockableModalContext: (
    openModal: (
      id: string,
      content: React.ReactNode,
      profileData: { name: string; image: string; status: string }
    ) => void,
    closeModal: (id: string) => void
  ) => void;
  
  getDockableModalContext: () => {
    openModal: (
      id: string,
      content: React.ReactNode,
      profileData: { name: string; image: string; status: string }
    ) => void;
    closeModal: (id: string) => void;
  } | undefined;
}

// Singleton object for sharing context references
const contextBridge: ContextBridge = {
  // Function to register the dockable modal context
  registerDockableModalContext: (openModal, closeModal) => {
    (contextBridge as any).__dockableModalContext = {
      openModal,
      closeModal
    };
  },
  
  // Function to get the dockable modal context
  getDockableModalContext: () => {
    return (contextBridge as any).__dockableModalContext;
  }
};

export default contextBridge; 