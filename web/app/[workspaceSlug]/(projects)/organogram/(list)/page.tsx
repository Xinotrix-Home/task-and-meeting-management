"use client";

import OrganogramTree from "../_components/OrganogramTable";

export default function MeetingDashboard() {
  return (
    <>
      <div className="mt-6 p-10">
        <h1 className="text-2xl font-bold mb-4">Organogram Table</h1>
        <OrganogramTree />
      </div>
    </>
  );
}
