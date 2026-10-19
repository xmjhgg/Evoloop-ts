import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';

const root = resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
if (args.includes('verify') && !/^jdbc:mysql:\/\/[^/]+\/evoloop_two_test(?:\?|$)/.test(process.env.EVOLOOP_CLOUD_DB_URL ?? '')) {
  throw new Error('Set EVOLOOP_CLOUD_DB_URL to the isolated evoloop_two_test MySQL database. Database tests cannot be skipped.');
}
const command = process.env.EVOLOOP_MAVEN ?? (process.platform === 'win32' ? resolve(root, 'apps/cloud/mvnw.cmd') : resolve(root, 'apps/cloud/mvnw'));
if (!existsSync(command)) throw new Error('Maven wrapper or EVOLOOP_MAVEN is required');
const result = spawnSync(command, ['-B', ...args], { cwd: resolve(root, 'apps/cloud'), env: process.env, stdio: 'inherit', shell: process.platform === 'win32' });
process.exit(result.status ?? 1);
