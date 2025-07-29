"use client";

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";

// ui

import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Breadcrumbs, Button, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane constants
// hooks
import { useUserPermissions } from "@/hooks/store";
import TaskHeaderFilters from "./TaskHeaderFilters";
import { TaskSearch } from "./TaskSearch";

export const TasksBaseHeader = observer(() => {
  const pathname = usePathname();
  const { allowPermissions } = useUserPermissions();

  const isAuthorizedUser = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isArchived = pathname.includes("/archives");

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Tasks" icon={<CalendarDays className="h-4 w-4 text-custom-text-300" />} />}
          />
          {isArchived && <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Archived" />} />}
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <TaskSearch />
        <div className="hidden md:flex">
          <TaskHeaderFilters />
        </div>
        {/* {isAuthorizedUser && !isArchived ? (
          <Button size="sm" className="items-center gap-1">
            <Link
              href={`/${pathname.split("/")[1]}/tasks/create-task`}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline-block">Create Task</span>
            </Link>
            <span className="inline-block sm:hidden">Task</span>
          </Button>
        ) : null} */}
      </Header.RightItem>
    </Header>
  );
});
