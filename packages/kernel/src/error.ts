export class BusinessError extends Error {
  constructor(readonly code: string, readonly details: Readonly<Record<string, unknown>> = {}) {
    super(code);
  }
}
export function requireThat(condition: unknown, code: string): asserts condition {
  if (!condition) throw new BusinessError(code);
}
