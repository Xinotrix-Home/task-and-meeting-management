"use client";

import { observer } from "mobx-react";
import Head from "next/head";
// i18n
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core";
import { ProjectLayoutRoot } from "@/components/issues";
// hooks

const ProjectIssuesPage = observer(() => {
  // i18n
  const { t } = useTranslation();
  // store

  return (
    <>
      <PageHead title={"Tasks"} />
      <Head>
        <title>
          {"Tasks"} - {t("issue.label", { count: 2 })}
        </title>
      </Head>
      <div className="h-full w-full">
        <ProjectLayoutRoot />
      </div>
    </>
  );
});

export default ProjectIssuesPage;
