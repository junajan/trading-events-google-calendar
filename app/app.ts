import config from 'config';

import log from './services/log.service';
import * as cpiEventsModel from '../app/models/cpi-events.model';
import * as dividendEventsModel from './models/dividend-events.model';
import * as earningsEventsModel from './models/earnings-events.model';
import * as fedEventsModel from '../app/models/fed-events.model';
import * as marketHolidayEventsModel from './models/market-holiday-events.model';

const DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
const SYMBOLS = [...new Set(config.symbols.split(','))];
let lastSyncYear: null | number = null;

async function syncEvents(): Promise<void> {
  const currentYear: number = new Date().getFullYear();
  if (currentYear !== lastSyncYear) {
    lastSyncYear = currentYear;

    log.info('Syncing market holiday events');
    await marketHolidayEventsModel.syncMarketHolidayEvents(config.calendarId);

    log.info('Syncing FED events');
    await fedEventsModel.syncFEDEvents(config.calendarId);
  }

  log.info('Syncing CPI events');
  await cpiEventsModel.syncCPIEvents(config.calendarId);

  log.info('Syncing dividend events');
  await dividendEventsModel.syncDividendEvents(config.calendarId, SYMBOLS);

  log.info('Syncing earning events');
  await earningsEventsModel.syncEarningsEvents(config.calendarId, SYMBOLS);
}

await syncEvents();

if (process.argv[2] !== '--single') {
  log.info('Scheduling interval');
  setInterval(syncEvents, DAY_IN_MILLIS);
}
