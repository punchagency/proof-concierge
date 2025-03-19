"use client";

import { columns } from "./Columns";
import { DataTable } from "../ui/data-table";
import { DonorQuery } from "@/lib/api/donor-queries";

export interface GeneralQueriesProps extends DonorQuery {
  dateNdTime: string;
}

interface GeneralQueriesComponentProps {
  data: GeneralQueriesProps[];
}

export default function GeneralQueries({ data }: GeneralQueriesComponentProps) {
  // Transform the data to match the DataTable's required shape
  const transformedData = data.map(item => ({
    ...item,
    id: String(item.id) // Convert id from number to string
  }));

  return (
    <div className="w-full">
      <DataTable 
        columns={columns} 
        data={transformedData} 
        onRowClick={() => {
          // The row click is handled by the DataTable component
        }}
      />
    </div>
  );
} 