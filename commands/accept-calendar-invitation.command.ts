import config from 'config';

import GoogleCalendarService from '../app/services/google-calendar.service';
import log from '../app/services/log.service';

const { gcpCredentials } = config;
const GoogleCalendar = new GoogleCalendarService(gcpCredentials.clientEmail, gcpCredentials.privateKey, config.calendarId);

log.info('Accepting calendar invitation');
await GoogleCalendar.subscribeCalendar();
log.info('Finished');
