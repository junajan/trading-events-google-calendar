import config from 'config';
import * as cheerio from 'cheerio';

import GoogleCalendarService from '../services/google-calendar.service.js';
import log from '../services/log.service.js';

const FED_SCHEDULE_URL = 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm';
const EVENT_SUMMARY_PREFIX = 'FED';

async function fetchFEDEvents() {
  const fedEvents = [];
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

function getEventsMapKeyForEvent(event) {
  return `${event.summary} - ${event.start.date} - ${event.end.date}`;
}

function isFEDInFuture(event) {
  const date = new Date(event.dateString);
  const today = new Date(new Date().toISOString().slice(0, 10));

  return date > today;
}

function formatCalendarEvent(event) {
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

export async function syncFEDEvents(calendarId, symbols) {
  const fedEvents = await fetchFEDEvents();

  const newFEDEvents = fedEvents
    .filter(isFEDInFuture)
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
