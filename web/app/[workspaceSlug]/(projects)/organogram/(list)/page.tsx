"use client";

import OrganogramTree from "../_components/OrganogramTree";

export default function OrganogramDashboard() {
  return (
    <>
      <div className="mt-6 p-10">
        <h1 className="text-2xl font-bold mb-4">Organogram</h1>
        <OrganogramTree />
      </div>
    </>
  );
}
