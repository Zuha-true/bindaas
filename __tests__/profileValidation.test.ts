import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProfile } from '../services/profileValidation.ts';

test('profile validation requires a name and a 7–15 digit phone with optional plus prefix', () => {
  assert.equal(validateProfile({ name: '', phone: '1234567', email: '' }), 'Enter your name.');
  assert.equal(validateProfile({ name: 'Asha', phone: '123456', email: '' }), 'Enter a phone number with 7 to 15 digits.');
  assert.equal(validateProfile({ name: 'Asha', phone: '1234567890123456', email: '' }), 'Enter a phone number with 7 to 15 digits.');
  assert.equal(validateProfile({ name: 'Asha', phone: '+919876543210', email: '' }), null);
  assert.equal(validateProfile({ name: 'Asha', phone: '919876543210', email: '' }), null);
});

test('email is optional but validated when supplied', () => {
  assert.equal(validateProfile({ name: 'Asha', phone: '1234567', email: '' }), null);
  assert.equal(validateProfile({ name: 'Asha', phone: '1234567', email: 'bad-address' }), 'Enter a valid email address or leave it blank.');
  assert.equal(validateProfile({ name: 'Asha', phone: '1234567', email: 'asha@example.org' }), null);
});
