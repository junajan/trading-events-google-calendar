import config from 'config';
import * as cheerio from 'cheerio';

import GoogleCalendarService from '../services/google-calendar.service';
import log from '../services/log.service';
import {getEventsMapKeyForEvent} from "../utils/events.util";
import {EventMap} from "../types/event-map.type";
import {calendar_v3} from "googleapis";

const FED_SCHEDULE_URL = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
const EVENT_SUMMARY_PREFIX = 'FED';

type FedEvent = {
  date: Date,
  dateString: string,
  isSummaryOfEconomicProjections: boolean,
}

async function fetchFEDEvents() {
  const fedEvents: FedEvent[] = [];
  const currentYear = new Date().getFullYear();
  const response = await fetch(FED_SCHEDULE_URL);
  const html = await response.text();
  const $ = cheerio.load(html);

  const rows = $('#article .panel-default:first .fomc-meeting');

  rows.each(function (i, row) {
    const monthRaw = $(row).find('.fomc-meeting__month').text();
    const month = monthRaw.includes('/')
      ? monthRaw.split('/')[1]
      : monthRaw.substring(0, 3);

    const dayRaw = $(row).find('.fomc-meeting__date').text();
    const isSummaryOfEconomicProjections = dayRaw.includes('*');

    const day = dayRaw.replace('*', '').split('-')[1];

    const date = new Date(`${day} ${month} ${currentYear}`);
    // shift to UTC timezone
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    fedEvents.push({
      date,
      dateString: date.toISOString().slice(0, 10),
      isSummaryOfEconomicProjections,
    });
  });

  return fedEvents;
}

function isFEDInFuture(event: FedEvent): boolean {
  const date = new Date(event.dateString);
  const today = new Date(new Date().toISOString().slice(0, 10));

  return date > today;
}

function formatCalendarEvent(event: FedEvent): calendar_v3.Schema$Event {
  const summary = `${EVENT_SUMMARY_PREFIX}` + (event.isSummaryOfEconomicProjections ? ' - Projection' : '');
  const startEndData = {
    date: event.dateString,
  };

  return {
    summary,
    description: `Info: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm`,
    start: startEndData,
    end: startEndData,
  };
}

export async function syncFEDEvents(calendarId: string): Promise<void> {
  const fedEvents = await fetchFEDEvents();

  const newFEDEvents = fedEvents
    .filter(isFEDInFuture)
    .map(formatCalendarEvent);

  const {gcpCredentials} = config;
  const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, calendarId);

  const existingEvents = await GoogleCalendar.listFutureEvents();
  const existingEventsMap: EventMap = existingEvents
    .filter((event) => event.summary?.startsWith(EVENT_SUMMARY_PREFIX))
    .reduce((all: EventMap, event) => ({
      ...all,
      [getEventsMapKeyForEvent(event)]: event,
    }), {});

  log.info(`Syncing ${newFEDEvents.length} FED events`);
  for (const event of newFEDEvents) {
    const eventMapKey = getEventsMapKeyForEvent(event);
    if (existingEventsMap[eventMapKey]) {
      log.info(`Persisting existing event:`, event.summary);
    } else {
      log.info(`Creating event:`, event.summary);
      await GoogleCalendar.createEvent(event);
    }
  }
}
