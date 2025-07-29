"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRightToLineIcon, PencilIcon, ViewIcon } from "lucide-react";
import { Button, ContentWrapper } from "@plane/ui";
import { LogoSpinner } from "@/components/common";
import { formatDateTime } from "../../meetings/utils/timeDateUtils";
// edit icon

const TaskCardList = observer(() => {
  const router = useRouter();
  const { workspaceSlug } = useParams(); //projectId
  // const taskStore = useTask();
  const [showAllTasksLabel, setShowAllTasksLabel] = useState<string | null>("");

  // const {
  //   project: { projectMemberIds, getProjectMemberDetails },
  // } = useMember();

  // fetch workspace data
  // useSWR(
  //   workspaceSlug ? `WORKSPACE_MEETINGS_${workspaceSlug}` : null,
  //   workspaceSlug ? () => taskStore.fetchTasks(workspaceSlug.toString()) : null,
  //   { revalidateIfStale: false, revalidateOnFocus: false }
  // );

  // if (taskStore.isLoading)
  //   return (
  //     <div className="relative flex h-screen w-full items-center justify-center">
  //       <LogoSpinner />
  //     </div>
  //   );
  // if (taskStore.error) return <div>{taskStore.error.message}</div>;

  // const groupedTasks = groupTasksByLabel(taskStore.tasks);

  const handleVIewAllTasks = (taskLabel: string) => {
    setShowAllTasksLabel(taskLabel);
  };

  // const renderTasksList = (taskGroups: ITaskGroup[]) => (
  //   <div className="grid grid-cols-1">
  //     {taskGroups.map((taskGroup) => {
  //       let tasksData;
  //       if (showAllTasksLabel) {
  //         tasksData = showAllTasksLabel === taskGroup?.label ? taskGroup : null;
  //       } else {
  //         tasksData = taskGroup;
  //       }
  //       if (!tasksData?.label) return;
  //       const tasks = !(showAllTasksLabel === "") ? taskGroup?.tasks : taskGroup?.tasks?.slice(0, 5);
  //       return (
  //         <div key={tasksData?.label} className="mb-6">
  //           <div className="flex justify-between items-center my-2">
  //             <h2 className="text-xl font-semibold mb-4">
  //               {tasksData?.label
  //                 ?.toLowerCase()
  //                 .split(" ")
  //                 .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  //                 .join(" ")}{" "}
  //               Tasks
  //             </h2>
  //             {tasksData?.tasks?.length > 5 && showAllTasksLabel && (
  //               <Button className="btn btn-secondary text-xs" onClick={() => handleVIewAllTasks("")}>
  //                 <span>Back to tasks</span>
  //               </Button>
  //             )}
  //           </div>
  //           <div className="bg-gray-800 text-white rounded-lg shadow divide-y divide-gray-500">
  //             {/* Header Row */}
  //             <div className="grid grid-cols-7 gap-5 text-sm font-bold  tracking-wide text-gray-300 bg-gray-700 px-4 py-3 rounded-t-lg">
  //               <div>Date 📅</div>
  //               <div>Start Time ⏰</div>
  //               <div>Subject 📝</div>
  //               <div>Description 🧾</div>
  //               <div>Chairperson 👥</div>
  //               <div>Host 👥</div>
  //               {/* <div>Participants 👥</div> */}
  //               <div className="text-center">Actions ⚙️</div>
  //             </div>
  //             {/* Task Rows */}
  //             {tasks?.map((task) => {
  //               const isLive = isTaskActive(task?.start_time, task?.end_time);
  //               return (
  //                 <div key={task?.id} className="grid grid-cols-7 items-center justify-center gap-5 px-4 py-3">
  //                   <div className="text-sm">{formatDateTime(task?.start_time, "date")}</div>
  //                   <div className="text-sm ">{formatDateTime(task?.start_time, "time")}</div>
  //                   <div className="text-sm">{task?.subject}</div>
  //                   <div className="text-sm">{task?.description?.slice(0, 20)}...</div>
  //                   <div className="text-sm">{task?.chairperson?.display_name}</div>
  //                   <div className="text-sm">{task?.host?.display_name}</div>
  //                   {/* <div className="text-sm">{task?.participants?.map((p) => p?.display_name).join(", ")}</div> */}
  //                   <div className="flex gap-4 justify-center p-1">
  //                     {/* {!(task?.id === "Me") && !(taskGroup?.label === "Completed") && ( */}
  //                     {/* Task Minute */}
  //                     {isLive && (
  //                       <div className="relative group">
  //                         <Link
  //                           href={`/${workspaceSlug?.toString()}/tasks/task-minute/${task?.id}`}
  //                           className="rounded hover:bg-gray-700"
  //                         >
  //                           <ArrowRightToLineIcon size={18} />
  //                         </Link>
  //                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-5">
  //                           Task minutes
  //                         </div>
  //                       </div>
  //                     )}

  //                     {/* Edit Task */}
  //                     {!(taskGroup?.label === "Completed") && !isLive && (
  //                       <div className="relative group">
  //                         <Link
  //                           href={`/${workspaceSlug?.toString()}/tasks/update-task/${task?.id}`}
  //                           className=" rounded hover:bg-gray-700"
  //                         >
  //                           <PencilIcon size={18} />
  //                         </Link>
  //                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
  //                           Edit task
  //                         </div>
  //                       </div>
  //                     )}
  //                     {/* View Details */}
  //                     <div className="relative group">
  //                       <Link
  //                         href={`/${workspaceSlug?.toString()}/tasks/task-details/${task?.id}`}
  //                         className="rounded hover:bg-gray-700"
  //                       >
  //                         <ViewIcon size={18} />
  //                       </Link>
  //                       <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
  //                         View details
  //                       </div>
  //                     </div>
  //                   </div>
  //                 </div>
  //               );
  //             })}
  //           </div>
  //           {tasksData?.tasks?.length > 5 && !showAllTasksLabel && (
  //             <div className="flex w-full justify-end mt-2">
  //               <Button className="btn btn-primary text-xs" onClick={() => handleVIewAllTasks(taskGroup?.label)}>
  //                 <span>View all</span>
  //               </Button>
  //             </div>
  //           )}
  //         </div>
  //       );
  //     })}
  //   </div>
  // );

  return (
    <ContentWrapper>
      <div className="space-y-12">
        <div>
          {/* {groupedTasks?.length > 0 ? (
            renderTasksList(groupedTasks)
          ) : ( */}
          <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
            <div className="text-center">
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-balance">No tasks found</h3>
              <div className="mt-4 flex items-center justify-center gap-x-6">
                <Button
                  className="btn btn-primary text-xs"
                  onClick={() => router.push(`/${workspaceSlug?.toString()}/`)}
                >
                  Go back home
                </Button>
              </div>
            </div>
          </main>
          {/* )} */}
        </div>
      </div>
    </ContentWrapper>
  );
});

export default TaskCardList;
