import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralQueries from "./GeneralQueries";

export function TabsComponent() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="w-full flex flex-row gap-x-[10px] items-start justify-baseline bg-[#fff] h-[50px] border-t-[1px] rounded-none border-gray-200">
        <TabsTrigger
          value="general"
          className="w-[142px] py-[15px] px-[16px] border-0 data-[state=active]:text-[#2E3740] text-[14px] font-semibold data-[state=inactive]:text-[#8D9CAD] data-[state=active]:shadow-none"
        >
          General Queries
        </TabsTrigger>
        <TabsTrigger
          value="transferred"
          className="w-[142px] py-[15px] px-[16px] border-0 data-[state=active]:text-[#2E3740] text-[14px] font-semibold data-[state=inactive]:text-[#8D9CAD] data-[state=active]:shadow-none"
        >
          Transferred
        </TabsTrigger>
        <TabsTrigger
          value="resolved"
          className="w-[142px] py-[15px] px-[16px] border-0 data-[state=active]:text-[#2E3740] text-[14px] font-semibold data-[state=inactive]:text-[#8D9CAD] data-[state=active]:shadow-none"
        >
          Resolved
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="w-full">
        <GeneralQueries />
      </TabsContent>
      <TabsContent value="transferred">
        <h1>Transferred</h1>
      </TabsContent>
      <TabsContent value="resolved">
        <h1>Resolved</h1>
      </TabsContent>
    </Tabs>
  );
}
