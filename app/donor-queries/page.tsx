'use client';

import { TabsComponent } from "@/components/TabsComponent";
import { QueryHeader } from "../components/QueryHeader";
import { DockableModalProvider } from "@/components/providers/dockable-modal-provider";
import { CallManagerProvider } from "@/components/providers/CallManagerProvider";
import ProtectedRoute from "@/lib/auth/protected-route";

export default function DonorQueries() {
  return (
    <ProtectedRoute>
      <DockableModalProvider>
        <CallManagerProvider>
          <div className="w-full h-[calc(100vh-132px)] flex flex-col">
            <div className="flex-none">
              <QueryHeader />
            </div>
            <div className="flex-1 overflow-hidden">
              <TabsComponent />
            </div>
          </div>
        </CallManagerProvider>
      </DockableModalProvider>
    </ProtectedRoute>
  );
}
