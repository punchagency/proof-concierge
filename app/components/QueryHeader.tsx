"use client";

import Search from "@/icons/Search";
import Filter from "@/icons/Filter";
import { FilterDropdown } from "./FilterDropdown";
import { useState, useEffect } from "react";
import { GeneralQuery } from "@/lib/api/donor-queries";
import { RefreshCcw } from "lucide-react";
import { useQueryRefresh } from "@/lib/hooks/use-query-refresh";

export function QueryHeader() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { triggerRefresh, refreshing } = useQueryRefresh();

  // Initialize the component after mount
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Function to handle filtered data and pass it to the appropriate component
  const handleFilteredData = (filteredData: GeneralQuery[]) => {
    // The FilterDropdown component now directly calls the handler functions
    // This function is kept for backward compatibility
    console.log("Filtered data received in QueryHeader:", filteredData.length);
  };

  const handleManualRefresh = () => {
    triggerRefresh();
  };

  return (
    <>
      <div className="flex flex-row justify-between items-center px-[24px]">
        <div className="py-[23px]">
          <h3 className="text-[18px] font-semibold">Donor Queries</h3>
          <p className="text-[16px] font-semibold">
            Filter and manage donor queries
          </p>
        </div>
        <div className="flex flex-row gap-x-2">
          <button 
            className="rounded-[12px] border-[1px] border-[#E3E6EB] h-[40px] w-[40px] flex justify-center items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <Search className="text-[#4D5B6B]" />
          </button>
          <button 
            className={`rounded-[12px] border-[1px] border-[#E3E6EB] h-[40px] w-[40px] flex justify-center items-center hover:bg-gray-50 active:bg-gray-100 transition-colors ${refreshing ? 'bg-blue-50' : ''}`}
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh data"
          >
            <RefreshCcw className={`h-5 w-5 text-[#4D5B6B] ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
          </button>
          <button 
            className="rounded-[12px] border-[1px] border-[#E3E6EB] h-[40px] w-[40px] flex justify-center items-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter />
          </button>
        </div>
      </div>

      {/* Always render the FilterDropdown component, but control visibility with isOpen prop */}
      {isInitialized && (
        <div data-component="filter-dropdown" id="filter-dropdown-container">
          <FilterDropdown isOpen={isFilterOpen} onApplyFilters={handleFilteredData} />
        </div>
      )}
    </>
  );
} 