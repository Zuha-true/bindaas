import assert from 'node:assert/strict';
import test from 'node:test';
import { statusAt } from '../services/route/hours.ts';

const local = (day: number, hour: number, minute = 0) => new Date(2026, 0, day, hour, minute);

test('applies unprefixed opening hours every day using local time', () => {
  assert.equal(statusAt('11:00-23:00', local(4, 12)), 'open'); // Sunday
  assert.equal(statusAt('11:00-23:00', local(6, 10)), 'closed'); // Tuesday
});

test('supports weekday ranges and wraps overnight hours into the next day', () => {
  const hours = 'Mo-Th 11:30-01:00; Fr-Su 09:00-01:00';
  assert.equal(statusAt(hours, local(6, 0, 30)), 'open'); // Tuesday, from Monday
  assert.equal(statusAt(hours, local(6, 12)), 'open');
  assert.equal(statusAt(hours, local(11, 2)), 'closed'); // Sunday after Saturday's overnight span
});

test('supports weekday lists, multiple intervals, and midnight end times', () => {
  assert.equal(statusAt('Mo,We,Fr 08:00-12:00', local(6, 9)), 'closed');
  assert.equal(statusAt('Mo,We,Fr 08:00-12:00', local(7, 9)), 'open');
  const split = 'Mo-Fr 12:00-16:00,18:00-00:00; Sa-Su 12:00-24:00';
  assert.equal(statusAt(split, local(6, 17)), 'closed');
  assert.equal(statusAt(split, local(6, 23, 45)), 'closing_soon');
  assert.equal(statusAt(split, local(10, 23, 45)), 'closing_soon');
});

test('handles closed rules, always open, and unparseable hours', () => {
  assert.equal(statusAt('Mo-Su off', local(6, 12)), 'closed');
  assert.equal(statusAt('24/7', local(6, 12)), 'open');
  assert.equal(statusAt('hours vary', local(6, 12)), 'unknown');
  assert.equal(statusAt('Mo-Su 25:00-26:00', local(6, 12)), 'unknown');
  assert.equal(statusAt(undefined, local(6, 12)), 'unknown');
});
