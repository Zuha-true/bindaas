export const REMINDER_OPTIONS = [5, 10, 30] as const;
export const MIN_REMINDER_MINUTES = 1;
export const MAX_REMINDER_MINUTES = 24 * 60;

export interface LocationShareSession {
  active: boolean;
  startedAt: number;
  reminderMinutes: number | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: number | null;
  recipients: string[];
}

export function normalizeCustomMinutes(value: string | number): number | null {
  if (typeof value === 'string' && value.trim() === '') return null;
  const minutes = Math.round(Number(value));
  if (!Number.isFinite(minutes) || minutes < MIN_REMINDER_MINUTES || minutes > MAX_REMINDER_MINUTES) return null;
  return minutes;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

export function mapLink(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude},${longitude}`;
}

export function buildLiveLocationMessage(latitude: number, longitude: number, reminderMinutes: number | null): string {
  const reminder = reminderMinutes
    ? ` I will keep it updated until I stop sharing (reminder set for ${formatDuration(reminderMinutes)}).`
    : ' I will keep it updated until I stop sharing.';
  return `I'm sharing my live location (BINDAAS): ${mapLink(latitude, longitude)}.${reminder}`;
}

export function reminderDueAt(session: Pick<LocationShareSession, 'startedAt' | 'reminderMinutes'>): number | null {
  return session.reminderMinutes ? session.startedAt + session.reminderMinutes * 60 * 1000 : null;
}

export function isReminderDue(session: Pick<LocationShareSession, 'active' | 'startedAt' | 'reminderMinutes'>, now = Date.now()): boolean {
  const due = reminderDueAt(session);
  return Boolean(session.active && due !== null && now >= due);
}

export function elapsedLabel(startedAt: number, now = Date.now()): string {
  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function remainingLabel(session: Pick<LocationShareSession, 'active' | 'startedAt' | 'reminderMinutes'>, now = Date.now()): string | null {
  const due = reminderDueAt(session);
  if (!session.active || due === null) return null;
  const remaining = due - now;
  if (remaining <= 0) return 'Stop reminder sent. Turn sharing off when you are ready.';
  const total = Math.ceil(remaining / 1000);
  return `Stop reminder in ${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function parseShareSession(raw: string | null): LocationShareSession | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (record.active !== true) return null;
    if (typeof record.startedAt !== 'number' || !Number.isFinite(record.startedAt)) return null;
    const reminderMinutes = typeof record.reminderMinutes === 'number' && Number.isFinite(record.reminderMinutes) && record.reminderMinutes > 0 ? Math.round(record.reminderMinutes) : null;
    const latitude = typeof record.latitude === 'number' && Number.isFinite(record.latitude) ? record.latitude : null;
    const longitude = typeof record.longitude === 'number' && Number.isFinite(record.longitude) ? record.longitude : null;
    const updatedAt = typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt) ? record.updatedAt : null;
    const recipients = Array.isArray(record.recipients) ? record.recipients.filter((item): item is string => typeof item === 'string') : [];
    return { active: true, startedAt: record.startedAt, reminderMinutes, latitude, longitude, updatedAt, recipients };
  } catch {
    return null;
  }
}
