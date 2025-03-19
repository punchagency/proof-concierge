"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useDockableModal } from "../providers/dockable-modal-provider";
import { QueryDetails } from "../QueryDetails";
import { TransferredQueriesProps } from "../TransferredQueries";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (rowData: TData) => void;
  disableRowClick?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  disableRowClick = false,
}: DataTableProps<TData, TValue>) {
  const { openModal } = useDockableModal();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (rowData: TData) => {
    if (disableRowClick) return;
    
    if (onRowClick) {
      onRowClick(rowData);
    } else {
      const queryData = rowData as unknown as TransferredQueriesProps;
      openModal(
        `query-${queryData.sid}`,
        <QueryDetails data={queryData} />,
        {
          name: queryData.donor,
          image: `/avatars/${queryData.donorId}.jpg`,
          status: "Transferred"
        }
      );
    }
  };

  return (
    <div className="w-full h-full border overflow-y-auto max-h-[calc(100vh-250px)]">
      <table className="w-full caption-bottom text-sm table-auto">
        <thead className="bg-[#009CF9] sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isActionsColumn = header.column.id === 'actions';
                return (
                  <th
                    key={header.id}
                    className="text-white font-semibold text-[16px] h-10 px-2 text-left align-middle whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ 
                      width: isActionsColumn ? '300px' : 'auto',
                      minWidth: isActionsColumn ? '300px' : 'auto'
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors ${!disableRowClick ? 'cursor-pointer' : ''}`}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => handleRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const isActionsColumn = cell.column.id === 'actions';
                  return (
                    <td
                      key={cell.id}
                      className="text-[14px] font-semibold text-[#2E3740] p-2 align-middle"
                      style={{ 
                        whiteSpace: isActionsColumn ? 'normal' : 'nowrap',
                        overflow: isActionsColumn ? 'visible' : 'hidden',
                        textOverflow: isActionsColumn ? 'clip' : 'ellipsis',
                        width: isActionsColumn ? '300px' : 'auto',
                        minWidth: isActionsColumn ? '300px' : 'auto'
                      }}
                    >
                      <div className={isActionsColumn ? '' : 'truncate'}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center">
                No results.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 