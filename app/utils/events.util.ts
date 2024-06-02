import {calendar_v3} from "googleapis";

export function getEventsMapKeyForEvent(event: calendar_v3.Schema$Event): string {
  return `${event.summary} - ${event.start?.date} - ${event.end?.date}`;
}
