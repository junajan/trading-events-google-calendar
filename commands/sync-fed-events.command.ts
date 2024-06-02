import config from 'config';
import {syncFEDEvents} from '../app/models/fed-events.model.js';

await syncFEDEvents(config.calendarId);
