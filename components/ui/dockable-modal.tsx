"use client";

import { X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import Profile from "@/icons/Profile";

export interface DockableModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  totalModals: number;
  children: React.ReactNode;
  profileData: {
    name: string;
    image: string;
    status: string;
  };
}

export function DockableModal({
  isOpen,
  onClose,
  position,
  children,
  profileData,
}: DockableModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  // Modal width and spacing
  const modalWidth = 373;
  const modalSpacing = 7.5;

  // Calculate position from right edge of screen
  // Higher position values will be further to the left
  const rightOffset = position * (modalWidth + modalSpacing);

  return (
    <div
      className={cn(
        "fixed bg-white shadow-lg transition-all duration-300 ease-in-out z-50 bottom-0 rounded-t-[12px]",
        "flex flex-col",
        isMinimized ? "h-[72px]" : "h-[696px]"
      )}
      style={{
        width: `${modalWidth}px`,
        right: `${rightOffset}px`,
        boxShadow: "0px 0px 15px 0px #2E374033",
      }}
    >
      <div className="flex items-center justify-between p-4 bg-[#2E3740] shrink-0 rounded-t-[12px] max-h-[72px]">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Profile/>
          </div>
          <div className="text-white">
            <p className="font-semibold text-sm">{profileData.name}</p>
            <p className="text-xs text-[#00FF85]">{profileData.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-[#404B56] rounded-full transition-colors"
          >
            <Minus className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#404B56] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
      <div
        className={cn(
          "flex-1 overflow-hidden p-4",
          isMinimized ? "hidden" : "block"
        )}
      >
        {children}
      </div>
    </div>
  );
}
