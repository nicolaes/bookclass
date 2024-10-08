export type LoginMember = {
  fname?: string;
}

export type LoginResult = {
  token?: string;
  member?: LoginMember;
  error?: string;
}

export type Clubs = {
  clubs: {
    [key: string]: {
      clubid: string,
      short_name: string,
      resources: {
        [key: string]: {
          tagid: string,
          name: string
        }
      }
    }
  }
}

export type Bookings = {
  booking: {
    class: {
      date: string;
      hour: string;
      name: string;
      trainers: {
        name: string;
      };
    };
    club: string;
    type: string;
    waiting_list_place: string;
  }[]
}

export type BookingDto = {
  date_time: string;
  class_name: string;
  club: string;
  waiting_list: number;
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
