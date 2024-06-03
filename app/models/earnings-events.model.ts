import config from 'config';
import {calendar_v3} from "googleapis";

import GoogleCalendarService from '../services/google-calendar.service';
import YahooService, { Earnings } from '../services/yahoo-finance.service';
import log from '../services/log.service';
import {getEventsMapKeyForEvent} from "../utils/events.util";
import {EventMap} from "../types/event-map.type";

const EVENT_SUMMARY_PREFIX = 'Earnings';
const EVENT_EARNINGS_HISTORY_PREFIX = 'History:';

function formatEarningsToCalendarEvent(earnings: Earnings): calendar_v3.Schema$Event {
  const summary = `${EVENT_SUMMARY_PREFIX} ${earnings.symbol} - ${earnings.quarter}` + (
    earnings.isDateEstimated ? ' - estimated' : ''
  );
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

export async function syncEarningsEvents(calendarId: string, symbols: string[]): Promise<void> {
  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);
  const existingEvents = await GoogleCalendar.listFutureEvents();

  const existingEventsMap: EventMap = existingEvents
    .filter((event) => event.summary?.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all: EventMap, event: calendar_v3.Schema$Event) => ({
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

  log.info(`Syncing ${newEventDataList.length} earnings events`);
  for (const event of newEventDataList) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event event:`, event.summary);
      delete existingEventsMap[eventMapKey];
    } else {
      log.info(`Creating event:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }

  const eventsToBeDeletedLength = Object.values(existingEventsMap).length;
  if (eventsToBeDeletedLength) {
    log.info(`Deleting ${eventsToBeDeletedLength} obsolete events`);
    for (const [eventMapKey, event] of Object.entries(existingEventsMap)) {
      if (event.id) {
        log.info(`Deleting obsolete event:`, eventMapKey);
        await GoogleCalendar.deleteEvent(event.id);
      }
    }
  }
}
