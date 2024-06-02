import config from 'config';
import {syncDividendEvents} from '../app/models/dividend-events.model.js';

const symbols = [...new Set(config.symbols.split(','))];
await syncDividendEvents(config.calendarId, symbols);
