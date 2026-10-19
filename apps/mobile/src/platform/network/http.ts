import { BusinessError, requireThat } from '@evoloop/kernel';
import type { z } from 'zod';

export interface RequestPort {
  (
    url: string,
    init: { method: string; headers: Record<string, string>; body?: string; signal: AbortSignal },
  ): Promise<{
    ok: boolean;
    status: number;
    json(): Promise<unknown>;
  }>;
}
export function apiOrigin(input: string, development = false): string {
  const url = new URL(input);
  requireThat(
    url.protocol === 'https:' ||
      (development && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)),
    '请填写 HTTPS 云端地址',
  );
  requireThat(!url.username && !url.password && !url.search && !url.hash && url.pathname === '/', '请填写服务根地址');
  return url.origin;
}
export class HttpClient {
  constructor(
    readonly origin: string,
    private readonly credential: () => string | null,
    private readonly request: RequestPort,
  ) {}
  withCredential(credential: string) {
    return new HttpClient(this.origin, () => credential, this.request);
  }
  async call<T>(method: string, path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> {
    return schema.parse(await this.raw(method, path, body));
  }
  async raw(method: string, path: string, body?: unknown): Promise<unknown> {
    requireThat(path.startsWith('/api/v2/'), 'API_PATH_INVALID');
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 30000);
    const token = this.credential();
    const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    try {
      const response = await this.request(this.origin + path, {
        method,
        headers,
        signal: controller.signal,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      if (response.status === 204) return null;
      const result = await response.json();
      if (!response.ok) {
        const code =
          typeof result === 'object' && result !== null && 'code' in result
            ? String(result.code)
            : 'CLOUD_REQUEST_FAILED';
        throw new BusinessError(code);
      }
      return result;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError('NETWORK_UNAVAILABLE');
    } finally {
      clearTimeout(timer);
    }
  }
}
