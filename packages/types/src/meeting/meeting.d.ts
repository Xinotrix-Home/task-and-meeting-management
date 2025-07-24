
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
  summary?: string;
}

export interface IMeetingGroup {
  label: string;
  meetings: IMeeting[];
}

