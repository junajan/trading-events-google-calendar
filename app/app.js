import config from 'config';
import log from './services/log.service.js';
import {syncEarningsEvents} from './models/earnings-events.model.js';

const DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
const SYMBOLS = [...new Set(config.symbols.split(','))];

async function main() {
  log.info('Syncing earning events');
  await syncEarningsEvents(config.calendarId, SYMBOLS);
}

await main();
setInterval(main, DAY_IN_MILLIS);
