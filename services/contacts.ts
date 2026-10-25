import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Platform } from './lookalike';

export interface TrustedContact {
  name: string;
  phone: string;
  handle?: string;
  platformHandles?: Partial<Record<Platform, string>>;
}

const CONTACTS_KEY = 'contacts:v1';

function isContact(value: unknown): value is TrustedContact {
  if (typeof value !== 'object' || value === null) return false;
  const contact = value as Record<string, unknown>;
  return typeof contact.name === 'string' && typeof contact.phone === 'string'
    && (contact.handle === undefined || typeof contact.handle === 'string')
    && (contact.platformHandles === undefined || (typeof contact.platformHandles === 'object' && contact.platformHandles !== null));
}

export function isContactList(value: unknown): value is TrustedContact[] {
  return Array.isArray(value) && value.every(isContact);
}

export async function readTrustedContacts(): Promise<TrustedContact[]> {
  const stored = await AsyncStorage.getItem(CONTACTS_KEY);
  if (!stored) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    return isContactList(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeTrustedContacts(contacts: TrustedContact[]): Promise<void> {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}
