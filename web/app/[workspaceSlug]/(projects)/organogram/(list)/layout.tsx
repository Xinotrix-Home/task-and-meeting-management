"use client";

import { ReactNode } from "react";
// components
import { AppHeader, ContentWrapper } from "@/components/core";
// local components
import { ProjectsListMobileHeader } from "@/plane-web/components/projects/mobile-header";
import { OrganogramBaseHeader } from "../_components/OrganogramBaseHeader";

export default function ProjectListLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader header={<OrganogramBaseHeader />} mobileHeader={<ProjectsListMobileHeader />} />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
