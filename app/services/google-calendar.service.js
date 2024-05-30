import { google } from 'googleapis';

export default class GoogleCalendarService {
  static scopes = ['https://www.googleapis.com/auth/calendar'];

  constructor(email, key, calendarId) {
    this.email = email;
    this.key = key;
    this.calendarId = calendarId;
    this.calendar = this.authenticate();
  }

  authenticate() {
    const auth = new google.auth.JWT(this.email, null, this.key, GoogleCalendarService.scopes);
    return google.calendar({ version: 'v3', auth });
  }

  async deleteEvent(eventId) {
    await this.calendar.events.delete({ calendarId: this.calendarId, eventId });
  }

  async clearCalendar() {
    const { data: { items } } = await this.calendar.events.list({
      calendarId: this.calendarId,
      maxResults: 2500,
    });

    for (const item of items) {
      await this.deleteEvent(item.id);
    }
  }

  async subscribeCalendar() {
    await this.calendar.calendarList.insert({
      resource: { id: this.calendarId },
    });
  }

  async listFutureEvents() {
    const offsetDate = new Date();
    offsetDate.setTime(0);

    const result = await this.calendar.events.list({
      calendarId: this.calendarId,
      timeMin: offsetDate.toISOString(),
      maxResults: 2500,
    });
    return result.data.items;
  }

  async createEvent(resource) {
    const result = await this.calendar.events.insert({ calendarId: this.calendarId , resource });
    return result.data;
  }
}
