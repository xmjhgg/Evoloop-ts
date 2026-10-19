import type { CommandBus } from '@evoloop/local-runtime';
import type { AiRequest } from '@evoloop/contracts';
import type { Identity } from './session-identity.ts';
import type { HttpClient } from '../platform/network/http.ts';
import type { AssetStore } from './assets.ts';

export interface AiTarget {
  readonly kind: 'plan-review' | 'plan-draft' | 'review' | 'food';
  readonly id: string;
  readonly expectedVersion: string;
  readonly componentId: string | null;
  readonly input: string;
  readonly inputDigest: string;
  readonly assetRefs?: readonly string[];
}
export interface AiBookmark {
  readonly key: string;
  readonly target: AiTarget;
  readonly request: AiRequest;
  readonly taskId: string | null;
}
export interface TaskStore {
  get(key: string): Promise<AiBookmark | null>;
  all(): Promise<readonly AiBookmark[]>;
  put(bookmark: AiBookmark): Promise<void>;
}
export interface ClientSession {
  readonly bus: CommandBus;
  readonly identity: Identity;
  readonly http: HttpClient;
  readonly tasks: TaskStore;
  readonly assets: AssetStore;
  changed(): void;
}
