import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { analyzeAccount } from '../services/lookalike.ts';

const blank = { newAccount:false, fewPosts:false, asksMoneyOrPhotos:false, copiedPhoto:false, urgentTone:false, asksToMoveApp:false };
const check = (suspect, real, checklist = blank) => analyzeAccount({ suspect, real, platform:'instagram', checklist });

test('sample detects 7 of 9 with rn/m and separator cues', () => {
  const result = check('riya.sharrna', 'riya_sharma', { ...blank, newAccount:true, fewPosts:true, copiedPhoto:true, urgentTone:true });
  assert.equal(result.foundCount, 7);
  assert.equal(result.similarityPct, 82);
  assert.equal(result.indicators.find(item => item.id === 'lookalike-letters').found, true);
  assert.match(result.indicators.find(item => item.id === 'lookalike-letters').detail, /rn/);
  assert.equal(result.indicators.find(item => item.id === 'separator-extras').found, true);
  assert.deepEqual(result.notFound, ['Asks for money or photos', 'Asks to move to another app']);
  assert.ok(result.diff.some(part => part.changed && part.text.includes('.')));
  assert.ok(result.diff.some(part => part.changed && part.text.includes('rn')));
});

test('identical handles have no automatic findings', () => {
  const result = check('riya.sharma', 'riya.sharma');
  assert.equal(result.indicators.filter(item => item.kind === 'auto' && item.found).length, 0);
});

test('digit substitution documents deterministic 1 to l mapping', () => {
  const result = check('pr1ya.k', 'priya.k');
  assert.equal(result.indicators.find(item => item.id === 'lookalike-letters').found, true);
  assert.match(result.indicators.find(item => item.id === 'lookalike-letters').detail, /number or symbol/);
});

test('Cyrillic lookalike is reported', () => {
  const result = check('mаya', 'maya');
  assert.equal(result.indicators.find(item => item.id === 'lookalike-letters').found, true);
});

test('extra suffix and number are detected', () => {
  assert.equal(check('meera.nair.official', 'meera.nair').indicators.find(item => item.id === 'separator-extras').found, true);
  assert.equal(check('meera_nair_02', 'meera.nair').indicators.find(item => item.id === 'separator-extras').found, true);
});

test('distinct handles can have no automatic matches; empty handles return a prompt', () => {
  const different = check('alpha.person', 'zebra.account');
  assert.equal(different.indicators.filter(item => item.kind === 'auto' && item.found).length, 0);
  assert.match(check('', 'known').error, /both handles/);
});

test('lookalike analysis stays local and has no network client dependency', async () => {
  const source = await readFile(new URL('../services/lookalike.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(fetch|axios|XMLHttpRequest)\b|from\s+['"](?:https?|axios|.*network)/i);
});
