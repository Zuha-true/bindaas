import test from 'node:test';
import assert from 'node:assert/strict';
import { clearEveryStoredKey, clearSessionOnly, type KeyValueStore } from '../services/localStorageClear.ts';

function memoryStore(seed: Record<string, string>) {
  const data = new Map(Object.entries(seed));
  const removed: string[][] = [];
  const store: KeyValueStore = {
    async removeItem(key) { data.delete(key); },
    async getAllKeys() { return [...data.keys()]; },
    async multiRemove(keys) { removed.push([...keys]); keys.forEach(key => data.delete(key)); },
  };
  return { store, data, removed };
}

test('ordinary log out removes only session:v1', async () => {
  const { store, data } = memoryStore({ 'session:v1': 'active', 'profile:v1': '{}', 'contacts:v1': '[]', 'evidence:v1': '[]' });
  await clearSessionOnly(store);
  assert.equal(data.has('session:v1'), false);
  assert.equal(data.has('profile:v1'), true);
  assert.equal(data.has('contacts:v1'), true);
  assert.equal(data.has('evidence:v1'), true);
});

test('erase removes every stored key, including the requested profile and app records', async () => {
  const keys = ['profile:v1','contacts:v1','settings:v1','evidence:v1','accountchecks:v1','sos:log:v1','fakecall:v1','session:v1','route:selected:v1','trip:active:v1'];
  const { store, data, removed } = memoryStore(Object.fromEntries(keys.map(key => [key,'value'])));
  const erased = await clearEveryStoredKey(store);
  assert.deepEqual(erased, keys);
  assert.equal(data.size, 0);
  assert.deepEqual(removed[0], keys);
});
