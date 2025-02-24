"use client";

import { ColumnDef } from "@tanstack/react-table";
import { GeneralQueriesProps } from "../GeneralQueries";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const QueryModeBadge = ({ mode }: { mode: string }) => {
  const badgeStyles =
    {
      Text: "bg-[#F2FAFF] text-[#007DC7]",
      Huddle: "bg-[#FEF3C7] text-[#B45309]",
      "Video Call": "bg-[#FEE2E2] text-[#991B1B]",
    }[mode] || "bg-[#E5F5FF] text-[#009CF9]";

  const icons = {
    Text: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M12.1167 14.8638H4.1167C3.01203 14.8638 2.1167 13.9684 2.1167 12.8638V4.86377C2.1167 3.7591 3.01203 2.86377 4.1167 2.86377H12.1167C13.2214 2.86377 14.1167 3.7591 14.1167 4.86377V12.8638C14.1167 13.9684 13.2214 14.8638 12.1167 14.8638Z" stroke="#007DC7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.94995 11.1971H9.28328" stroke="#007DC7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.11678 6.53052V11.1972" stroke="#007DC7" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.4501 7.58652V6.78985C10.4501 6.64652 10.3341 6.53052 10.1908 6.53052H6.04278C5.89945 6.53052 5.78345 6.64652 5.78345 6.78985V7.58718" stroke="#007DC7" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Huddle: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M7.35397 9.62651C6.57397 8.84651 5.98597 7.97318 5.5953 7.08718C5.51263 6.89985 5.5613 6.68051 5.70597 6.53585L6.25197 5.99051C6.6993 5.54318 6.6993 4.91051 6.30863 4.51985L5.52597 3.73718C5.0053 3.21651 4.1613 3.21651 3.64063 3.73718L3.20597 4.17185C2.71197 4.66585 2.50597 5.37851 2.6393 6.08518C2.96863 7.82718 3.98063 9.73451 5.6133 11.3672C7.24597 12.9998 9.1533 14.0118 10.8953 14.3412C11.602 14.4745 12.3146 14.2685 12.8086 13.7745L13.2426 13.3405C13.7633 12.8198 13.7633 11.9758 13.2426 11.4552L12.4606 10.6732C12.07 10.2825 11.4366 10.2825 11.0466 10.6732L10.4446 11.2758C10.3 11.4205 10.0806 11.4692 9.8933 11.3865C9.0073 10.9952 8.13397 10.4065 7.35397 9.62651Z" stroke="#B45309" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    "Video Call": (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.7834 7.72552L13.1003 6.29742C13.3059 6.17062 13.5641 6.16503 13.7751 6.28281C13.9861 6.40059 14.1168 6.6233 14.1168 6.86492V11.5295C14.1168 11.7711 13.9861 11.9938 13.7751 12.1116C13.5641 12.2293 13.306 12.2238 13.1003 12.097L10.7834 10.6688" stroke="#991B1B" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2.1167" y="4.86377" width="8.66667" height="8.66667" rx="2" stroke="#991B1B" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <div
      className={cn(
        "px-2 py-1 rounded-full text-[13px] font-semibold w-fit flex items-center gap-x-1",
        badgeStyles
      )}
    >
      {icons[mode as keyof typeof icons]}
      {mode}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const badgeStyles =
    {
      "In Progress": "bg-[#ECFDF5] text-[#10B981] border-[#A7F3D0]",
      "Awaiting Response": "bg-[#FFFBEB] text-[#F59E0B] border-[#FDE68A]",
      Resolved: "bg-[#E5FFE9] text-[#00B724] border-[#A3E635]",
    }[status] || "bg-[#E5F5FF] text-[#009CF9]";

  return (
    <div
      className={cn(
        "px-2 py-1 text-[13px] font-semibold w-fit border-[1px] rounded-full",
        badgeStyles
      )}
    >
      {status}
    </div>
  );
};

const DeviceBadge = ({ device }: { device: string }) => {
  const getDeviceType = (device: string): string => {
    const lowerDevice = device.toLowerCase();
    if (lowerDevice.includes('macbook') || lowerDevice.includes('iphone') || lowerDevice.includes('ipad') || lowerDevice.includes('mac')) {
      return 'Apple';
    }
    if (lowerDevice.includes('windows') || lowerDevice.includes('surface')) {
      return 'Windows';
    }
    if (lowerDevice.includes('linux') || lowerDevice.includes('ubuntu') || lowerDevice.includes('fedora')) {
      return 'Linux';
    }
    if (lowerDevice.includes('android') || lowerDevice.includes('samsung') || lowerDevice.includes('pixel')) {
      return 'Android';
    }
    return 'Unknown';
  };

  const icons = {
    Apple: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.7834 13.8638C12.2834 14.8638 11.7834 15.8638 10.7834 15.8638C9.78339 15.8638 9.28339 15.1971 8.11672 15.1971C6.95006 15.1971 6.45006 15.8638 5.45006 15.8638C4.45006 15.8638 3.95006 14.8638 3.45006 13.8638C2.45006 11.8638 2.28339 9.19711 3.28339 7.86377C3.95006 6.86377 4.95006 6.36377 6.11672 6.36377C7.28339 6.36377 7.95006 7.03044 8.95006 7.03044C9.95006 7.03044 10.4501 6.36377 11.7834 6.36377C12.7834 6.36377 13.7834 6.86377 14.4501 7.69711C11.7834 9.03044 12.2834 12.8638 14.7834 13.5305C14.4501 14.0305 13.7834 14.8638 12.7834 13.8638Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10.7834 2.86377C11.1167 3.53044 11.2834 4.19711 11.1167 5.03044C10.2834 5.03044 9.61672 4.53044 9.11672 3.86377C8.61672 3.19711 8.45006 2.53044 8.61672 1.86377C9.45006 1.86377 10.2834 2.19711 10.7834 2.86377Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Linux: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.7834 11.8638C13.4501 12.1971 12.9501 12.3638 12.4501 12.1971L10.7834 11.5305C10.2834 11.3638 9.78339 11.5305 9.45006 11.8638L8.78339 12.5305L8.11672 11.8638C7.78339 11.5305 7.28339 11.3638 6.78339 11.5305L5.11672 12.1971C4.61672 12.3638 4.11672 12.1971 3.78339 11.8638" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6.11672 8.53044C5.78339 8.53044 5.45006 8.36377 5.28339 8.03044L4.61672 6.86377C4.45006 6.53044 4.45006 6.19711 4.61672 5.86377L5.95006 3.19711C6.11672 2.86377 6.45006 2.69711 6.78339 2.69711H10.7834C11.1167 2.69711 11.4501 2.86377 11.6167 3.19711L12.9501 5.86377C13.1167 6.19711 13.1167 6.53044 12.9501 6.86377L12.2834 8.03044C12.1167 8.36377 11.7834 8.53044 11.4501 8.53044" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.28339 8.03044L3.78339 11.8638" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12.2834 8.03044L13.7834 11.8638" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.78339 8.53044V14.1971" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="7.28339" cy="4.86377" r="0.5" fill="currentColor"/>
        <circle cx="10.2834" cy="4.86377" r="0.5" fill="currentColor"/>
      </svg>
    ),
    Windows: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.78339 4.86377L7.78339 4.19711V8.19711H2.78339V4.86377Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.78339 3.86377L14.7834 3.19711V8.19711H9.78339V3.86377Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.78339 10.1971H14.7834V15.1971L9.78339 14.5305V10.1971Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2.78339 10.1971H7.78339V13.8638L2.78339 13.1971V10.1971Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Android: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.78339 6.86377V11.1971" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13.7834 6.86377V11.1971" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M5.78339 13.1971V14.1971C5.78339 14.7494 6.23111 15.1971 6.78339 15.1971H7.78339" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M11.7834 13.1971V14.1971C11.7834 14.7494 11.3357 15.1971 10.7834 15.1971H9.78339" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4.78339 6.86377H12.7834C13.3357 6.86377 13.7834 7.31148 13.7834 7.86377V11.1971C13.7834 11.7494 13.3357 12.1971 12.7834 12.1971H4.78339C4.23111 12.1971 3.78339 11.7494 3.78339 11.1971V7.86377C3.78339 7.31148 4.23111 6.86377 4.78339 6.86377Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.78339 2.86377L10.2834 4.86377H7.28339L8.78339 2.86377Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Unknown: (
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.78339 15.8638C12.6494 15.8638 15.7834 12.7298 15.7834 8.86377C15.7834 4.99777 12.6494 1.86377 8.78339 1.86377C4.91739 1.86377 1.78339 4.99777 1.78339 8.86377C1.78339 12.7298 4.91739 15.8638 8.78339 15.8638Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.78339 11.8638V8.86377" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M8.78339 5.86377H8.79006" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  const deviceType = getDeviceType(device);

  return (
    <div className="flex items-center gap-x-2 text-[#4D5B6B] text-[13px]">
      {icons[deviceType as keyof typeof icons]}
      {device}
    </div>
  );
};

const ActionCell = () => {
  return (
    <div className="flex gap-x-2">
      <Button
        variant="outline"
        size="sm"
        className="text-[#4D5B6B] border-[#C6CED6] border-[1px] font-semibold rounded-[8px] text-[13px]"
      >
        Transfer
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-[#4D5B6B] border-[#C6CED6] border-[1px] font-semibold rounded-[8px] text-[13px]"
      >
        Resolve
      </Button>
    </div>
  );
};

export const columns: ColumnDef<GeneralQueriesProps>[] = [
  {
    accessorKey: "sid",
    header: "SID",
    cell: ({ row }) => {
      return <div>SID_{row.getValue("sid")}</div>;
    },
  },
  {
    accessorKey: "donor",
    header: "Donor",
  },
  {
    accessorKey: "donorId",
    header: "Donor ID",
  },
  {
    accessorKey: "test",
    header: "Test",
  },
  {
    accessorKey: "stage",
    header: "Stage",
  },
  {
    accessorKey: "queryMode",
    header: "Query Mode",
    cell: ({ row }) => {
      return <QueryModeBadge mode={row.getValue("queryMode")} />;
    },
  },
  {
    accessorKey: "device",
    header: "Device",
    cell: ({ row }) => {
      return <DeviceBadge device={row.getValue("device")} />;
    },
  },
  {
    accessorKey: "dateNdTime",
    header: "Date & Time",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dateNdTime"));
      return (
        <div>
          {date.toLocaleString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.getValue("status")} />;
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: () => <ActionCell />,
  },
];
