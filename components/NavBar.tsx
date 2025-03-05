"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Menu 1", path: "/menu1" },
    { label: "Menu 2", path: "/menu2" },
    { label: "Donor Queries", path: "/donor-queries" },
    { label: "Test Audio Call", path: "/test-audio-call" },
  ];

  return (
    <div className="bg-[#F2FAFF] h-[44px] flex flex-row gap-x-[24px]">
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`py-[13px] px-[16px] flex items-center justify-center ${
            pathname === item.path ? "border-b-2 border-[#009CF9]" : ""
          }`}
        >
          <p
            className={`text-[14px] font-semibold ${
              pathname === item.path ? "text-[#009CF9]" : ""
            }`}
          >
            {item.label}
          </p>
        </Link>
      ))}
    </div>
  );
}
