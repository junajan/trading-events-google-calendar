import {getDateFromDateTime} from '../app/utils/common.util';

describe('events utils', () => {
  test('getDateFromDateTime returns date from date object', () => {
    expect(getDateFromDateTime(new Date('2024-01-01T12:34:56Z'))).toBe('2024-01-01');
  });
});
