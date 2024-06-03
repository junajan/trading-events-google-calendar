import config from 'config';

import {syncCPIEvents} from '../app/models/cpi-events.model';

await syncCPIEvents(config.calendarId);
