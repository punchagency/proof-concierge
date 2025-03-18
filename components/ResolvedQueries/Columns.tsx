"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ResolvedQueriesProps } from "../ResolvedQueries";
import { Button } from "../ui/button";
import Text from "@/icons/Text";
import VideoCall from "@/icons/VideoCall";
import Huddle from "@/icons/Huddle";

const QueryModeBadge = ({ mode }: { mode: string }) => {
  const badgeStyles = {
    Text: "bg-[#F0F9FF] text-[#007DC7] border-[#BAE6FD]",
    "Video Call": "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
    Huddle: "bg-[#FEF3C7] text-[#B45309]",
  }[mode] || "";

  const icons = {
    Text: <Text />,
    "Video Call": <VideoCall />,
    Huddle: <Huddle />,
  };

  return (
    <div
      className={`px-2 py-1 rounded-full text-[13px] font-semibold w-fit flex items-center gap-x-1 ${badgeStyles} opacity-60`}
    >
      {icons[mode as keyof typeof icons]}
      {mode}
    </div>
  );
};

const DeviceBadge = ({ device }: { device: string }) => {
  const getDeviceType = (device: string): string => {
    const lowerDevice = device.toLowerCase();
    if (
      lowerDevice.includes("macbook") ||
      lowerDevice.includes("iphone") ||
      lowerDevice.includes("ipad") ||
      lowerDevice.includes("mac")
    ) {
      return "Apple";
    }
    if (lowerDevice.includes("windows") || lowerDevice.includes("surface")) {
      return "Windows";
    }
    if (
      lowerDevice.includes("linux") ||
      lowerDevice.includes("ubuntu") ||
      lowerDevice.includes("fedora")
    ) {
      return "Linux";
    }
    if (
      lowerDevice.includes("android") ||
      lowerDevice.includes("samsung") ||
      lowerDevice.includes("pixel")
    ) {
      return "Android";
    }
    return "Unknown";
  };

  const icons = {
    Apple: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.7364 9.68309C19.6414 9.74165 17.552 10.9581 17.5758 13.4889C17.602 16.5159 20.2293 17.5239 20.2595 17.5353C20.236 17.6074 19.8395 18.9711 18.8746 20.3794C18.0407 21.5994 17.177 22.8126 15.8137 22.8379C14.4743 22.8624 14.0426 22.0432 12.5125 22.0432C10.9815 22.0432 10.5022 22.8126 9.23565 22.8624C7.91976 22.9122 6.91793 21.5449 6.07793 20.3316C4.36073 17.8484 3.0478 13.314 4.81076 10.254C5.68599 8.73423 7.25037 7.77143 8.94775 7.74656C10.2404 7.72213 11.4595 8.61557 12.2502 8.61557C13.0297 8.61557 14.4265 7.57406 16.0731 7.69587C16.7184 7.7437 18.5504 7.93631 19.7364 9.68309ZM15.0571 6.05666C15.7564 5.2115 16.2269 4.03448 16.0974 2.86377C15.0909 2.90368 13.8736 3.53419 13.1517 4.37881C12.5052 5.12701 11.9375 6.32534 12.0916 7.47215C13.2135 7.55884 14.3584 6.90234 15.0571 6.05666Z"
          fill="#1D1D1F"
        />
      </svg>
    ),
    Linux: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M13.7834 11.8638C13.4501 12.1971 12.9501 12.3638 12.4501 12.1971L10.7834 11.5305C10.2834 11.3638 9.78339 11.5305 9.45006 11.8638L8.78339 12.5305L8.11672 11.8638C7.78339 11.5305 7.28339 11.3638 6.78339 11.5305L5.11672 12.1971C4.61672 12.3638 4.11672 12.1971 3.78339 11.8638"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.11672 8.53044C5.78339 8.53044 5.45006 8.36377 5.28339 8.03044L4.61672 6.86377C4.45006 6.53044 4.45006 6.19711 4.61672 5.86377L5.95006 3.19711C6.11672 2.86377 6.45006 2.69711 6.78339 2.69711H10.7834C11.1167 2.69711 11.4501 2.86377 11.6167 3.19711L12.9501 5.86377C13.1167 6.19711 13.1167 6.53044 12.9501 6.86377L12.2834 8.03044C12.1167 8.36377 11.7834 8.53044 11.4501 8.53044"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.28339 8.03044L3.78339 11.8638"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.2834 8.03044L13.7834 11.8638"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.78339 8.53044V14.1971"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.28339" cy="4.86377" r="0.5" fill="currentColor" />
        <circle cx="10.2834" cy="4.86377" r="0.5" fill="currentColor" />
      </svg>
    ),
    Windows: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2.78339 4.86377L7.78339 4.19711V8.19711H2.78339V4.86377Z"
          stroke="#00ADEF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.78339 3.86377L14.7834 3.19711V8.19711H9.78339V3.86377Z"
          stroke="#00ADEF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.78339 10.1971H14.7834V15.1971L9.78339 14.5305V10.1971Z"
          stroke="#00ADEF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.78339 10.1971H7.78339V13.8638L2.78339 13.1971V10.1971Z"
          stroke="#00ADEF"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    Android: (
      <svg
        width="25"
        height="25"
        viewBox="0 0 25 25"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_9420_4551)">
          <path
            d="M17.6896 9.4668H7.54388C7.3182 9.4668 7.13525 9.64974 7.13525 9.87543V18.3835C7.13525 18.6091 7.3182 18.7921 7.54388 18.7921H9.35263V21.6593C9.35263 22.3246 9.89192 22.8639 10.5572 22.8639C11.2225 22.8639 11.7618 22.3246 11.7618 21.6593V18.7921H13.4466V21.6593C13.4466 22.3246 13.9859 22.8639 14.6512 22.8639C15.3165 22.8639 15.8558 22.3246 15.8558 21.6593V18.7921H17.6897C17.9154 18.7921 18.0983 18.6091 18.0983 18.3835V9.87543C18.0983 9.64974 17.9153 9.4668 17.6896 9.4668Z"
            fill="#AAC148"
          />
          <path
            d="M5.41748 9.4646C4.75223 9.4646 4.21289 10.0039 4.21289 10.6692V15.5618C4.21289 16.227 4.75218 16.7663 5.41748 16.7663C6.08273 16.7663 6.62207 16.2271 6.62207 15.5618V10.6692C6.62202 10.0039 6.08273 9.4646 5.41748 9.4646Z"
            fill="#AAC148"
          />
          <path
            d="M19.8159 9.4646C19.1507 9.4646 18.6113 10.0039 18.6113 10.6692V15.5618C18.6113 16.227 19.1506 16.7663 19.8159 16.7663C20.4812 16.7663 21.0205 16.2271 21.0205 15.5618V10.6692C21.0205 10.0039 20.4812 9.4646 19.8159 9.4646Z"
            fill="#AAC148"
          />
          <path
            d="M7.62585 8.86997H17.5834C17.8432 8.86997 18.0369 8.63068 17.9836 8.37643C17.6542 6.80659 16.6547 5.48364 15.2985 4.71939L16.1498 3.18348C16.2074 3.0795 16.1698 2.94845 16.0658 2.89084C15.9616 2.83309 15.8307 2.8708 15.7731 2.97479L14.9154 4.52226C14.213 4.19627 13.4301 4.0142 12.6046 4.0142C11.7791 4.0142 10.9963 4.19627 10.2938 4.52226L9.4361 2.97474C9.37844 2.8707 9.2474 2.83319 9.14346 2.8908C9.03947 2.9484 9.00191 3.07945 9.05952 3.18343L9.91076 4.71934C8.55455 5.48364 7.55507 6.80654 7.22569 8.37643C7.1723 8.63068 7.36603 8.86997 7.62585 8.86997ZM15.5759 6.581C15.5759 6.8367 15.3686 7.04404 15.1128 7.04404C14.8571 7.04404 14.6498 6.83675 14.6498 6.581C14.6498 6.3253 14.8571 6.11796 15.1128 6.11796C15.3686 6.11796 15.5759 6.3253 15.5759 6.581ZM10.0964 6.11796C10.3521 6.11796 10.5594 6.32525 10.5594 6.581C10.5594 6.8367 10.3521 7.04404 10.0964 7.04404C9.84066 7.04404 9.63332 6.83675 9.63332 6.581C9.63332 6.3253 9.84061 6.11796 10.0964 6.11796Z"
            fill="#AAC148"
          />
        </g>
        <defs>
          <clipPath id="clip0_9420_4551">
            <rect
              width="20"
              height="20"
              fill="white"
              transform="translate(2.6167 2.86377)"
            />
          </clipPath>
        </defs>
      </svg>
    ),
    Unknown: (
      <svg
        width="17"
        height="17"
        viewBox="0 0 17 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.78339 15.8638C12.6494 15.8638 15.7834 12.7298 15.7834 8.86377C15.7834 4.99777 12.6494 1.86377 8.78339 1.86377C4.91739 1.86377 1.78339 4.99777 1.78339 8.86377C1.78339 12.7298 4.91739 15.8638 8.78339 15.8638Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.78339 11.8638V8.86377"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.78339 5.86377H8.79006"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  };

  const deviceType = getDeviceType(device);

  return (
    <div className="flex items-center gap-x-2 text-[#4D5B6B] text-[13px] opacity-60">
      {icons[deviceType as keyof typeof icons]}
      {device}
    </div>
  );
};

const ActionCell = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="text-[#4D5B6B] border-[#C6CED6] border-[1px] font-semibold rounded-[8px] text-[13px]"
    >
      View History
    </Button>
  );
};

export const columns: ColumnDef<ResolvedQueriesProps>[] = [
  {
    accessorKey: "donor",
    header: "Donor",
    cell: ({ row }) => {
      return <div className="opacity-60">{row.getValue("donor")}</div>;
    },
  },
  {
    accessorKey: "donorId",
    header: "Donor ID",
    cell: ({ row }) => {
      return <div className="opacity-60">{row.getValue("donorId")}</div>;
    },
  },
  {
    accessorKey: "test",
    header: "Test",
    cell: ({ row }) => {
      return <div className="opacity-60">{row.getValue("test")}</div>;
    },
  },
  {
    accessorKey: "stage",
    header: "Stage",
    cell: ({ row }) => {
      return <div className="opacity-60">{row.getValue("stage")}</div>;
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
        <div className="opacity-60">
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
    accessorKey: "resolvedBy",
    header: "Resolved By",
    cell: ({ row }) => {
      return <div className="opacity-60">{row.getValue("resolvedBy")}</div>;
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: () => <ActionCell />,
    minSize: 300,
  },
]; 