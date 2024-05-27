import GoogleCalendarService from './services/google-calendar.service.js';
import YahooService from './services/yahoo-finance.service.js';
import key from '../credentials.json' assert { type: 'json' }
const CALENDAR_ID = "2e5950f713c8ddbd7084f6cb8c50333bb3e5fde5e42d4e2beae89d712cb962fa@group.calendar.google.com";

const SYMBOLS = [
  'AAPL', 'AMZN', 'MSFT', 'NVDA', 'AMD', 'PG', 'COST', 'TXRH', 'CRM', 'SPGI', 'TWLO', 'INTU',
  'OKTA', 'ADBE', 'NET', 'AVGO', 'DDOG', 'CP', 'ZM', 'DOCU', 'AI', 'OXY', 'ROKU', 'NKE', 'GOOG',
  'EA', 'MDB', 'KO', 'SMCI', 'F', 'EA', 'META', 'TSLA', 'CAT', 'STZ', 'MA', 'V', 'TSM', 'DOCU'
];

const GoogleCalendar = new GoogleCalendarService(key.client_email, key.private_key, CALENDAR_ID);

function formatEarningsToCalendarEvent(earnings) {
  const summary = `Earnings ${earnings.symbol} - ${earnings.quarter}`;
  const history = earnings.history
    .map(({ date, actual, estimate }) => `${date}: actual: ${actual} | estimate: ${estimate}`)
    .join('\n');
  const description = `History:\n${history}`;
  const startEndData = {
    date: earnings.estimatedEarningsDate,
  };

  return {
    summary,
    description,
    start: startEndData,
    end: startEndData,
  };
}

console.log('Downloading earnings info for %s symbols', SYMBOLS.length);
const newEventDataListPromises = SYMBOLS.map(async (symbol) => {
  const earnings = await YahooService.getEarningsData(symbol);
  const newEventData = formatEarningsToCalendarEvent(earnings);
  return newEventData;
});
const newEventDataList = await Promise.all(newEventDataListPromises);

console.log('Deleting obsolete events');
const existingEvents = await GoogleCalendar.listFutureEvents();
for(const event of existingEvents) {
  const [prefix, symbol] = event.summary.split(' ');
  if (prefix === 'Earnings' && SYMBOLS.includes(symbol)) {
    await GoogleCalendar.deleteEvent(event.id)
  }
}

console.log('Creating %d events', newEventDataList.length);
for(const event of newEventDataList) {
  console.log(`Creating event for:`, event.summary);
  await GoogleCalendar.createEvent(event);
}
