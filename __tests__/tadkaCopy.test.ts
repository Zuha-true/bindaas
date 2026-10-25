import test from 'node:test';
import assert from 'node:assert/strict';
import { tadkaCopy, tadkaRecipes, TADKA_BANNED } from '../data/tadkaRecipes.ts';

test('Tadka screen copy, recipe names, blurbs, and notifications avoid the disallowed terms', () => {
  const values = [
    ...Object.values(tadkaCopy).flatMap(value => Array.isArray(value) ? value : [value]),
    ...tadkaRecipes.flatMap(recipe => [recipe.title, recipe.blurb]),
  ];
  const violations = values.flatMap(value => typeof value === 'string'
    ? TADKA_BANNED.filter(term => value.toLowerCase().includes(term)).map(term => `${term}: ${value}`)
    : []);
  assert.deepEqual(violations, []);
});

test('the sensitive help desk details exist only under the help desk copy key', () => {
  assert.deepEqual(tadkaCopy.accountHelpDesk, ['Kitchen help desk', '1930 · cybercrime.gov.in']);
  const otherCopy = Object.entries(tadkaCopy).filter(([key]) => key !== 'accountHelpDesk').map(([, value]) => JSON.stringify(value)).join(' ');
  assert.equal(otherCopy.includes('1930') || otherCopy.includes('cybercrime.gov.in'), false);
});
