export function getDateFromDateTime(dateTime: Date): string {
  const date: string = dateTime.toISOString();
  return date.substring(0, date.indexOf('T'));
}
