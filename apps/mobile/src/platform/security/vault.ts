import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { digest, requireThat } from '@evoloop/kernel';

import type { Identity } from '../../gateways/session-identity.ts';
export type { Identity } from '../../gateways/session-identity.ts';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
export async function readIdentity(): Promise<Identity | null> {
  const value = await SecureStore.getItemAsync('evoloop-two.identity', options);
  return value ? (JSON.parse(value) as Identity) : null;
}
export async function saveIdentity(identity: Identity): Promise<void> {
  await SecureStore.setItemAsync('evoloop-two.identity', JSON.stringify(identity), options);
}
export function databaseName(identity: Pick<Identity, 'origin' | 'accountId'>): string {
  return 'evoloop-' + digest([identity.origin, identity.accountId]) + '.db';
}
export async function databaseKey(name: string, exists: boolean): Promise<string> {
  const key = 'dbkey.' + name,
    protection = { ...options, requireAuthentication: true, authenticationPrompt: '解锁 EvoLoop 本地记录' };
  let value = await SecureStore.getItemAsync(key, protection);
  if (!value) {
    requireThat(!exists, 'LOCAL_KEY_UNAVAILABLE');
    value = Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(key, value, protection);
  }
  requireThat(/^[0-9a-f]{64}$/.test(value), 'LOCAL_KEY_INVALID');
  return value;
}
export async function deviceId(): Promise<string> {
  const saved = await SecureStore.getItemAsync('evoloop-two.device', options);
  if (saved) return saved;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync('evoloop-two.device', id, options);
  return id;
}
export async function preference(key: string, value?: string): Promise<string | null> {
  if (value !== undefined) await SecureStore.setItemAsync('preference.' + key, value, options);
  return SecureStore.getItemAsync('preference.' + key, options);
}
