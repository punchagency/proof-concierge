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

  return (
    <div className="w-full">
      <DataTable 
        columns={columns} 
        data={data} 
        onRowClick={(rowData) => {
          // The row click is handled by the DataTable component
        }}
      />
    </div>
  );
} 