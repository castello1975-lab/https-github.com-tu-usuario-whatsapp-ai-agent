import "server-only";
import { google, calendar_v3 } from "googleapis";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedClientForOrg } from "./oauth";
import { getGoogleConnection } from "@/lib/db/googleConnection";
import type { BusyInterval } from "@/lib/utils/time";
import { DateTime } from "luxon";

async function getCalendarClient(supabase: SupabaseClient, orgId: string) {
  const auth = await getAuthenticatedClientForOrg(supabase, orgId);
  return google.calendar({ version: "v3", auth });
}

async function getCalendarId(supabase: SupabaseClient, orgId: string) {
  const connection = await getGoogleConnection(supabase, orgId);
  return connection?.calendar_id || "primary";
}

export async function listCalendars(supabase: SupabaseClient, orgId: string) {
  const calendar = await getCalendarClient(supabase, orgId);
  const { data } = await calendar.calendarList.list();
  return (data.items ?? []).map((item) => ({
    id: item.id!,
    summary: item.summary ?? item.id!,
    primary: !!item.primary,
  }));
}

export async function getBusyIntervals(
  supabase: SupabaseClient,
  orgId: string,
  fromIso: string,
  toIso: string
): Promise<BusyInterval[]> {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection?.access_token_encrypted) return [];

  const calendar = await getCalendarClient(supabase, orgId);
  const calendarId = await getCalendarId(supabase, orgId);

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: fromIso,
      timeMax: toIso,
      items: [{ id: calendarId }],
    },
  });

  const busy = data.calendars?.[calendarId]?.busy ?? [];
  return busy.map((b) => ({
    start: DateTime.fromISO(b.start!),
    end: DateTime.fromISO(b.end!),
  }));
}

export async function createCalendarEvent(
  supabase: SupabaseClient,
  orgId: string,
  params: {
    summary: string;
    description?: string;
    startIso: string;
    endIso: string;
    timezone: string;
  }
): Promise<string | null> {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection?.access_token_encrypted) return null;

  const calendar = await getCalendarClient(supabase, orgId);
  const calendarId = await getCalendarId(supabase, orgId);

  const event: calendar_v3.Schema$Event = {
    summary: params.summary,
    description: params.description,
    start: { dateTime: params.startIso, timeZone: params.timezone },
    end: { dateTime: params.endIso, timeZone: params.timezone },
  };

  const { data } = await calendar.events.insert({
    calendarId,
    requestBody: event,
  });
  return data.id ?? null;
}

export async function updateCalendarEvent(
  supabase: SupabaseClient,
  orgId: string,
  eventId: string,
  params: { startIso: string; endIso: string; timezone: string }
): Promise<void> {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection?.access_token_encrypted) return;

  const calendar = await getCalendarClient(supabase, orgId);
  const calendarId = await getCalendarId(supabase, orgId);

  await calendar.events.patch({
    calendarId,
    eventId,
    requestBody: {
      start: { dateTime: params.startIso, timeZone: params.timezone },
      end: { dateTime: params.endIso, timeZone: params.timezone },
    },
  });
}

export async function deleteCalendarEvent(
  supabase: SupabaseClient,
  orgId: string,
  eventId: string
): Promise<void> {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection?.access_token_encrypted) return;

  const calendar = await getCalendarClient(supabase, orgId);
  const calendarId = await getCalendarId(supabase, orgId);

  try {
    await calendar.events.delete({ calendarId, eventId });
  } catch (err) {
    console.error("No se pudo borrar el evento de Google Calendar", err);
  }
}

export async function listCalendarEvents(
  supabase: SupabaseClient,
  orgId: string,
  fromIso: string,
  toIso: string
) {
  const connection = await getGoogleConnection(supabase, orgId);
  if (!connection?.access_token_encrypted) return [];

  const calendar = await getCalendarClient(supabase, orgId);
  const calendarId = await getCalendarId(supabase, orgId);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: fromIso,
    timeMax: toIso,
    singleEvents: true,
    orderBy: "startTime",
  });

  return data.items ?? [];
}
