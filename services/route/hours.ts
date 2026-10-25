import type { PlaceStatus } from '../../types/route.ts';

const dayNames = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;
const dayIndex = (day: string) => dayNames.findIndex(value => value.toLowerCase() === day.toLowerCase());
type Rule = { days: number[] | null; schedule: string };

function parseRules(hours: string): Rule[] {
  const rules: Rule[] = [];
  for (const part of hours.split(';').map(value => value.trim()).filter(Boolean)) {
    const match = part.match(/^((?:Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))?(?:\s*,\s*(?:Mo|Tu|We|Th|Fr|Sa|Su))*)\s+(.+)$/i);
    if (!match) {
      rules.push({ days: null, schedule: part });
      continue;
    }
    const selected = new Set<number>();
    for (const item of match[1].split(',')) {
      const range = item.trim().match(/^(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?$/i);
      if (!range) continue;
      const start = dayIndex(range[1]);
      const end = dayIndex(range[2] || range[1]);
      if (start < 0 || end < 0) continue;
      for (let index = start, count = 0; count < 7; index = (index + 1) % 7, count++) {
        selected.add(index);
        if (index === end) break;
      }
    }
    if (selected.size) rules.push({ days: [...selected], schedule: match[2] });
  }
  return rules;
}

function intervals(schedule: string): Array<{ start: number; end: number }> {
  return [...schedule.matchAll(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/g)].flatMap(match => {
    const startHour = Number(match[1]), startMinute = Number(match[2]);
    const endHour = Number(match[3]), endMinute = Number(match[4]);
    if (startHour > 23 || endHour > 24 || startMinute > 59 || endMinute > 59 || (endHour === 24 && endMinute !== 0)) return [];
    const start = startHour * 60 + startMinute;
    let end = endHour * 60 + endMinute;
    if (end === 0 || end === 1440) end = 1440;
    return [{ start, end }];
  });
}

export function statusAt(hours: string | undefined, at: Date): PlaceStatus {
  if (!hours?.trim()) return 'unknown';
  if (hours.trim().toLowerCase() === '24/7') return 'open';
  const rules = parseRules(hours);
  const weekday = (at.getDay() + 6) % 7;
  const previousDay = (weekday + 6) % 7;
  const now = at.getHours() * 60 + at.getMinutes();
  const todayRules = rules.filter(rule => rule.days === null || rule.days.includes(weekday));
  const previousRules = rules.filter(rule => rule.days === null || rule.days.includes(previousDay));
  const todayIntervals = todayRules.flatMap(rule => intervals(rule.schedule));
  const previousOvernight = previousRules.flatMap(rule => intervals(rule.schedule).filter(({ start, end }) => end < start));
  const openUntil = todayIntervals.find(({ start, end }) => end > start && now >= start && now < end)
    || todayIntervals.find(({ start, end }) => end < start && now >= start)
    || previousOvernight.find(({ end }) => now < end);
  if (openUntil) {
    const end = openUntil.end < openUntil.start || openUntil.end === openUntil.start ? openUntil.end + 1440 : openUntil.end;
    return end - now <= 30 ? 'closing_soon' : 'open';
  }
  const hasRecognizedSchedule = rules.some(rule => intervals(rule.schedule).length > 0 || /\b(off|closed)\b/i.test(rule.schedule));
  if (!hasRecognizedSchedule) return 'unknown';
  if (!todayRules.length && !previousOvernight.length) return rules.some(rule => rule.days !== null) ? 'closed' : 'unknown';
  return 'closed';
}

export function passDate(departAt: number, alongM: number, routeM: number, durationMin: number) {
  return new Date(departAt + (alongM / Math.max(routeM, 1)) * durationMin * 60000);
}
