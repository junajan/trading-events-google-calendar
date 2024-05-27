import config from 'config';

import GoogleCalendarService from '../services/google-calendar.service.js';
import YahooService from '../services/yahoo-finance.service.js';
import log from '../services/log.service.js';

const EVENT_SUMMARY_PREFIX = 'Earnings';
const EVENT_EARNINGS_HISTORY_PREFIX = 'History:';

function getEventsMapKeyForEvent(event) {
  return `${event.summary} - ${event.start.date} - ${event.end.date}`;
}

function formatEarningsToCalendarEvent(earnings) {
  const summary = `${EVENT_SUMMARY_PREFIX} ${earnings.symbol} - ${earnings.quarter}`;
  const history = earnings.history
    .map(({date, actual, estimate}) => `${date}: actual: ${actual} | estimate: ${estimate}`)
    .join('\n');
  const description = `${EVENT_EARNINGS_HISTORY_PREFIX}\n${history}`;
  const startEndData = {
    date: earnings.estimatedEarningsDate,
  };

  return {
    summary,
    description,
    start: startEndData,
    end: startEndData,
  };
}

export async function syncEarningsEvents(calendarId, symbols) {
  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);
  const existingEvents = await GoogleCalendar.listFutureEvents();

  const existingEventsMap = existingEvents
    .filter((event) => event.summary.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all, event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: {
        ...event,
        toBeDeleted: true,
      },
    }), {});

  log.info(`Downloading earnings info for ${symbols.length} symbols`);
  const newEventDataListPromises = symbols.map(async (symbol) => {
    const earnings = await YahooService.getEarningsData(symbol);
    return formatEarningsToCalendarEvent(earnings);
  });
  const newEventDataList = await Promise.all(newEventDataListPromises);

  log.info(`Syncing ${newEventDataList.length} events`);
  for (const event of newEventDataList) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event event for:`, event.summary);
      delete existingEventsMap[eventMapKey];
    } else {
      log.info(`Creating event for:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }

  const eventsToBeDeletedLength = Object.values(existingEventsMap).length;
  if (eventsToBeDeletedLength) {
    log.info(`Deleting ${eventsToBeDeletedLength} obsolete event:`, eventMapKey);
    for (const [eventMapKey, event] of Object.entries(existingEventsMap)) {
      log.info(`Deleting obsolete event:`, eventMapKey);
      await GoogleCalendar.deleteEvent(event.id);
    }
  }
}
