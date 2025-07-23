export default function CalendarView() {
    const meetings = [
        { date: '2025-05-14', title: 'Project Kickoff', status: 'Scheduled' },
        { date: '2025-05-10', title: 'Design Review', status: 'Completed' },
        { date: '2025-05-16', title: 'Client Feedback', status: 'Scheduled' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {meetings.map((meeting, idx) => (
                <div
                    key={idx}
                    className={`border rounded-lg p-4 ${
                        meeting.status === 'Completed'
                            ? 'bg-green-100'
                            : 'bg-blue-100'
                    }`}
                >
                    <h3 className="text-lg font-semibold">{meeting.title}</h3>
                    <p className="text-sm text-gray-600">Date: {meeting.date}</p>
                    <span className={`badge mt-2 ${
                        meeting.status === 'Completed' ? 'badge-success' : 'badge-info'
                    }`}>
            {meeting.status}
          </span>
                </div>
            ))}
        </div>
    );
}
