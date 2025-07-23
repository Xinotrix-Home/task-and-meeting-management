"use client";

import { FileClock, FilePlus, Trash } from "lucide-react";
import { useState } from "react";

type ActionItem = {
  name: string;
  assignee: string;
  dueDate: string;
  priority: string;
};

type AgendaItem = {
  agenda: string;
  owner: string;
  time: string;
  actions: ActionItem[];
};

const users = ["Mamun Hasan", "Sumaiya", "Salam Hossain"];

export default function MeetingMinutesForm() {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    {
      agenda: "Product Plan & TG2",
      owner: "Salam",
      time: "12:10 - 13:00",
      actions: [],
    },
  ]);

  const handleAddAgenda = () => {
    setAgendaItems([...agendaItems, { agenda: "", owner: "", time: "", actions: [] }]);
  };

  const handleAddAction = (agendaIdx: number) => {
    const updated = [...agendaItems];
    updated[agendaIdx].actions.push({ name: "", assignee: "", dueDate: "", priority: "" });
    setAgendaItems(updated);
  };

  const handleRemoveAction = (agendaIdx: number, actionIdx: number) => {
    const updated = [...agendaItems];
    updated[agendaIdx].actions.splice(actionIdx, 1);
    setAgendaItems(updated);
  };

  return (
    <form className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      {/* Subject and Time */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-xl font-semibold">IT Business Opening</h2>
        <div className="flex items-center gap-2 text-gray-600">
          <FileClock className="text-lg" />
          <span>1st Dec 2023 | 12:10 – 16:00</span>
        </div>
      </div>

      {/* Chairperson / Host / Participants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">
            <span className="label-text">Chairperson</span>
          </label>
          <input
            type="text"
            placeholder="Chairperson"
            defaultValue="Steve Jobs"
            className="input input-bordered w-full"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Host</span>
          </label>
          <input type="text" placeholder="Host" defaultValue="Mamun Hasan" className="input input-bordered w-full" />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Participants</span>
          </label>
          <input
            type="text"
            placeholder="Participants"
            defaultValue="Sumaiya, Salam, Ibrahim"
            className="input input-bordered w-full"
          />
        </div>
      </div>

      {/* Agenda List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Agenda</h3>
          <button type="button" onClick={handleAddAgenda} className="btn btn-sm btn-outline flex items-center gap-1">
            <FilePlus /> Add Agenda
          </button>
        </div>

        <div className="space-y-4">
          {agendaItems.map((item, idx) => (
            <div key={idx} className="collapse collapse-arrow border border-base-300 rounded-box">
              <input type="checkbox" />
              <div className="collapse-title text-md font-medium">{item.agenda || `Agenda ${idx + 1}`}</div>
              <div className="collapse-content space-y-4">
                {/* Agenda Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                  <div className="md:col-span-3">
                    <label className="label">
                      <span className="label-text">Agenda</span>
                    </label>
                    <input type="text" defaultValue={item.agenda} className="input input-bordered w-full" />
                  </div>
                  <div className="md:col-span-2">
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
                  <div className="md:col-span-1">
                    <label className="label">
                      <span className="label-text">Time</span>
                    </label>
                    <input type="text" defaultValue={item.time} className="input input-bordered w-full" />
                  </div>
                </div>

                {/* Actions Section */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Action Items</h4>
                    <button type="button" className="btn btn-xs btn-outline" onClick={() => handleAddAction(idx)}>
                      <FilePlus className="mr-1" /> Add Action
                    </button>
                  </div>

                  {item.actions.map((action, aIdx) => (
                    <div key={aIdx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border p-3 rounded-md">
                      <div className="md:col-span-4">
                        <label className="label">
                          <span className="label-text">Action</span>
                        </label>
                        <input type="text" placeholder="Action name" className="input input-bordered w-full" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="label">
                          <span className="label-text">Assignee</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option disabled selected>
                            Select user
                          </option>
                          {users.map((u, i) => (
                            <option key={i}>{u}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="label">
                          <span className="label-text">Due Date</span>
                        </label>
                        <input type="date" className="input input-bordered w-full" />
                      </div>
                      <div className="md:col-span-1">
                        <label className="label">
                          <span className="label-text">Priority</span>
                        </label>
                        <select className="select select-bordered w-full">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                        </select>
                      </div>
                      <div className="md:col-span-1 flex items-center justify-center pt-6">
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(idx, aIdx)}
                          className="btn btn-sm btn-circle btn-error btn-outline"
                        >
                          <Trash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">
          <span className="label-text">Meeting Notes / Summary</span>
        </label>
        <textarea
          className="textarea textarea-bordered w-full"
          rows={5}
          placeholder="Write meeting notes, decisions, and summary..."
        ></textarea>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end pt-4">
        <button type="button" className="btn btn-outline">
          Save as Draft
        </button>
        <button type="submit" className="btn btn-primary">
          Submit
        </button>
      </div>
    </form>
  );
}
