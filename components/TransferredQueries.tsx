"use client";

import { useEffect, useState, useCallback } from "react";
import { columns } from "./TransferredQueries/Columns";
import { DataTable } from "./TransferredQueries/DataTable";
import { fetchTransferredQueries, TransferredQuery, FilterParams } from "@/lib/api/donor-queries";
import { CustomWindow } from "@/lib/types/window";

export type TransferredQueriesProps = TransferredQuery;

export default function TransferredQueries() {
  const [data, setData] = useState<TransferredQueriesProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<FilterParams | undefined>(undefined);

  const fetchData = async (filters?: FilterParams) => {
    setLoading(true);
    try {
      // Save filters to window for background refresh
      (window as CustomWindow).__currentTransferredFilters = filters;
      
      const queries = await fetchTransferredQueries(filters);
      setData(queries || []);
      setIsFiltered(!!filters && Object.values(filters).some(value => !!value));
      setCurrentFilters(filters);
    } catch (error) {
      console.error("Error fetching transferred queries:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to handle filtered data from FilterDropdown
  const handleFilteredData = useCallback((filteredData: TransferredQueriesProps[]) => {
    console.log("TransferredQueries received filtered data:", filteredData?.length);
    setData(filteredData || []);
    
    // Check if any filters are applied
    if (currentFilters && Object.values(currentFilters).some(val => !!val)) {
      setIsFiltered(true);
    } else {
      setIsFiltered(false);
    }
  }, [currentFilters]);

  // Register the handler function on the window object when component mounts
  useEffect(() => {
    const handler = (filteredData: TransferredQueriesProps[]) => {
      console.log("Window handler called with filtered data:", filteredData?.length);
      handleFilteredData(filteredData);
    };
    
    // Set the handler on the window object
    (window as CustomWindow).handleFilteredTransferredQueries = handler;
    
    // Clean up on unmount
    return () => {
      delete (window as CustomWindow).handleFilteredTransferredQueries;
    };
  }, [handleFilteredData]);

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