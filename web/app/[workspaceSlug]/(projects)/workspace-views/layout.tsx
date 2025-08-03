"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectIssuesHeader } from "../projects/(detail)/[projectId]/issues/(list)/header";
import { GlobalIssuesHeader } from "./header";

export default function GlobalIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader
        header={<ProjectIssuesHeader />}
        //  header={<GlobalIssuesHeader />}
      />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
