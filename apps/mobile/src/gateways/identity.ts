import {
  accountResultSchema,
  accountSnapshotSchema,
  sessionResultSchema,
  registrationSchema,
} from '@evoloop/contracts';
import { requireThat } from '@evoloop/kernel';
import type { Identity } from './session-identity.ts';
import { HttpClient } from '../platform/network/http.ts';

export async function signIn(http: HttpClient, username: string, password: string): Promise<Identity> {
  const session = await http.call('POST', '/api/v2/identity/sessions/password', sessionResultSchema, {
    username,
    password,
    device: 'EvoLoop iOS',
  });
  const authorized = http.withCredential(session.credential);
  const account = await authorized.call('GET', '/api/v2/identity/session', accountSnapshotSchema);
  requireThat(account.accountId === session.accountId, 'ACCOUNT_MISMATCH');
  return { origin: http.origin, ...session, ...account };
}
export async function register(http: HttpClient, username: string, password: string, repeated: string) {
  requireThat(password === repeated, '两次密码不一致');
  const input = registrationSchema.parse({ username, password, declarationVersion: 'registration-v1' });
  return http.call('POST', '/api/v2/identity/accounts', accountResultSchema, input);
}
export async function refreshIdentity(http: HttpClient, previous: Identity): Promise<Identity> {
  const account = await http.call('GET', '/api/v2/identity/session', accountSnapshotSchema);
  requireThat(previous.accountId === account.accountId, 'ACCOUNT_MISMATCH');
  return { ...previous, ...account };
}
