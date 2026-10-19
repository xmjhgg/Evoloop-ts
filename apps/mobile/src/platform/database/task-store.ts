import type { AiBookmark, TaskStore } from '../../gateways/ai.ts';
import { requireThat } from '@evoloop/kernel';
import { parseBookmark } from '../../gateways/task-bookmark.ts';

/** Called only inside CommandBus.serial on its private, keyed connection. */
export interface TaskSql {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, parameters: string[]): Promise<unknown>;
  getFirstAsync<T>(sql: string, parameters: string[]): Promise<T | null>;
  getAllAsync<T>(sql: string): Promise<T[]>;
}
export async function taskStore(db: TaskSql): Promise<TaskStore> {
  await db.execAsync('CREATE TABLE IF NOT EXISTS client_ai_tasks (task_key TEXT PRIMARY KEY, body TEXT NOT NULL)');
  return {
    async get(key) {
      const row = await db.getFirstAsync<{ body: string }>('SELECT body FROM client_ai_tasks WHERE task_key=?', [key]);
      const value = row ? parseBookmark(JSON.parse(row.body)) : null;
      requireThat(!value || value.key === key, 'AI_BOOKMARK_INVALID');
      return value;
    },
    async all() {
      return (await db.getAllAsync<{ body: string }>('SELECT body FROM client_ai_tasks ORDER BY task_key')).map((row) =>
        parseBookmark(JSON.parse(row.body)),
      );
    },
    async put(input) {
      let value: AiBookmark = parseBookmark(input);
      const old = await db.getFirstAsync<{ body: string }>('SELECT body FROM client_ai_tasks WHERE task_key=?', [
        value.key,
      ]);
      if (old) {
        const previous = parseBookmark(JSON.parse(old.body));
        if (previous.request.clientRequestId !== value.request.clientRequestId) {
          const preserved = { ...previous, key: previous.key + ':' + previous.request.clientRequestId };
          await db.runAsync('INSERT OR IGNORE INTO client_ai_tasks (task_key, body) VALUES (?, ?)', [
            preserved.key,
            JSON.stringify(preserved),
          ]);
        } else {
          requireThat(!previous.taskId || !value.taskId || previous.taskId === value.taskId, 'AI_TASK_ID_CONFLICT');
          value = { ...value, taskId: value.taskId ?? previous.taskId };
        }
      }
      await db.runAsync(
        'INSERT INTO client_ai_tasks (task_key, body) VALUES (?, ?) ON CONFLICT(task_key) DO UPDATE SET body=excluded.body',
        [value.key, JSON.stringify(value)],
      );
    },
  };
}
