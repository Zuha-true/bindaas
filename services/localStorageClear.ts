export interface KeyValueStore {
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiRemove(keys: readonly string[]): Promise<void>;
}

export async function clearSessionOnly(store: Pick<KeyValueStore, 'removeItem'>): Promise<void> {
  await store.removeItem('session:v1');
}

export async function clearEveryStoredKey(store: Pick<KeyValueStore, 'getAllKeys'|'multiRemove'>): Promise<readonly string[]> {
  const keys = await store.getAllKeys();
  if (keys.length) await store.multiRemove(keys);
  return keys;
}
