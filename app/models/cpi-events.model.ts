import config from 'config';
import {calendar_v3} from 'googleapis';
import * as cheerio from 'cheerio';

import GoogleCalendarService from '../services/google-calendar.service';
import log from '../services/log.service';
import {getEventsMapKeyForEvent} from "../utils/events.util";
import {EventMap} from "../types/event-map.type";

const CPI_SCHEDULE_URL = 'https://www.bls.gov/schedule/news_release/cpi.htm';
const EVENT_SUMMARY_PREFIX = 'CPI';

interface CpiEvent {
  date: Date,
  dateOriginal: string,
  dateString: string,
  referenceMonth: string,
  time: string,
}

async function fetchCPIEvents(): Promise<CpiEvent[]> {
  const cpiEvents: CpiEvent[] = [];
  const response = await fetch(CPI_SCHEDULE_URL);
  const html = await response.text();
  const $ = cheerio.load(html);

  $('table.release-list tbody tr').each(function (i: number, row) {
    const cells = $(row).find('td');
    const dateOriginal = $(cells[1]).text();
    let date = new Date(dateOriginal);

    // shift to UTC timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    cpiEvents.push({
      date,
      dateOriginal,
      dateString: date.toISOString().slice(0, 10),
      referenceMonth: $(cells[0]).text(),
      time: $(cells[2]).text(),
    });
  });

  return cpiEvents;
}

function isCPIEventInFuture(event: CpiEvent): boolean {
  const date = new Date(event.dateString);
  const today = new Date(new Date().toISOString().slice(0, 10));

  return date > today;
}

function formatCPIEventToCalendarEvent(event: CpiEvent): calendar_v3.Schema$Event {
  const summary = `${EVENT_SUMMARY_PREFIX} - ${event.referenceMonth}`;
  const startEndData = {
    date: event.dateString,
  };

  return {
    description: `Time: ${event.time} | Info: https://www.investing.com/economic-calendar/cpi-733`,
    end: startEndData,
    start: startEndData,
    summary,
  };
}

export async function syncCPIEvents(calendarId: string): Promise<void> {
  const cpiEvents = await fetchCPIEvents();
  const newCPIEvents = cpiEvents
    .filter(isCPIEventInFuture)
    .map(formatCPIEventToCalendarEvent);

  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);

  const existingEvents = await GoogleCalendar.listFutureEvents();
  const existingEventsMap: EventMap = existingEvents
    .filter((event) => event.summary?.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all: EventMap, event: calendar_v3.Schema$Event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: event,
    }), {});

  log.info(`Syncing ${newCPIEvents.length} CPI events`);
  for (const event of newCPIEvents) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event:`, event.summary);
    } else {
      log.info(`Creating event:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }
}
