import { GeneralQueriesProps } from "./GeneralQueries";
import { QueryModeBadge } from "./GeneralQueries/Columns";
import { QueryModeVisual } from "./QueryModeVisual";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ChatTab } from "./chat/ChatTab";
import { toast } from "sonner";
import { acceptQuery } from "@/lib/api/donor-queries";
import CallRequestContainer from "./CallRequestContainer";

export function QueryDetails({ data }: { data: GeneralQueriesProps }) {
  const [activeTab, setActiveTab] = useState("details");
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAcceptQuery = async () => {
    if (!data.id) {
      toast.error("Query ID is missing");
      return;
    }
    
    setIsAccepting(true);
    try {
      const success = await acceptQuery(data.id);
      if (success) {
        // Switch to the chat tab when accepting the query
        setActiveTab("chat");
        toast.success(`Query from ${data.donor} accepted`);
      } else {
        toast.error("Failed to accept query");
      }
    } catch (error) {
      console.error("Error accepting query:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full h-full flex flex-col"
      >
        <TabsList className="w-full flex flex-row gap-x-[10px] items-start justify-baseline bg-[#fff] h-[50px] border-b-[1px] rounded-none border-gray-200 shrink-0 mb-4">
          <TabsTrigger
            value="details"
            className="w-[100px] py-[15px] px-[16px] border-0 data-[state=active]:text-[#2E3740] text-[14px] font-semibold data-[state=inactive]:text-[#8D9CAD] data-[state=active]:shadow-none"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="w-[100px] py-[15px] px-[16px] border-0 data-[state=active]:text-[#2E3740] text-[14px] font-semibold data-[state=inactive]:text-[#8D9CAD] data-[state=active]:shadow-none"
          >
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 flex flex-col gap-y-2 mt-0">
          {/* Call Request Container */}
          {data.id && (
            <div className="mb-4">
              <CallRequestContainer queryId={data.id} />
            </div>
          )}

          <div>
            <label className="text-[12px] text-gray-500">Session ID</label>
            <p className="font-semibold text-[14px]">SID_{data.sid}</p>
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
          <div className="flex flex-col gap-y-[8px]">
            <div className="flex flex-row items-center gap-x-2">
              <label className="text-[12px] text-gray-500">Query Mode</label>
              <QueryModeBadge mode={data.queryMode} />
            </div>
            <div className="w-full h-[170px] rounded-md border-[1px] border-[#AAB5C2] overflow-hidden">
              {(data.queryMode === "Huddle" || data.queryMode === "Video Call") && (
                <QueryModeVisual
                  mode={data.queryMode}
                  profileData={{
                    name: data.donor,
                    image: `/images/${data.donorId}.jpg`,
                    status: "Available"
                  }}
                  userId={parseInt(data.donorId)}
                  queryId={data.id || parseInt(data.sid)}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-4 mt-auto">
            <button
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              onClick={() => console.log("Transfer clicked", data.sid)}
            >
              Transfer
            </button>
            <button
              className="flex-1 py-2 px-4 bg-[#009CF9] text-white rounded-md font-medium hover:bg-[#0084d6] transition-colors"
              onClick={handleAcceptQuery}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Accepting...
                </span>
              ) : (
                "Accept"
              )}
            </button>
          </div>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 h-full mt-0">
          <ChatTab 
            donorQuery={{
              id: data.id || parseInt(data.sid),
              sid: data.sid,
              donor: data.donor,
              donorId: data.donorId
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 