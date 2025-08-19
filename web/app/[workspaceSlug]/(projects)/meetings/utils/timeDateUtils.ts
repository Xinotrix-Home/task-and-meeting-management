
export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(isoDate));

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(+hours, +minutes);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export function formatDateTime(dateString: string, type: "date" | "time"): string {
  // Strip 'Z' to treat as local time if needed
  const localDate = new Date(dateString.replace(/Z$/, ""));

  if (type === "date") {
    return localDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }); // Example: "30 June 2025"
  }

  if (type === "time") {
    return localDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }); // Example: "9:00 AM"
  }

  return "";
}

export const isMeetingActive = (start_time: string, end_time: string): boolean => {
  const now = new Date();
  const parseLocal = (timeStr: string) =>
    // Remove 'Z' and treat as local
    new Date(timeStr.replace(/Z$/, ""));
  const start = parseLocal(start_time);
  const end = parseLocal(end_time);
  // console.log("Now     :", now.toString());
  // console.log("Start   :", start.toString());
  // console.log("End     :", end.toString())
  return now >= start && now <= end;
};
