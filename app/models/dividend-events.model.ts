import config from 'config';
import {calendar_v3} from "googleapis";

import GoogleCalendarService from '../services/google-calendar.service';
import YahooService, { Dividend } from '../services/yahoo-finance.service';
import log from '../services/log.service';
import {getEventsMapKeyForEvent} from "../utils/events.util";
import {EventMap} from "../types/event-map.type";

const EVENT_SUMMARY_PREFIX = 'ExDividend';

function formatDividendToCalendarEvent(dividend: Dividend): calendar_v3.Schema$Event {
  const startEndData = {
    date: dividend.exDividendDate.toISOString().slice(0, 10),
  };
  const summary = `${EVENT_SUMMARY_PREFIX} ${dividend.symbol} - ${dividend.rateQuarterly} ${dividend.currency}` + (
    dividend.isDateEstimated ? ' - estimated' : ''
  );
  const description = `ExDividend date: ${dividend.exDividendDate.toISOString().slice(0, 10)}\n`
    + `Payment date: ${dividend.paymentDate.toISOString().slice(0, 10)}`;

  return {
    summary,
    description,
    start: startEndData,
    end: startEndData,
  };
}

export async function syncDividendEvents(calendarId: string, symbols: string[]): Promise<void> {
  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);
  const existingEvents = await GoogleCalendar.listFutureEvents();

  const existingEventsMap: EventMap = existingEvents
    .filter((event) => event.summary?.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all: EventMap, event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: {
        ...event,
        toBeDeleted: true,
      },
    }), {});

  log.info(`Downloading dividend info for ${symbols.length} symbols`);
  const newEventDataListPromises = symbols.map(async (symbol) => {
    const dividend = await YahooService.getDividendData(symbol);
    return dividend && formatDividendToCalendarEvent(dividend);
  });
  const newEventDataList = (await Promise.all(newEventDataListPromises))
    .filter<calendar_v3.Schema$Event>((event): event is calendar_v3.Schema$Event => (
      !!event?.start?.date && new Date(event.start.date) > new Date()
    ));

  log.info(`Syncing ${newEventDataList.length} dividend events`);
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
    log.info(`Deleting ${eventsToBeDeletedLength} obsolete dividend events`);
    for (const [eventMapKey, event] of Object.entries(existingEventsMap)) {
      if (event.id) {
        log.info(`Deleting obsolete event:`, eventMapKey);
        await GoogleCalendar.deleteEvent(event.id);
      }
    }
  }
}
