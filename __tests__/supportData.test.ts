import test from 'node:test';
import assert from 'node:assert/strict';
import { supportScenarios } from '../data/support.ts';

test('support scenario ids are unique and each topic has offline steps plus a way to reach out', () => {
  const ids = supportScenarios.map(scenario => scenario.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const scenario of supportScenarios) {
    assert.ok(scenario.firstSteps.length > 0, `${scenario.id} has first steps`);
    assert.ok(scenario.numbers.length > 0 || scenario.links.length > 0, `${scenario.id} has a number or useful link`);
  }
});

test('numbers marked for review remain unverified in support data', () => {
  const allNumbers = supportScenarios.flatMap(scenario => scenario.numbers);
  for (const label of ['108','1091','14416','15100']) assert.equal(allNumbers.find(item => item.number === label)?.verified, false);
  assert.equal(supportScenarios.flatMap(scenario => scenario.links).find(item => item.id === 'shebox')?.verified, false);
});
