import { canonical, digest } from '@evoloop/kernel';
import type { Json } from '@evoloop/kernel';
import type { LocalGateway } from './local.ts';

export function commandSession(gateway: LocalGateway, uuid: () => string, now: () => string) {
  const requests = new Map<string, { id: string; at: string }>();
  return (type: string, input: unknown) => {
    const payload = JSON.parse(canonical(input)) as Json;
    const key = digest([type, payload]);
    let request = requests.get(key);
    if (!request) {
      request = { id: uuid(), at: now() };
      requests.set(key, request);
    }
    return gateway.command(type, payload, request.id, request.at);
  };
}
export type SendCommand = ReturnType<typeof commandSession>;
