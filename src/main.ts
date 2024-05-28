import { HttpClient, HttpHeaders, HttpParams, provideHttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import 'zone.js';
import { Class, ClubDto, Clubs, LoginResult, Schedule } from './book.model';
import { addDays, format, parse } from 'date-fns';
import { ro } from 'date-fns/locale';

const postBody = new HttpParams().set('project', 'wcr').set('lang', '2').toString();
const postHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './main.html',
  imports: [FormsModule]
})
export class App implements OnInit {
  private readonly httpClient = inject(HttpClient);

  private _token = '';
  private _headers = postHeaders;
  username = '';
  password = '';
  loginResult = signal('');
  loggedIn = signal(false);

  clubs = signal<ClubDto[]>([]);
  days = signal<string[]>([]);
  classes = signal<Class[]>([]);

  selectedClubId = '';
  selectedDay = '';
  _allClasses: Class[] = [];
  selectedClass = '';


  ngOnInit(): void {
    this.populateDays();
  }

  login() {
    const creds = `email=${encodeURI(this.username)}&member_password=${encodeURI(this.password)}`;
    const url = `https://apiv2.upfit.biz/authenticate.php?json&${creds}`;
    this.httpClient.post<LoginResult>(url, postBody, {headers: postHeaders}).subscribe(result => {
      if (result.token) {
        this._token = result.token;
        this._headers = postHeaders.set('Auth', `Bearer ${this._token}`);
        this.loggedIn.set(true);
        this.loginResult.set('');

        this.getClubs();
      } else {
        this._token = '';
        this._headers = postHeaders;
        this.loggedIn.set(false);
        this.loginResult.set(`Eroare ${result.error}`);
      }
    });
  }

  getClubs() {
    this.httpClient.post<Clubs>('https://apiv2.upfit.biz/get-clubs.php?json', postBody, {headers: this._headers})
      .subscribe(clubs => {
        const clubDtos: ClubDto[] = Object.values(clubs.clubs)
          .map(c => ({id: c.clubid, name: c.short_name}))
          .sort((a, b) => a.name.localeCompare(b.name));
        this.clubs.set(clubDtos);
      });
  }

  selectClub(event: any) {
    this.selectedClubId = event?.target.value;
    this.getClasses();
  }

  getClasses() {
    if (!this.selectedClubId) return;

    const url = 'https://apiv2.upfit.biz/get-member-schedule.php?json&';
    const params = new HttpParams()
      .set('clubid', this.selectedClubId)
      .set('type', '1')
      .set('lang', '2')
      .set('date_start', this.days()[0])
      .set('date_end', this.days()[this.days().length - 1])
      .toString();

    this._allClasses = [];
    this.getClassesForTheDay();
    this.httpClient.post<Schedule>(url + params, postBody, {headers: this._headers})
      .subscribe(res => {
        this._allClasses = res.schedule;
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
        (cls.can_book || cls.error === 'BOOKINGS_OPENES_ON') );
    this.classes.set(classes);
  }

  get selectedCls(): Class | undefined {
    return this._allClasses.find(c => c.id === this.selectedClass);
  }

  get bookButtonValue(): string {
    const cls = this.selectedCls;
    if (cls?.error === 'BOOKINGS_OPENES_ON') {
      return `Planifică rezervare: ${cls.error_details}`;
    } else if (cls) {
      return `Rezervă acum !`
    } else return 'Rezervă ...';
  }

  bookClass() {
    if (!this.selectedClass) return;

    console.log('Booking', this.selectedCls);
  }

  populateDays() {
    const today = new Date();
    const twoWeeksFromToday = addDays(today, 13);
    const datesList = [];
    for (let currentDate = today; currentDate <= twoWeeksFromToday; currentDate = addDays(currentDate, 1)) {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      datesList.push(formattedDate);
    }
    this.days.set(datesList);
  }

  getDayName(day: string) {
    const date = parse(day, 'yyyy-MM-dd', new Date());
    return format(date, 'PPPP', {locale: ro});
  }
}


bootstrapApplication(App, {
  providers: [
    provideHttpClient(),
  ],
});
