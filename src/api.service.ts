import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { ClassItem, ClubDto, Clubs, GcpTask, LoginResult, Schedule } from "./book.model";
import { Observable, map } from "rxjs";
import { sha256 } from "node-forge";
import { getUnixTime, isValid, parse } from "date-fns";

const BASE_URL = atob('aHR0cHM6Ly9hcGl2Mi51cGZpdC5iaXo=');
const TASKS_URL = 'https://europe-west3-seventh-magnet-307411.cloudfunctions.net/bookclass';
const postBody = new HttpParams().set('project', 'wcr').set('lang', '2').toString();
const postHeaders = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly httpClient = inject(HttpClient);

    private _queue = '';
    private _token = '';
    private _headers = postHeaders;
    public get token() { return this._token; }

    login(username: string, password: string): Observable<{ successful: boolean, error?: string }> {
        const creds = `email=${encodeURI(username)}&member_password=${encodeURI(password)}`;
        const url = `${BASE_URL}/authenticate.php?json&${creds}`;
        return this.httpClient.post<LoginResult>(url, postBody, { headers: postHeaders }).pipe(
            map((result) => {
                if (result.token) {
                    this._queue = sha256.create().update('bookclass_' + username).digest().toHex();
                    this._token = result.token;
                    this._headers = postHeaders.set('Auth', `Bearer ${this._token}`);
                    return { successful: true };
                } else {
                    this._queue = '';
                    this._token = '';
                    this._headers = postHeaders;
                    return { successful: false, error: result.error };
                }
            })
        );
    }

    getClubs(): Observable<ClubDto[]> {
        return this.httpClient.post<Clubs>(`${BASE_URL}/get-clubs.php?json`, postBody, { headers: this._headers })
            .pipe(
                map(clubs => {
                    const clubDtos: ClubDto[] = Object.values(clubs.clubs)
                        .map(c => {
                            const name = c.short_name.replace(atob('V29ybGQgQ2xhc3Mg'), '');
                            const tier: string =
                                Object.values(c.resources).filter(t => +t.tagid <= 5)?.[0]?.name || '';
                            return { 
                                id: c.clubid, 
                                name: `${name} ${tier ? ' (' + tier.toLowerCase() + ')' : ''}`
                            };
                        })
                        .sort((a, b) => a.name.localeCompare(b.name));
                    return clubDtos;
                })
            );
    }

    getClasses(selectedClubId: string, days: string[]): Observable<ClassItem[]> {
        const url = `${BASE_URL}/get-member-schedule.php?json&`;
        const params = new HttpParams()
            .set('clubid', selectedClubId)
            .set('type', '1')
            .set('lang', '2')
            .set('date_start', days[0])
            .set('date_end', days[days.length - 1])
            .toString();

        return this.httpClient.post<Schedule>(url + params, postBody, { headers: this._headers })
            .pipe(map(res => res.schedule));
    }

    getScheduledBookings() {
        const params = new HttpParams()
            .set('type', 'GET_TASKS')
            .set('queue', this._queue);
        return this.httpClient.get<GcpTask[]>(TASKS_URL, { params });
    }

    scheduleBooking(selectedClubId: string, selectedClass: ClassItem) {
        const scheduleDate = parse(selectedClass.open_registration, "yyyy-MM-dd HH:mm:ss", new Date());
        if (!isValid(scheduleDate)) throw new Error('Invalid class date');

        const body = {
            url: `${BASE_URL}/class-booking.php?json&clubid=${selectedClubId}&id=${selectedClass.id}`,
            headers: {
                Auth: `Bearer ${this._token}`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: btoa(postBody),
            scheduleTimestamp: getUnixTime(scheduleDate)
        };

        const params = new HttpParams()
            .set('type', 'ADD_TASK')
            .set('queue', this._queue);
        return this.httpClient.post(TASKS_URL, body, { params });
    }

    deleteBooking(taskId: string) {
        const params = new HttpParams()
            .set('type', 'DELETE_TASK')
            .set('queue', this._queue)
            .set('taskId', taskId);
        return this.httpClient.get(TASKS_URL, { params, responseType: 'text' });
    }
}