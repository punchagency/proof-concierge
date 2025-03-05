"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneralQueries from "./GeneralQueries";
import TransferredQueries from "./TransferredQueries";
import ResolvedQueries from "./ResolvedQueries";
import { useEffect, useState } from "react";

export function TabsComponent() {
  const [activeTab, setActiveTab] = useState("general");

  // Load the active tab from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Save the active tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
  };

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={handleTabChange}
      className="w-full h-full flex flex-col"
    >
      <TabsList className="w-full flex flex-row gap-x-[10px] items-start justify-baseline bg-[#fff] h-[50px] border-t-[1px] rounded-none border-gray-200 shrink-0">
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
      <TabsContent value="general" className="w-full h-[calc(100%-50px)] overflow-hidden">
        <GeneralQueries />
      </TabsContent>
      <TabsContent value="transferred" className="w-full h-[calc(100%-50px)] overflow-hidden">
        <TransferredQueries />
      </TabsContent>
      <TabsContent value="resolved" className="w-full h-[calc(100%-50px)] overflow-hidden">
        <ResolvedQueries />
      </TabsContent>
    </Tabs>
  );
}
