import config from 'config';

import log from './services/log.service.js';
import * as cpiEventsModel from '../app/models/cpi-events.model.js';
import * as earningsEventsModel from './models/earnings-events.model.js';
import * as fedEventsModel from '../app/models/fed-events.model.js';
import * as marketHolidayEventsModel from './models/market-holiday-events.model.js';

const DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
const SYMBOLS = [...new Set(config.symbols.split(','))];
let lastSyncYear = null;

async function syncEarningsEvents() {
  const currentYear = new Date().getFullYear();
  if (currentYear !== lastSyncYear) {
    lastSyncYear = currentYear;

    log.info('Syncing market holiday events');
    await marketHolidayEventsModel.syncMarketHolidayEvents(config.calendarId);

    log.info('Syncing FED events');
    await fedEventsModel.syncFEDEvents(config.calendarId);
  }

  log.info('Syncing CPI events');
  await cpiEventsModel.syncCPIEvents(config.calendarId);

  log.info('Syncing earning events');
  await earningsEventsModel.syncEarningsEvents(config.calendarId, SYMBOLS);
}

await cpiEventsModel.syncCPIEvents(config.calendarId);
await marketHolidayEventsModel.syncMarketHolidayEvents(config.calendarId);
await earningsEventsModel.syncEarningsEvents(config.calendarId, SYMBOLS);


log.info('Scheduling interval');
setInterval(syncEarningsEvents, DAY_IN_MILLIS);
