"use client";

import { useEffect, useState, useCallback } from "react";
import { columns } from "./GeneralQueries/Columns";
import { DataTable } from "./GeneralQueries/DataTable";
import { fetchGeneralQueries, GeneralQuery, FilterParams } from "@/lib/api/donor-queries";

export type GeneralQueriesProps = GeneralQuery;

// Define proper types for the window interface
interface CustomWindow extends Window {
  handleFilteredGeneralQueries?: (filteredData: GeneralQueriesProps[]) => void;
}

export default function GeneralQueries() {
  const [data, setData] = useState<GeneralQueriesProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterParams | undefined>(undefined);

  const fetchData = async (filters?: FilterParams) => {
    setLoading(true);
    try {
      const queries = await fetchGeneralQueries(filters);
      setData(queries || []);
      setIsFiltered(!!filters && Object.values(filters).some(value => !!value));
      setCurrentFilters(filters);
    } catch (error) {
      console.error("Error fetching general queries:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle filtered data from FilterDropdown
  const handleFilteredData = useCallback((filteredData: GeneralQueriesProps[]) => {
    console.log("GeneralQueries received filtered data:", filteredData?.length);
    setData(filteredData || []);
    // Check if any filters are applied
    const hasActiveFilters = filteredData.length !== data.length || 
      (currentFilters && Object.values(currentFilters).some(value => !!value));
    console.log("Setting isFiltered to:", hasActiveFilters);
    setIsFiltered(hasActiveFilters || false);
  }, [data.length, currentFilters]);

  // Register the handler function on the window object immediately when component mounts
  // and ensure it's always up to date with the latest state
  useEffect(() => {
    console.log("Setting handleFilteredGeneralQueries on window");
    
    // Define the handler function that will be called by FilterDropdown
    (window as CustomWindow).handleFilteredGeneralQueries = (filteredData: GeneralQueriesProps[]) => {
      console.log("Window handler called with filtered data:", filteredData?.length);
      console.log("Current data length before update:", data.length);
      console.log("Sample filtered data:", filteredData?.slice(0, 2));
      handleFilteredData(filteredData);
    };

    return () => {
      // Clean up
      console.log("Cleaning up handleFilteredGeneralQueries");
      delete (window as CustomWindow).handleFilteredGeneralQueries;
    };
  }, [data, currentFilters, handleFilteredData]); // Include all dependencies

  return (
    <div className="h-full w-full">
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <>
          {isFiltered && (
            <div className="p-2 bg-blue-50 text-blue-700 text-sm flex justify-between items-center">
              <span>Showing filtered results</span>
              <button 
                onClick={() => fetchData()}
                className="text-blue-700 hover:text-blue-900 underline text-xs"
              >
                Clear filters
              </button>
            </div>
          )}
          <DataTable columns={columns} data={data} />
        </>
      )}
    </div>
  );
}
