"use client";

import { useState } from "react";
import { FilePlus, Trash } from "lucide-react";

export default function MeetingForm() {
  const users = ["Mamun Hasan", "Sumaiya", "Salam Hossain", "Steve Jobs"];

  const [agendaItems, setAgendaItems] = useState([
    { agenda: "Project Kickoff", owner: "Mamun Hasan", duration: "30 min" },
  ]);

  const addAgenda = () => {
    setAgendaItems([...agendaItems, { agenda: "", owner: "", duration: "" }]);
  };

  const removeAgenda = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  return (
    <form className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto space-y-6">
      {/* Subject */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Meeting Subject</span>
        </label>
        <input type="text" placeholder="Enter meeting subject" className="input input-bordered w-full" />
      </div>

      {/* Body */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Meeting Body / Description</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          placeholder="Add description of the meeting..."
        />
      </div>

      {/* Date & People */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">
            <span className="label-text font-semibold">Meeting Date & Time</span>
          </label>
          <input type="datetime-local" className="input input-bordered w-full" />
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">Chairperson</span>
          </label>
          <select className="select select-bordered w-full">
            <option disabled selected>
              Select chairperson
            </option>
            {users.map((u, i) => (
              <option key={i}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">Host</span>
          </label>
          <select className="select select-bordered w-full">
            <option disabled selected>
              Select host
            </option>
            {users.map((u, i) => (
              <option key={i}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">
            <span className="label-text font-semibold">Participants</span>
          </label>
          <select className="select select-bordered w-full" multiple>
            {users.map((u, i) => (
              <option key={i}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agenda Section */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">Meeting Agenda</h3>
          <button type="button" className="btn btn-outline btn-sm flex items-center gap-1" onClick={addAgenda}>
            <FilePlus /> Add Agenda
          </button>
        </div>

        <div className="space-y-4">
          {agendaItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-end">
              {/* Agenda input - spans 5 columns */}
              <div className="col-span-12 md:col-span-5">
                <label className="label">
                  <span className="label-text">Agenda</span>
                </label>
                <input
                  type="text"
                  placeholder="Agenda item"
                  defaultValue={item.agenda}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Owner - spans 3 columns */}
              <div className="col-span-12 md:col-span-3">
                <label className="label">
                  <span className="label-text">Owner</span>
                </label>
                <select className="select select-bordered w-full" defaultValue={item.owner}>
                  <option disabled>Select owner</option>
                  {users.map((u, i) => (
                    <option key={i}>{u}</option>
                  ))}
                </select>
              </div>

              {/* Duration - spans 3 columns */}
              <div className="col-span-12 md:col-span-3">
                <label className="label">
                  <span className="label-text">Duration</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 30 min"
                  defaultValue={item.duration}
                  className="input input-bordered w-full"
                />
              </div>

              {/* Delete icon - spans 1 column, icon only */}
              <div className="col-span-12 md:col-span-1 flex items-end justify-center pb-1">
                <button
                  type="button"
                  className="btn btn-sm btn-circle btn-error btn-outline"
                  onClick={() => removeAgenda(idx)}
                >
                  <Trash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="label">
          <span className="label-text font-semibold">Attachments</span>
        </label>
        <input type="file" className="file-input file-input-bordered w-full" />
      </div>

      <div className="flex flex-wrap gap-4 justify-end pt-4">
        <button type="button" className="btn btn-outline">
          Save as Draft
        </button>
        <button type="submit" className="btn btn-success">
          Submit
        </button>
      </div>
    </form>
  );
}
