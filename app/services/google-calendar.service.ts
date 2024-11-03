import { calendar_v3, google } from 'googleapis';
import { getDateFromDateTime } from "../utils/common.util.ts";

export default class GoogleCalendarService {
  scopes: string[] = ['https://www.googleapis.com/auth/calendar'];
  email: string;
  key: string;
  calendarId: string;
  calendar: calendar_v3.Calendar;

  constructor(email: string, key: string, calendarId: string) {
    this.email = email;
    this.key = key;
    this.calendarId = calendarId;
    this.calendar = this.authenticate();
  }

  authenticate(): calendar_v3.Calendar {
    const auth = new google.auth.JWT(this.email, undefined, this.key, this.scopes);
    return google.calendar({version: 'v3', auth});
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.calendar.events.delete({calendarId: this.calendarId, eventId});
  }

  async clearCalendar(): Promise<void> {
    const {data: {items}} = await this.calendar.events.list({
      calendarId: this.calendarId,
      maxResults: 2500,
    });

    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.id) {
        await this.deleteEvent(item.id);
      }
    }
  }

  async subscribeCalendar() {
    await this.calendar.calendarList.insert({
      requestBody: {id: this.calendarId},
    });
  }

  async listFutureEvents(): Promise<Array<calendar_v3.Schema$Event>> {
    const offsetDate = new Date(getDateFromDateTime(new Date()));

    const result = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: offsetDate.toISOString(),
      maxResults: 2500,
    });

    return result.data.items || [];
  }

  async createEvent(requestBody: calendar_v3.Schema$Event): Promise<calendar_v3.Schema$Event> {
    const result = await this.calendar.events.insert({calendarId: this.calendarId, requestBody});
    return result.data;
  }
}
