import {getEventsMapKeyForEvent} from "../app/utils/events.util.ts";

describe('common utils', () => {
  test('getEventsMapKeyForEvent returns events key for events map', () => {
    const event = {
      summary: 'Event summary',
      start: {
        date: '2024-02-01',
      },
      end: {
        date: '2024-02-03',
      },
    };
    const key = getEventsMapKeyForEvent(event);
    const expectedKey = 'Event summary - 2024-02-01 - 2024-02-03';
    expect(key).toBe(expectedKey);
  });
});
