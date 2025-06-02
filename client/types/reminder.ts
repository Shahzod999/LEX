export interface ReminderResponseType {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  schedule: string;
  status: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ReminderRequestType {
  title: string;
  description: string;
  deadline: string;
  schedule: string;
  status?: string;
}

export interface ReminderActionResponseType {
  message: string;
  reminderId?: string;
}
