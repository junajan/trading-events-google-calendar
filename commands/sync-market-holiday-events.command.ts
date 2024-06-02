import config from 'config';
import {syncMarketHolidayEvents} from '../app/models/market-holiday-events.model.js';

await syncMarketHolidayEvents(config.calendarId);
