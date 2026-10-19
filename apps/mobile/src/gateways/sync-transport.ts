import { capabilitiesSchema, snapshotSchema, receiptSchema, pullSchema } from '@evoloop/contracts';
import type { SyncTransport } from '@evoloop/local-runtime/ports';
import type { HttpClient } from '../platform/network/http.ts';

export function syncTransport(http: HttpClient): SyncTransport {
  return {
    capabilities: () => http.call('GET', '/api/v2/sync/capabilities', capabilitiesSchema),
    snapshot: (id) => http.call('GET', '/api/v2/sync/snapshots/' + encodeURIComponent(id), snapshotSchema),
    upload: (batch) => http.call('POST', '/api/v2/sync/batches', receiptSchema, batch),
    pull: (after) => http.call('GET', '/api/v2/sync/batches?afterSequence=' + encodeURIComponent(after), pullSchema),
  };
}
