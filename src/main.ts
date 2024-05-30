import { HttpClient, HttpHeaders, HttpParams, provideHttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { ClassItem, ClubDto, Clubs, LoginResult, Schedule, ScheduledBooking } from './book.model';
import { addDays, format, fromUnixTime, parse } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ApiService } from './api.service';

const postBody = new HttpParams().set('project', 'wcr').set('lang', '2').toString();
const postHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './main.html',
  styles: `
    h1, h2 { font-family: "Leckerli One", cursive; }
  `,
  imports: [FormsModule]
})
export class App implements OnInit {
  private readonly apiService = inject(ApiService);

  username = '';
  password = '';
  loginResult = signal('');
  loggedIn = signal(false);

  clubs = signal<ClubDto[]>([]);
  days = signal<string[]>([]);
  classes = signal<ClassItem[]>([]);

  selectedClubId = '';
  selectedDay = '';
  _allClasses: ClassItem[] = [];
  selectedClass = '';

  scheduledBookings = signal<ScheduledBooking[]>([]);

  ngOnInit(): void {
    this.populateDays();
  }

  login() {
    this.logout();
    this.apiService.login(this.username, this.password)
      .subscribe(({ successful, error }) => {
        this.loggedIn.set(successful);
        if (successful) {
          this.getClubs();
          this.getBookings();
          this.loginResult.set('');
        } else {
          this.loginResult.set(`Eroare ${error}`);
        }
      });
  }

  logout() {
    this.scheduledBookings.set([]);
    this.loginResult.set('');
  }

  getClubs() {
    this.apiService.getClubs().subscribe((clubs) => {
      this.clubs.set(clubs);
    });
  }

  selectClub(event: any) {
    this.selectedClubId = event?.target.value;
    this.getClasses();
  }

  getClasses() {
    if (!this.selectedClubId) return;

    this._allClasses = [];
    this.getClassesForTheDay();

    this.apiService.getClasses(this.selectedClubId, this.days())
      .subscribe((allClasses) => {
        this._allClasses = allClasses;
        this.getClassesForTheDay();
      });
  }


  selectDay(event: any) {
    this.selectedDay = event?.target.value;
    this.getClassesForTheDay();
  }

  getClassesForTheDay() {
    this.selectedClass = '';
    if (!this.selectedDay || !this._allClasses.length) {
      this.classes.set([]);
      return;
    }

    const classes = this._allClasses
      .filter(cls => cls.date === this.selectedDay &&
        (cls.can_book || cls.error === 'BOOKINGS_OPENES_ON'));
    this.classes.set(classes);
  }

  get selectedCls(): ClassItem | undefined {
    return this._allClasses.find(c => c.id === this.selectedClass);
  }

  get bookButtonValue(): string {
    const cls = this.selectedCls;
    if (cls?.error === 'BOOKINGS_OPENES_ON') {
      return `Planifică rezervare`;
    } else if (cls) {
      return `Rezervă acum !`
    } else return 'Rezervă ...';
  }

  bookClass() {
    if (!this.selectedClass) return;
    const selectedClassItem = this.selectedCls;
    if (!selectedClassItem) return;

    this.apiService.scheduleBooking(this.selectedClubId, selectedClassItem)
      .subscribe(() => {
        this.getBookings();
      });
  }

  getBookings() {
    // https://apiv2.upfit.biz/class-booking.php?json&clubid=411&id=643794
    this.scheduledBookings.set([]);
    this.apiService.getScheduledBookings().subscribe(bookings => {
      this.scheduledBookings.set(bookings.map(b => {
        const bookingDate = format(fromUnixTime(parseInt(b.scheduleTimestamp, 10)), 'PPPP, HH:mm', { locale: ro });
        return {
          taskId: b.id,
          className: `Rezervare planificată ${bookingDate}`
        };

        // const url = new URL(b.url);
        // const params = new URLSearchParams(url.search);

        // const classId = params.get('id');
        // const classItem = this._allClasses.find(c => c.id === classId);

        // const clubId = params.get('clubId');
        // const club = this.clubs().find(c => c.id === clubId)

        // if (!classItem || !club) {
        //   return {
        //     taskId: '',
        //     className: b.url
        //   }
        // }

        // return {
        //   taskId: b.id,
        //   className: `${classItem.date} - ${classItem.name} - ${club.name}`
        // };
      }))
    });
  }

  refreshBookings($event: Event) {
    $event.preventDefault();
    this.getBookings();
    return false;
  }

  deleteBooking($event: Event, taskId: string) {
    this.apiService.deleteBooking(taskId).subscribe(() => {
      this.getBookings();
    });

    $event.preventDefault();
    return false;
  }

  populateDays() {
    const today = new Date();
    const twoWeeksFromToday = addDays(today, 13);
    const datesList: string[] = [];
    for (let currentDate = today; currentDate <= twoWeeksFromToday; currentDate = addDays(currentDate, 1)) {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      datesList.push(formattedDate);
    }
    this.days.set(datesList);
  }

  getDayName(day: string) {
    const date = parse(day, 'yyyy-MM-dd', new Date());
    return format(date, 'PPPP', { locale: ro });
  }
}


bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
  ],
});
