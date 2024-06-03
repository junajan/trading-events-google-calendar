import config from 'config';
import nyseHolidays, { Holiday } from 'nyse-holidays';

import GoogleCalendarService from '../services/google-calendar.service';
import log from '../services/log.service';
import {getEventsMapKeyForEvent} from "../utils/events.util";
import {calendar_v3} from "googleapis";
import {EventMap} from "../types/event-map.type";

const EVENT_SUMMARY_PREFIX = 'Market holiday';

function isHolidayInFuture(holiday: Holiday): boolean {
  const holidayDate = new Date(holiday.dateString);
  const today = new Date(new Date().toISOString().slice(0,10));

  return holidayDate > today;
}

function formatHolidayToCalendarEvent(holiday: Holiday): calendar_v3.Schema$Event {
  const summary = `${EVENT_SUMMARY_PREFIX} - ${holiday.name}`;
  const startEndData = {
    date: holiday.dateString,
  };

  return {
    summary,
    description: '',
    start: startEndData,
    end: startEndData,
  };
}

export async function syncMarketHolidayEvents(calendarId: string): Promise<void> {
  const currentYear = new Date().getFullYear();
  const holidays = nyseHolidays.getHolidays(currentYear);
  const newHolidayEvents = holidays
    .filter(isHolidayInFuture)
    .map(formatHolidayToCalendarEvent);

  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);

  const existingEvents = await GoogleCalendar.listFutureEvents();
  const existingEventsMap: EventMap = existingEvents
    .filter((event) => event.summary?.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all: EventMap, event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: event,
    }), {});

  log.info(`Syncing ${newHolidayEvents.length} events`);
  for (const event of newHolidayEvents) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event event:`, event.summary);
    } else {
      log.info(`Creating event:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }
}
