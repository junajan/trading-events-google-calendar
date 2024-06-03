import config from 'config';

import {syncFEDEvents} from '../app/models/fed-events.model';

await syncFEDEvents(config.calendarId);
