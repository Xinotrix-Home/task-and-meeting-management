"use client";

import { AppHeader, ContentWrapper } from "@/components/core";
import { ProjectIssuesHeader } from "../projects/(detail)/[projectId]/issues/(list)/header";
import { ProjectIssuesMobileHeader } from "../projects/(detail)/[projectId]/issues/(list)/mobile-header";
import { GlobalIssuesHeader } from "./header";

export default function GlobalIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader
        header={<ProjectIssuesHeader />}
        mobileHeader={<ProjectIssuesMobileHeader />}

        // header={<GlobalIssuesHeader />}
      />
      <ContentWrapper>{children}</ContentWrapper>
    </>
  );
}
