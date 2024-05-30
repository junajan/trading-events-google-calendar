import config from 'config';
import * as cheerio from 'cheerio';

import GoogleCalendarService from '../services/google-calendar.service.js';
import log from '../services/log.service.js';

const CPI_SCHEDULE_URL = 'https://www.bls.gov/schedule/news_release/cpi.htm';
const EVENT_SUMMARY_PREFIX = 'CPI';

async function fetchCPIEvents() {
  const cpiEvents = [];
  const response = await fetch(CPI_SCHEDULE_URL);
  const html = await response.text();
  const $ = cheerio.load(html);

  $('table.release-list tbody tr').each(function (i, row) {
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

function getEventsMapKeyForEvent(event) {
  return `${event.summary} - ${event.start.date} - ${event.end.date}`;
}

function isCPIInFuture(event) {
  const date = new Date(event.dateString);
  const today = new Date(new Date().toISOString().slice(0, 10));

  return date > today;
}

function formatCalendarEvent(event) {
  const summary = `${EVENT_SUMMARY_PREFIX} - ${event.referenceMonth}`;
  const startEndData = {
    date: event.dateString,
  };

  return {
    summary,
    description: `Time: ${event.time} | Info: https://www.investing.com/economic-calendar/cpi-733`,
    start: startEndData,
    end: startEndData,
  };
}

export async function syncCPIEvents(calendarId, symbols) {
  const cpiEvents = await fetchCPIEvents();

  const newCPIEvents = cpiEvents
    .filter(isCPIInFuture)
    .map(formatCalendarEvent);

  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);

  const existingEvents = await GoogleCalendar.listFutureEvents();
  const existingEventsMap = existingEvents
    .filter((event) => event.summary.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all, event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: event,
    }), {});

  log.info(`Syncing ${newCPIEvents.length} events`);
  for (const event of newCPIEvents) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event event:`, event.summary);
    } else {
      log.info(`Creating event:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }
}
