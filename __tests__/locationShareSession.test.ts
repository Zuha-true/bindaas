import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLiveLocationMessage,
  elapsedLabel,
  formatDuration,
  isReminderDue,
  normalizeCustomMinutes,
  parseShareSession,
  remainingLabel,
} from '../services/locationShareSession.ts';

test('custom reminder accepts 1 to 1440 minutes and rejects everything else', () => {
  assert.equal(normalizeCustomMinutes('5'), 5);
  assert.equal(normalizeCustomMinutes('45'), 45);
  assert.equal(normalizeCustomMinutes(1440), 1440);
  assert.equal(normalizeCustomMinutes('0'), null);
  assert.equal(normalizeCustomMinutes('-5'), null);
  assert.equal(normalizeCustomMinutes('1441'), null);
  assert.equal(normalizeCustomMinutes(''), null);
  assert.equal(normalizeCustomMinutes('abc'), null);
});

test('duration labels read naturally', () => {
  assert.equal(formatDuration(5), '5 min');
  assert.equal(formatDuration(30), '30 min');
  assert.equal(formatDuration(60), '1 hr');
  assert.equal(formatDuration(90), '1 hr 30 min');
});

test('live message links the current coordinates and the reminder', () => {
  const message = buildLiveLocationMessage(12.9716, 77.5946, 30);
  assert.ok(message.includes('https://maps.google.com/?q=12.9716,77.5946'));
  assert.ok(message.includes('until I stop sharing'));
  assert.ok(message.includes('30 min'));
  const withoutReminder = buildLiveLocationMessage(1, 2, null);
  assert.ok(withoutReminder.includes('reminder') === false);
});

test('reminder becomes due only after the chosen minutes pass', () => {
  const session = { active: true, startedAt: 1_000, reminderMinutes: 10 };
  assert.equal(isReminderDue(session, 1_000 + 9 * 60 * 1000), false);
  assert.equal(isReminderDue(session, 1_000 + 10 * 60 * 1000), true);
  assert.equal(isReminderDue({ ...session, active: false }, 1_000 + 11 * 60 * 1000), false);
  assert.equal(isReminderDue({ active: true, startedAt: 1_000, reminderMinutes: null }, 99_999), false);
});

test('remaining label counts down and then asks the user to stop', () => {
  const session = { active: true, startedAt: 0, reminderMinutes: 5 };
  assert.equal(remainingLabel(session, 0), 'Stop reminder in 5:00');
  assert.equal(remainingLabel(session, 60_000), 'Stop reminder in 4:00');
  assert.ok((remainingLabel(session, 5 * 60 * 1000) ?? '').includes('Stop reminder sent'));
});

test('elapsed label switches to hours after sixty minutes', () => {
  assert.equal(elapsedLabel(0, 65_000), '1:05');
  assert.equal(elapsedLabel(0, 60 * 60 * 1000 + 5 * 60 * 1000), '1h 5m');
});

test('stored sessions are validated before resuming', () => {
  const raw = JSON.stringify({ active: true, startedAt: 123, reminderMinutes: 10, latitude: 1.5, longitude: 2.5, updatedAt: 456, recipients: ['+91', 7] });
  const parsed = parseShareSession(raw);
  assert.ok(parsed);
  assert.deepEqual(parsed?.recipients, ['+91']);
  assert.equal(parsed?.reminderMinutes, 10);
  assert.equal(parseShareSession(null), null);
  assert.equal(parseShareSession('not json'), null);
  assert.equal(parseShareSession(JSON.stringify({ active: false, startedAt: 1 })), null);
  assert.equal(parseShareSession(JSON.stringify({ active: true })), null);
});
