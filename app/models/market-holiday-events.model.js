import config from 'config';
import nyseHolidays from 'nyse-holidays';

import GoogleCalendarService from '../services/google-calendar.service.js';
import log from '../services/log.service.js';

const EVENT_SUMMARY_PREFIX = 'Market holiday';

function getEventsMapKeyForEvent(event) {
  return `${event.summary} - ${event.start.date} - ${event.end.date}`;
}
function isHolidayInFuture(holiday) {
  const holidayDate = new Date(holiday.dateString);
  const today = new Date(new Date().toISOString().slice(0,10));

  return holidayDate > today;
}

function formatHolidayToCalendarEvent(holiday) {
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

export async function syncMarketHolidayEvents(calendarId, symbols) {
  const currentYear = new Date().getFullYear();
  const holidays = nyseHolidays.getHolidays(currentYear);
  const newHolidayEvents = holidays
    .filter(isHolidayInFuture)
    .map(formatHolidayToCalendarEvent);

  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);

  const existingEvents = await GoogleCalendar.listFutureEvents();
  const existingEventsMap = existingEvents
    .filter((event) => event.summary.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all, event) => ({
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
