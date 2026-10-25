export interface ProfileFields { name: string; phone: string; email: string; photoUri: string | null }

export function validateProfile(fields: Pick<ProfileFields, 'name'|'phone'|'email'>): string | null {
  if (!fields.name.trim()) return 'Enter your name.';
  if (!/^\+?[0-9]{7,15}$/.test(fields.phone.trim())) return 'Enter a phone number with 7 to 15 digits.';
  if (fields.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return 'Enter a valid email address or leave it blank.';
  return null;
}
