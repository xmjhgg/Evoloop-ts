import { randomUUID } from 'node:crypto';
import { MemoryStore, setup, fixedNow } from '../fixtures/local.ts';
import { LocalGateway } from '../../apps/mobile/src/gateways/local.ts';
import { HttpClient } from '../../apps/mobile/src/platform/network/http.ts';
import type { RequestPort } from '../../apps/mobile/src/platform/network/http.ts';
import type { AiBookmark, TaskStore } from '../../apps/mobile/src/gateways/ports.ts';
import type { ImageAsset, AssetStore } from '../../apps/mobile/src/gateways/assets.ts';
import { commandSession } from '../../apps/mobile/src/gateways/command-session.ts';
import { formSession } from '@evoloop/client-model';
import type { FormSpec } from '@evoloop/client-model';

export function technicalStores() {
  const bookmarks = new Map<string, AiBookmark>(),
    images = new Map<string, ImageAsset>();
  const tasks: TaskStore = {
    async get(key) {
      return bookmarks.get(key) ?? null;
    },
    async all() {
      return [...bookmarks.values()];
    },
    async put(value) {
      bookmarks.set(value.key, value);
    },
  };
  const assets: AssetStore = {
    async read(id) {
      return images.get(id) ?? null;
    },
    async put(value) {
      images.set(value.id, value);
    },
  };
  return { tasks, assets, bookmarks, images };
}
export const offline: RequestPort = async () => {
  throw Error('synthetic offline');
};
export async function mobileFixture(request: RequestPort = offline) {
  const fixture = await setup(new MemoryStore()),
    stores = technicalStores();
  const identity = {
    accountId: fixture.settings.accountId,
    origin: 'https://synthetic.invalid',
    username: 'synthetic',
    credential: 'test-only',
    expiresAt: '2026-11-17T12:00:00.000Z',
    healthAllowed: true,
    aiAllowed: true,
    purposeVersion: '1',
  };
  const gateway = new LocalGateway(
    fixture.bus,
    identity,
    new HttpClient(identity.origin, () => identity.credential, request),
    stores.tasks,
    stores.assets,
    async () => undefined,
  );
  return { ...fixture, ...stores, identity, gateway, send: commandSession(gateway, randomUUID, () => fixedNow) };
}
export function values(spec: FormSpec, override: Record<string, string> = {}) {
  return { ...formSession(spec, 'test').initial, ...override };
}
