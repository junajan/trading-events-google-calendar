import config from 'config';
import {syncEarningsEvents} from '../app/models/earnings-events.model.js';

const symbols = [...new Set(config.symbols.split(','))];
await syncEarningsEvents(config.calendarId, symbols);
