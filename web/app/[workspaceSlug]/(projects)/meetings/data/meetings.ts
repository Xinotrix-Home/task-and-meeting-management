export const sampleMeetings: IMeetingGroup[] = [
  {
    label: "Upcoming",
    meetings: [
      {
        id: "meeting-001",
        subject: "Quarterly Strategy Meeting",
        description: "Discuss quarterly goals and roadmap",
        start_time: "2025-07-10T10:00:00Z",
        end_time: "2025-07-10T12:00:00Z",
        chairperson: {
          id: "user-001",
          first_name: "Alice",
          last_name: "Johnson",
          display_name: "Alice Johnson",
        },
        host: {
          id: "user-002",
          first_name: "Bob",
          last_name: "Smith",
          display_name: "Bob Smith",
        },
        participants: [
          {
            id: "user-003",
            first_name: "Charlie",
            last_name: "Brown",
            display_name: "Charlie Brown",
          },
          {
            id: "user-004",
            first_name: "Diana",
            last_name: "Prince",
            display_name: "Diana Prince",
          },
        ],
        agendas: [
          {
            id: "agenda-001",
            title: "Review Q2 Results",
            duration_minutes: 30,
            assignees: [
              { id: "user-003", first_name: "Charlie", last_name: "Brown", display_name: "Charlie Brown" }
            ],
            issues: [
              {
                id: "issue-001",
                name: "Sales Drop Analysis",
                description: "Analyze why Q2 sales dropped by 10%",
                assignees: [
                  { id: "user-003", first_name: "Charlie", last_name: "Brown", display_name: "Charlie Brown" }
                ],
                target_date: "2025-07-15",
                priority: "high",
              },
            ],
            // note: "Prepare presentation before the meeting.",
          },
        ],
        attachments: [
          {
            id: "attach-001",
            name: "Q2_Report.pdf",
            url: "https://example.com/files/Q2_Report.pdf",
            type: "application/pdf",
          },
        ],
      },
      {
        id: "meeting-004",
        subject: "Marketing Campaign Planning",
        description: "Outline the next big push for Q3",
        start_time: "2025-07-12T15:00:00Z",
        end_time: "2025-07-12T16:30:00Z",
        chairperson: {
          id: "user-008",
          first_name: "Helen",
          last_name: "Nguyen",
          display_name: "Helen Nguyen",
        },
        host: {
          id: "user-009",
          first_name: "Ivan",
          last_name: "Lopez",
          display_name: "Ivan Lopez",
        },
        participants: [
          {
            id: "user-010",
            first_name: "Jake",
            last_name: "Khan",
            display_name: "Jake Khan",
          },
          {
            id: "user-011",
            first_name: "Lily",
            last_name: "Singh",
            display_name: "Lily Singh",
          },
          {
            id: "user-012",
            first_name: "Mohammed",
            last_name: "Ali",
            display_name: "Mohammed Ali",
          },
        ],
        agendas: [],
        attachments: [],
      },
      {
        id: "meeting-005",
        subject: "Product Launch Prep",
        description: "Final checklist before product launch",
        start_time: "2025-07-14T09:30:00Z",
        end_time: "2025-07-14T11:00:00Z",
        chairperson: {
          id: "user-013",
          first_name: "Nora",
          last_name: "Kim",
          display_name: "Nora Kim",
        },
        host: {
          id: "user-014",
          first_name: "Oscar",
          last_name: "Garcia",
          display_name: "Oscar Garcia",
        },
        participants: [],
        agendas: [],
        attachments: [],
      },
    ],
  },
  {
    label: "Completed",
    meetings: [
      {
        id: "meeting-002",
        subject: "Retrospective - June",
        description: "Review what went well and what to improve",
        start_time: "2025-06-30T09:00:00Z",
        end_time: "2025-06-30T10:00:00Z",
        chairperson: {
          id: "user-005",
          first_name: "Eve",
          last_name: "Miller",
          display_name: "Eve Miller",
        },
        host: {
          id: "user-006",
          first_name: "Frank",
          last_name: "Taylor",
          display_name: "Frank Taylor",
        },
        participants: [
          {
            id: "user-007",
            first_name: "Grace",
            last_name: "Lee",
            display_name: "Grace Lee",
          },
        ],
        agendas: [
          {
            id: "agenda-002",
            title: "Team Feedback",
            duration_minutes: 45,
            assignees: [],
            // note: "General discussion around last sprint.",
          },
        ],
        attachments: [],
      },
      {
        id: "meeting-006",
        subject: "Design Review",
        description: "Discuss latest UI mockups and feedback",
        start_time: "2025-06-25T13:00:00Z",
        end_time: "2025-06-25T14:30:00Z",
        chairperson: {
          id: "user-010",
          first_name: "Jake",
          last_name: "Khan",
          display_name: "Jake Khan",
        },
        host: {
          id: "user-011",
          first_name: "Lily",
          last_name: "Singh",
          display_name: "Lily Singh",
        },
        participants: [],
        agendas: [],
        attachments: [],
      },
      {
        id: "meeting-007",
        subject: "Post-Launch Analysis",
        description: "Review KPIs after product launch",
        start_time: "2025-06-20T11:00:00Z",
        end_time: "2025-06-20T12:00:00Z",
        chairperson: {
          id: "user-008",
          first_name: "Helen",
          last_name: "Nguyen",
          display_name: "Helen Nguyen",
        },
        host: {
          id: "user-009",
          first_name: "Ivan",
          last_name: "Lopez",
          display_name: "Ivan Lopez",
        },
        participants: [],
        agendas: [],
        attachments: [],
      },
    ],
  },
  {
    label: "Draft",
    meetings: [
      {
        id: "meeting-003",
        subject: "UX Research Kickoff",
        description: "Initial alignment for UX study",
        start_time: "2025-07-15T13:00:00Z",
        end_time: "2025-07-15T14:00:00Z",
        chairperson: undefined,
        host: undefined,
        participants: [],
        agendas: [],
        attachments: [],
      },
      {
        id: "meeting-008",
        subject: "Security Audit Planning",
        description: "Outline goals for internal audit",
        start_time: "2025-07-18T10:00:00Z",
        end_time: "2025-07-18T11:30:00Z",
        chairperson: undefined,
        host: undefined,
        participants: [],
        agendas: [],
        attachments: [],
      },
      {
        id: "meeting-009",
        subject: "Customer Success Playbook",
        description: "Draft strategies for customer onboarding",
        start_time: "2025-07-20T14:00:00Z",
        end_time: "2025-07-20T15:00:00Z",
        chairperson: undefined,
        host: undefined,
        participants: [],
        agendas: [],
        attachments: [],
      },
    ],
  },
];


export interface IUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  avatar_url?: string;
  display_name?: string;
}

export interface IAttachment {
  id?: string;
  name: string;
  url?: string;
  type?: string;
  file?: File;
}

export interface IssueItem {
  id?: string;
  name: string;
  description: string;
  assignees: IUser[];
  target_date: string;
  priority: string;
}

export interface IAgenda {
  id?: string;
  title: string;
  duration_minutes: number;
  assignees: IUser[];
  issues?: IssueItem[];
  // note?: string;
}

export interface IMeeting {
  id?: string;
  subject: string;
  description: string;
  start_time: string;
  end_time: string;
  chairperson?: IUser;
  host?: IUser;
  participants: IUser[];
  agendas: IAgenda[];
  attachments: IAttachment[];
}

export interface IMeetingGroup {
  label: string;
  meetings: IMeeting[];
}

