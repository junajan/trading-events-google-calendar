import config from 'config';

import {syncMarketHolidayEvents} from '../app/models/market-holiday-events.model';

await syncMarketHolidayEvents(config.calendarId);
