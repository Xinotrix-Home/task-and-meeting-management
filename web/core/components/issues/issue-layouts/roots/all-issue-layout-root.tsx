import React, { useCallback } from "react";
import isEmpty from "lodash/isEmpty";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import {
  ALL_ISSUES,
  EIssueLayoutTypes,
  EIssueFilterType,
  EIssuesStoreType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  EUserPermissions,
  EUserPermissionsLevel,
} from "@plane/constants";
import { IIssueDisplayFilterOptions } from "@plane/types";
// hooks
// components
import { Spinner } from "@plane/ui";
import { EmptyState } from "@/components/common";
import {
  BaseGanttRoot,
  CalendarLayout,
  KanBanLayout,
  ListLayout,
  ProjectAppliedFiltersRoot,
  ProjectIssueLayout,
  ProjectSpreadsheetLayout,
  SpreadsheetView,
} from "@/components/issues";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui";
// hooks
import { useGlobalView, useIssues, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// store
import emptyView from "@/public/empty-state/view.svg";
import { IssuePeekOverview } from "../../peek-overview";
import { IssueLayoutHOC } from "../issue-layout-HOC";
import { TRenderQuickActions } from "../list/list-view-types";

type Props = {
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
};

export const AllIssueLayoutRoot: React.FC<Props> = observer((props: Props) => {
  const { isDefaultView, isLoading = false, toggleLoading } = props;
  // router
  const { workspaceSlug, globalViewId } = useParams();
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const routeFilters: {
    [key: string]: string;
  } = {};
  searchParams.forEach((value: string, key: string) => {
    routeFilters[key] = value;
  });
  //swr hook for fetching issue properties
  useWorkspaceIssueProperties(workspaceSlug);
  // store
  const {
    issuesFilter: { filters, fetchFilters, updateFilters, getIssueFilters },
    issues: { clear, getIssueLoader, getPaginationData, groupedIssueIds, fetchIssues, fetchNextIssues },
  } = useIssues(EIssuesStoreType.GLOBAL);
  const { updateIssue, removeIssue, archiveIssue } = useIssuesActions(EIssuesStoreType.GLOBAL);

  const { allowPermissions } = useUserPermissions();

  const { fetchAllGlobalViews, getViewDetailsById } = useGlobalView();

  const viewDetails = getViewDetailsById(globalViewId?.toString());
  // filter init from the query params

  const routerFilterParams = () => {
    if (
      workspaceSlug &&
      globalViewId &&
      ["all-issues", "assigned", "created", "subscribed"].includes(globalViewId.toString())
    ) {
      let issueFilters: any = {};
      Object.keys(routeFilters).forEach((key) => {
        const filterKey: any = key;
        const filterValue = routeFilters[key]?.toString() || undefined;
        if (ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.spreadsheet.filters.includes(filterKey) && filterKey && filterValue)
          issueFilters = { ...issueFilters, [filterKey]: filterValue.split(",") };
      });

      if (!isEmpty(routeFilters))
        updateFilters(
          workspaceSlug.toString(),
          undefined,
          EIssueFilterType.FILTERS,
          issueFilters,
          globalViewId.toString()
        );
    }
  };

  const fetchNextPages = useCallback(() => {
    if (workspaceSlug && globalViewId) fetchNextIssues(workspaceSlug.toString(), globalViewId.toString());
  }, [fetchNextIssues, workspaceSlug, globalViewId]);

  const { isLoading: globalViewsLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_GLOBAL_VIEWS_${workspaceSlug}` : null,
    async () => {
      if (workspaceSlug) {
        await fetchAllGlobalViews(workspaceSlug.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const { isLoading: issuesLoading } = useSWR(
    workspaceSlug && globalViewId ? `WORKSPACE_GLOBAL_VIEW_ISSUES_${workspaceSlug}_${globalViewId}` : null,
    async () => {
      if (workspaceSlug && globalViewId) {
        clear();
        toggleLoading(true);
        await fetchFilters(workspaceSlug.toString(), globalViewId.toString());
        await fetchIssues(
          workspaceSlug.toString(),
          globalViewId.toString(),
          groupedIssueIds ? "mutation" : "init-loader",
          {
            canGroup: false,
            perPageCount: 100,
          }
        );
        routerFilterParams();
        toggleLoading(false);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug.toString(),
        projectId
      );
    },
    [workspaceSlug]
  );

  const issueFilters = globalViewId ? filters?.[globalViewId.toString()] : undefined;

  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      updateFilters(
        workspaceSlug.toString(),
        undefined,
        EIssueFilterType.DISPLAY_FILTERS,
        { ...updatedDisplayFilter },
        globalViewId.toString()
      );
    },
    [updateFilters, workspaceSlug, globalViewId]
  );

  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        readOnly={!canEditProperties(issue.project_id ?? undefined)}
        placements={placement}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  // when the call is not loading and the view does not exist and the view is not a default view, show empty state
  if (!isLoading && !globalViewsLoading && !issuesLoading && !viewDetails && !isDefaultView) {
    return (
      <EmptyState
        image={emptyView}
        title="View does not exist"
        description="The view you are looking for does not exist or you don't have permission to view it."
        primaryButton={{
          text: "Go to All tasks",
          onClick: () => router.push(`/${workspaceSlug}/workspace-views/all-issues`),
        }}
      />
    );
  }

  if ((isLoading && issuesLoading && getIssueLoader() === "init-loader") || !globalViewId || !groupedIssueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  const activeLayout = EIssueLayoutTypes?.SPREADSHEET; //  issueFilters?.displayFilters?.layout;
  // console.log("issues_layout", filters, filters?.[globalViewId.toString()], issueFilters, activeLayout);

  const issueIds = groupedIssueIds[ALL_ISSUES];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.GLOBAL}>
      {/* <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
        <SpreadsheetView
          displayProperties={issueFilters?.displayProperties ?? {}}
          displayFilters={issueFilters?.displayFilters ?? {}}
          handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
          issueIds={Array.isArray(issueIds) ? issueIds : []}
          quickActions={renderQuickActions}
          updateIssue={updateIssue}
          canEditProperties={canEditProperties}
          canLoadMoreIssues={!!nextPageResults}
          loadMoreIssues={fetchNextPages}
          isWorkspaceLevel
        />
        <IssuePeekOverview />
      </IssueLayoutHOC> */}
      {/* <ProjectIssueLayout activeLayout={activeLayout} /> */}

      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <ProjectAppliedFiltersRoot />
        <div className="relative h-full w-full overflow-auto bg-custom-background-90">
          {getIssueLoader() === "mutation" && (
            <div className="fixed w-[40px] h-[40px] z-50 right-[20px] top-[70px] flex justify-center items-center bg-custom-background-80 shadow-sm rounded">
              <Spinner className="w-4 h-4" />
            </div>
          )}
          <ProjectIssueLayout activeLayout={activeLayout} />
        </div>

        <IssuePeekOverview />
      </div>
    </IssuesStoreContext.Provider>
  );
});
