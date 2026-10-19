export interface SyncSession {
  readonly unlocked: boolean;
  status(): { pendingCommandIds: readonly string[]; attachmentsComplete: boolean; requiresAttention?: boolean };
  synchronize(): Promise<void>;
  subscribe(listener: () => void): () => void;
}
export interface TimerPort {
  set(work: () => void, delay: number): unknown;
  clear(handle: unknown): void;
}
export function syncScheduler(session: SyncSession, timers: TimerPort) {
  let online = false,
    stopped = false,
    running = false,
    failures = 0,
    handle: unknown = null;
  const pending = () => {
    const status = session.status();
    return !status.requiresAttention && (status.pendingCommandIds.length > 0 || !status.attachmentsComplete);
  };
  function schedule(delay: number, pull = false) {
    if (stopped || !online || !session.unlocked || running || handle !== null || (!pull && !pending())) return;
    handle = timers.set(() => {
      handle = null;
      void run();
    }, delay);
  }
  async function run() {
    if (stopped || !online || !session.unlocked) return;
    running = true;
    try {
      await session.synchronize();
      failures = 0;
    } catch {
      failures++;
    } finally {
      running = false;
      schedule(failures ? Math.min(300000, 30000 * 2 ** (failures - 1)) : 1200, failures > 0);
    }
  }
  const unsubscribe = session.subscribe(() => schedule(1200));
  return {
    network(available: boolean) {
      online = available;
      if (!available && handle !== null) {
        timers.clear(handle);
        handle = null;
      }
      if (available) schedule(0, true);
    },
    stop() {
      stopped = true;
      online = false;
      unsubscribe();
      if (handle !== null) timers.clear(handle);
      handle = null;
    },
  };
}
