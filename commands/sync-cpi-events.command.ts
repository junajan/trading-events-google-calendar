import config from 'config';
import {syncCPIEvents} from '../app/models/cpi-events.model.js';

await syncCPIEvents(config.calendarId);
