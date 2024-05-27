export function getDateFromDateTime(dateTime) {
  const date = new Date(dateTime).toISOString();
  return date.substring(0, date.indexOf('T'));
}
