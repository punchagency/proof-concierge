"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { createPortal } from "react-dom";
import {
  FilterParams,
  QueryMode,
  QueryStatus,
  fetchGeneralQueries,
  fetchTransferredQueries,
  fetchResolvedQueries,
  GeneralQuery,
  TransferredQuery,
  ResolvedQuery,
} from "@/lib/api/donor-queries";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}

function CustomSelect({
  options,
  placeholder,
  value,
  onChange,
  onClear,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    // Only set the portal container when the component mounts in the browser
    setPortalContainer(document.body);
  }, []);

  const getDropdownPosition = () => {
    if (!buttonRef.current) return { top: 0, left: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4, // 4px of spacing
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  const position = getDropdownPosition();

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-[140px] rounded-[8px] border-[#C6CED6] border-[1px] px-3 py-1.5 text-[13px] font-semibold text-[#4D5B6B] bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-between"
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {value && onClear && (
          <button
            onClick={onClear}
            className="ml-1 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {isOpen &&
        portalContainer &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[99998]"
              onClick={() => setIsOpen(false)}
            />

            <div
              className={`fixed z-[999999] bg-white border border-[#C6CED6] rounded-[8px] py-1 shadow-lg ${
                isOpen ? "animate-bounce-in" : ""
              }`}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                width: `${position.width}px`,
              }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[13px] font-semibold hover:bg-gray-50 ${
                    value === option.value
                      ? "text-[#4D5B6B] bg-gray-50"
                      : "text-gray-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>,
          portalContainer
        )}
    </div>
  );
}

interface FilterDropdownProps {
  isOpen: boolean;
  onApplyFilters?: (
    filteredData: (GeneralQuery | TransferredQuery | ResolvedQuery)[]
  ) => void;
}

export function FilterDropdown({
  isOpen,
  onApplyFilters,
}: FilterDropdownProps) {
  // Always initialize state, even if not visible
  const [test, setTest] = useState("");
  const [stage, setStage] = useState("");
  const [mode, setMode] = useState("");
  const [device, setDevice] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("general"); // Default to general tab

  // Dynamic options that will be populated from actual data
  const [testOptions, setTestOptions] = useState<Option[]>([]);
  const [stageOptions, setStageOptions] = useState<Option[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<Option[]>([]);

  // Query mode options - these match the QueryMode enum
  const modeOptions = [
    { value: "Text", label: "Text" },
    { value: "Huddle", label: "Huddle" },
    { value: "Video Call", label: "Video Call" },
  ];

  // Status options - these match the QueryStatus enum
  const generalStatusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Pending Reply", label: "Pending Reply" },
  ];

  // Full status options for other tabs
  const allStatusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "Pending Reply", label: "Pending Reply" },
    { value: "Resolved", label: "Resolved" },
    { value: "Transferred", label: "Transferred" },
  ];

  // Get the appropriate status options based on the active tab
  const statusOptions =
    activeTab === "general" ? generalStatusOptions : allStatusOptions;

  // Load active tab from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("activeTab");
      if (savedTab) {
        setActiveTab(savedTab);
      }

      // Set up a mutation observer to detect tab changes
      const tabsContainer = document.querySelector('[role="tablist"]');
      if (tabsContainer) {
        const observer = new MutationObserver(() => {
          const activeTabElement = document.querySelector(
            '[data-state="active"][role="tab"]'
          );
          if (activeTabElement) {
            const tabValue = activeTabElement.getAttribute("data-value");
            if (tabValue && tabValue !== activeTab) {
              setActiveTab(tabValue);
              localStorage.setItem("activeTab", tabValue);
            }
          }
        });

        observer.observe(tabsContainer, {
          attributes: true,
          childList: true,
          subtree: true,
        });

        return () => observer.disconnect();
      }
    }
  }, [activeTab]);

  // Fetch all data to extract unique values for filter options
  useEffect(() => {
    if (!isOpen) return; // Only fetch when dropdown is open

    async function fetchFilterOptions() {
      try {
        // Fetch data from all endpoints to extract unique values
        const [generalData, transferredData, resolvedData] = await Promise.all([
          fetchGeneralQueries(),
          fetchTransferredQueries(),
          fetchResolvedQueries(),
        ]);

        // Combine all data
        const allData = [...generalData, ...transferredData, ...resolvedData];

        // If no data is returned from the API, use mock data for testing
        if (allData.length === 0) {
          // Mock test options
          const mockTestOptions = [
            { value: "Proof of Address", label: "Proof of Address" },
            { value: "Proof of Identity", label: "Proof of Identity" },
            { value: "Proof of Income", label: "Proof of Income" },
          ];
          setTestOptions(mockTestOptions);

          // Mock stage options
          const mockStageOptions = [
            { value: "Document Upload", label: "Document Upload" },
            { value: "Document Verification", label: "Document Verification" },
            { value: "Identity Verification", label: "Identity Verification" },
          ];
          setStageOptions(mockStageOptions);

          // Mock device options
          const mockDeviceOptions = [
            { value: "Mobile", label: "Mobile" },
            { value: "Desktop", label: "Desktop" },
            { value: "Tablet", label: "Tablet" },
          ];
          setDeviceOptions(mockDeviceOptions);

          return;
        }

        // Extract unique test types
        const uniqueTests = [
          ...new Set(allData.map((item) => item.test)),
        ].filter(Boolean);
        setTestOptions(
          uniqueTests.map((test) => ({ value: test, label: test }))
        );

        // Extract unique stages
        const uniqueStages = [
          ...new Set(allData.map((item) => item.stage)),
        ].filter(Boolean);
        setStageOptions(
          uniqueStages.map((stage) => ({ value: stage, label: stage }))
        );

        // Extract unique devices
        const uniqueDevices = [
          ...new Set(allData.map((item) => item.device)),
        ].filter(Boolean);
        setDeviceOptions(
          uniqueDevices.map((device) => ({ value: device, label: device }))
        );
      } catch (error) {
        console.error("Error fetching filter options:", error);

        // Mock test options
        const mockTestOptions = [
          { value: "Proof of Address", label: "Proof of Address" },
          { value: "Proof of Identity", label: "Proof of Identity" },
          { value: "Proof of Income", label: "Proof of Income" },
        ];
        setTestOptions(mockTestOptions);

        // Mock stage options
        const mockStageOptions = [
          { value: "Document Upload", label: "Document Upload" },
          { value: "Document Verification", label: "Document Verification" },
          { value: "Identity Verification", label: "Identity Verification" },
        ];
        setStageOptions(mockStageOptions);

        // Mock device options
        const mockDeviceOptions = [
          { value: "Mobile", label: "Mobile" },
          { value: "Desktop", label: "Desktop" },
          { value: "Tablet", label: "Tablet" },
        ];
        setDeviceOptions(mockDeviceOptions);
      }
    }

    fetchFilterOptions();
  }, [isOpen]);

  // Define applyFilters with useCallback to avoid dependency issues
  const applyFilters = useCallback(async () => {
    try {
      // Create a filters object with all the filter values
      const filters: FilterParams = {
        test: test || undefined,
        stage: stage || undefined,
        queryMode: (mode as QueryMode) || undefined,
        device: device || undefined,
        status: (status as QueryStatus) || undefined,
        date: date || undefined,
      };

      // Fetch data based on the active tab
      if (activeTab === "general") {
        // Remove status from filters for general queries
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status: statusValue, ...generalFilters } = filters;
        const filteredData = await fetchGeneralQueries(generalFilters);

        // Add a small delay to ensure the handler is registered
        setTimeout(() => {
          // Directly call the handler function on the window object
          if (typeof window !== "undefined") {
            const windowWithHandlers = window as {
              handleFilteredGeneralQueries?: (data: GeneralQuery[]) => void;
            };
            if (
              typeof windowWithHandlers.handleFilteredGeneralQueries ===
              "function"
            ) {
              windowWithHandlers.handleFilteredGeneralQueries(filteredData);
            } else {
              console.error(
                "handleFilteredGeneralQueries not found or not a function"
              );

              window.location.reload();
            }
          }
        }, 100);

        // Pass filtered data to parent component if needed
        if (onApplyFilters) {
          onApplyFilters(filteredData);
        }
      } else if (activeTab === "transferred") {
        const filteredData = await fetchTransferredQueries(filters);

        // Add a small delay to ensure the handler is registered
        setTimeout(() => {
          // Directly call the handler function on the window object
          if (typeof window !== "undefined") {
            const windowWithHandlers = window as {
              handleFilteredTransferredQueries?: (
                data: TransferredQuery[]
              ) => void;
            };
            if (
              typeof windowWithHandlers.handleFilteredTransferredQueries ===
              "function"
            ) {
              windowWithHandlers.handleFilteredTransferredQueries(filteredData);
            } else {
              console.error(
                "handleFilteredTransferredQueries not found or not a function"
              );
              window.location.reload();
            }
          }
        }, 100);

        // Pass filtered data to parent component if needed
        if (onApplyFilters) {
          onApplyFilters(filteredData);
        }
      } else if (activeTab === "resolved") {
        const filteredData = await fetchResolvedQueries(filters);
        // Add a small delay to ensure the handler is registered
        setTimeout(() => {
          // Directly call the handler function on the window object
          if (typeof window !== "undefined") {
            const windowWithHandlers = window as {
              handleFilteredResolvedQueries?: (data: ResolvedQuery[]) => void;
            };
            if (
              typeof windowWithHandlers.handleFilteredResolvedQueries ===
              "function"
            ) {
              windowWithHandlers.handleFilteredResolvedQueries(filteredData);
            } else {
              console.error(
                "handleFilteredResolvedQueries not found or not a function"
              );
              window.location.reload();
            }
          }
        }, 100);

        // Pass filtered data to parent component if needed
        if (onApplyFilters) {
          onApplyFilters(filteredData);
        }
      }
    } catch (error) {
      console.error("Error applying filters:", error);
      toast.error("Failed to apply filters");
    }
  }, [test, stage, mode, device, status, date, activeTab, onApplyFilters]);

  // Apply filters whenever any filter value changes
  useEffect(() => {
    // Only apply filters if the dropdown is open and at least one filter has been initialized
    if (
      isOpen &&
      (testOptions.length > 0 ||
        stageOptions.length > 0 ||
        deviceOptions.length > 0)
    ) {
      applyFilters();
    }
  }, [
    test,
    stage,
    mode,
    device,
    status,
    date,
    isOpen,
    activeTab,
    testOptions.length,
    stageOptions.length,
    deviceOptions.length,
    applyFilters,
  ]);

  const handleClearTest = () => {
    setTest("");
  };

  const handleClearStage = () => {
    setStage("");
  };

  const handleClearMode = () => {
    setMode("");
  };

  const handleClearDevice = () => {
    setDevice("");
  };

  const handleClearStatus = () => {
    setStatus("");
  };

  const handleClearDate = () => {
    setDate("");
    setSelectedDate(undefined);
  };

  const handleClearAllFilters = () => {
    setTest("");
    setStage("");
    setMode("");
    setDevice("");
    setStatus("");
    setDate("");
  };

  // Update date when selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setDate(format(selectedDate, "yyyy-MM-dd"));
    }
  }, [selectedDate]);

  // If not open, return null but keep the component mounted
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-full animate-bounce-in">
      <div className="bg-white border-t-[1px] border-b-[1px] border-[#E3E6EB] p-4">
        <div className="flex flex-row gap-3 items-center">
          <CustomSelect
            placeholder="Select Test"
            options={testOptions}
            value={test}
            onChange={setTest}
            onClear={handleClearTest}
          />
          <CustomSelect
            placeholder="Select Stage"
            options={stageOptions}
            value={stage}
            onChange={setStage}
            onClear={handleClearStage}
          />
          <CustomSelect
            placeholder="Query Mode"
            options={modeOptions}
            value={mode}
            onChange={setMode}
            onClear={handleClearMode}
          />
          <CustomSelect
            placeholder="Device"
            options={deviceOptions}
            value={device}
            onChange={setDevice}
            onClear={handleClearDevice}
          />
          <CustomSelect
            placeholder="Status"
            options={statusOptions}
            value={status}
            onChange={setStatus}
            onClear={handleClearStatus}
          />
          <div className="flex items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-[140px] rounded-[8px] border-[#C6CED6] border-[1px] px-3 py-1.5 text-[13px] font-semibold text-[#4D5B6B] bg-white hover:bg-gray-50 focus:outline-none flex items-center justify-between ${
                    !date ? "text-muted-foreground" : ""
                  }`}
                >
                  {date ? format(new Date(date), "PPP") : "Select date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {date && (
              <button
                onClick={handleClearDate}
                className="ml-1 text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          {(test || stage || mode || device || status || date) && (
            <button
              onClick={handleClearAllFilters}
              className="ml-auto px-4 py-1.5 rounded-[8px] border-[1px] border-[#C6CED6] text-[13px] font-semibold text-[#4D5B6B] hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
