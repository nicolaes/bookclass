export type LoginResult = {
  token?: string;
  member?: {
    fname?: string;
  }
  error?: string;
}

export type Clubs = {
  clubs: {
    [key: string]: {
      clubid: string,
      short_name: string
    }
  }
}

export type ClubDto = {
  id: string;
  name: string;
}

export type ClassItem = {
  id: string;
  date: string;
  hour: string;
  name: string;
  trainers: string[];

  booked: boolean;
  can_book: boolean;

  error: string; // BOOKINGS_OPENES_ON
  error_details: string; // "29.05.2024 11:00"
  open_registration: string; // "2024-06-01 09:00:00"
}

export type Schedule = {
  schedule: ClassItem[]
}

export type GcpTask = {
  id: string;
  scheduleTimestamp: string;
  url: string;
}

export type ScheduledBooking = {
  taskId: string;
  className: string;
}
