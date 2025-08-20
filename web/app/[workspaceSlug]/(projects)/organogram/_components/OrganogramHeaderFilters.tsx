"use client";

import { useState } from "react";
import { ListFilter } from "lucide-react";
import { cn } from "@plane/utils";
// components
import { FiltersDropdown } from "@/components/issues";

type Props = {
  filterMenuButton?: React.ReactNode;
  classname?: string;
  filterClassname?: string;
  isMobile?: boolean;
};

const MEETING_TYPES = ["In-Person", "Online", "Hybrid"];
const MEETING_STATUSES = ["Scheduled", "Completed", "Cancelled"];

export default function OrganogramHeaderFilters({
  filterMenuButton,
  // isMobile,
  classname = "",
  filterClassname = "",
}: Props) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>("");

  const toggleSelection = (item: string, list: string[], setList: (v: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const isFiltersApplied = selectedTypes.length > 0 || selectedStatuses.length > 0 || !!selectedOwner;

  return (
    <div className={cn("flex gap-3", classname)}>
      <div className={cn(filterClassname)}>
        <FiltersDropdown
          icon={<ListFilter className="h-3 w-3" />}
          title="Filters"
          placement="bottom-end"
          isFiltersApplied={isFiltersApplied}
          menuButton={filterMenuButton || null}
        >
          <div className="space-y-4 p-2 w-64 text-sm text-custom-text-100">
            {/* Meeting Type Filter */}
            <div>
              <p className="mb-1 font-medium">Meeting Type</p>
              <div className="flex flex-col gap-1">
                {MEETING_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleSelection(type, selectedTypes, setSelectedTypes)}
                      className="form-checkbox"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <p className="mb-1 font-medium">Status</p>
              <div className="flex flex-col gap-1">
                {MEETING_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status)}
                      onChange={() => toggleSelection(status, selectedStatuses, setSelectedStatuses)}
                      className="form-checkbox"
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>

            {/* Owner Filter */}
            <div>
              <p className="mb-1 font-medium">Owner</p>
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="w-full border border-custom-border-200 rounded px-2 py-1 bg-custom-background-100 text-custom-text-100"
              >
                <option value="">All</option>
                <option value="me">Me</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>
        </FiltersDropdown>
      </div>
    </div>
  );
}
