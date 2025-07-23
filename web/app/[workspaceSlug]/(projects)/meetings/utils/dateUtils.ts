/**
 * Formats a date string into a human-readable format: "30 June, 2025"
 * @param dateString - ISO or valid date string
 * @returns Formatted date like "30 June, 2025" or empty string if invalid
 */
export function formatReadableDate(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";

  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
}

/**
 * Formats two date strings into a time range like "12:15 PM - 3:00 PM"
 * @param startDateString - ISO or valid start time string
 * @param endDateString - ISO or valid end time string
 * @returns Time range string or empty string if either date is invalid
 */
export function formatTimeRange(startDateString: string, endDateString: string): string {
  const formatTime = (dateString: string): string => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const startTime = formatTime(startDateString);
  const endTime = formatTime(endDateString);

  return startTime && endTime ? `${startTime} - ${endTime}` : "";
}

/**
 * Checks if a given date string is today's date (local time)
 * @param dateString - ISO or valid date string
 * @returns true if the date is today, false otherwise
 */
export function isToday(dateString: string): boolean {
  if (!dateString) return false;

  const input = new Date(dateString);
  if (isNaN(input.getTime())) return false;

  const today = new Date();

  return (
    input.getFullYear() === today.getFullYear() &&
    input.getMonth() === today.getMonth() &&
    input.getDate() === today.getDate()
  );
}

/**
 * Checks if a given date string represents a past date (before today)
 * Compares only the date part, ignoring time
 * @param dateString - ISO or valid date string
 * @returns true if the date is before today, false otherwise
 */
export function isDatePassed(dateString: string): boolean {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  // Normalize to midnight for accurate day-level comparison
  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return inputDate < todayDate;
}
