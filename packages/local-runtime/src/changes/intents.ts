import type { Intent } from '../ports/public.ts';
export function needsUpload(intent: Intent): boolean { return intent.status === 'PENDING' || intent.status === 'CONFLICT'; }
