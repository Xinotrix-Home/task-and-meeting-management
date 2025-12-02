"use client";

import { observer } from "mobx-react";
import { usePathname } from "next/navigation";

// ui
import { Users2Icon } from "lucide-react";
// import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
// plane constants
// hooks

export const OrganogramBaseHeader = observer(() => {
  const pathname = usePathname();
  // const { allowPermissions } = useUserPermissions();

  // const isAuthorizedUser = allowPermissions(
  //   [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
  //   EUserPermissionsLevel.WORKSPACE
  // );
  const isArchived = pathname.includes("/archives");

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={<BreadcrumbLink label="Organogram" icon={<Users2Icon className="h-4 w-4 text-custom-text-300" />} />}
          />
          {isArchived && <Breadcrumbs.BreadcrumbItem type="text" link={<BreadcrumbLink label="Archived" />} />}
        </Breadcrumbs>
      </Header.LeftItem>
      {/* <Header.RightItem>
        <div className="hidden md:flex">
          <OrganogramHeaderFilters />
        </div>
        {isAuthorizedUser && !isArchived ? (
          <Button size="sm" className="items-center gap-1">
            <Link
              href={`/${pathname.split("/")[1]}/meetings/create-meeting`}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="hidden sm:inline-block">Create</span>
            </Link>
            <span className="inline-block sm:hidden">Organograms</span>
          </Button>
        ) : null}
      </Header.RightItem> */}
    </Header>
  );
});
