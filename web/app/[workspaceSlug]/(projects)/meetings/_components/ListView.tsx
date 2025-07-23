'use client';

import { useState } from 'react';

export default function ListView() {
    const allMeetings = [
        { title: 'Project Kickoff', date: '2025-05-14', participant: 'Sumaiya', status: 'Scheduled' },
        { title: 'Design Review', date: '2025-05-10', participant: 'Mamun', status: 'Completed' },
        { title: 'Client Feedback', date: '2025-05-16', participant: 'Salam', status: 'Scheduled' },
    ];

    const [statusFilter, setStatusFilter] = useState('');
    const [participantFilter, setParticipantFilter] = useState('');

    const filtered = allMeetings.filter((m) => {
        return (
            (statusFilter === '' || m.status === statusFilter) &&
            (participantFilter === '' || m.participant.includes(participantFilter))
        );
    });

    return (
        <div className="overflow-x-auto rounded-xl shadow">
            <table className="table table-zebra table-bordered w-full">
                <thead className="bg-base-200 text-base font-semibold">
                <tr>
                    <th>Title</th>
                    <th>Date</th>
                    <th>Participant</th>
                    <th>Status</th>
                </tr>
                </thead>
                <tbody>
                {filtered.map((m, idx) => (
                    <tr key={idx} className="hover">
                        <td>{m.title}</td>
                        <td>{m.date}</td>
                        <td>{m.participant}</td>
                        <td>
            <span
                className={`badge ${
                    m.status === 'Completed' ? 'badge-success' : 'badge-info'
                }`}
            >
              {m.status}
            </span>
                        </td>
                    </tr>
                ))}
                {filtered.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center text-gray-500">
                            No meetings found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>

    );
}
