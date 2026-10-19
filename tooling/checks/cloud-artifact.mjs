import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const jar = resolve(root, 'apps/cloud/target/evoloop-cloud-0.1.0.jar');
if (!existsSync(jar)) throw new Error('Build the real Java artifact before checking cloud boundaries');
const executable = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'jar.exe' : 'jar') : 'jar';
const entries = execFileSync(executable, ['tf', jar], { encoding: 'utf8' }).split(/\r?\n/);
const forbidden = entries.filter(entry => /\.(?:tsx?|mjs)$|client-business-core|local-runtime|graal|nodejs|com\/evoloop\/(?:planning|execution|review|profile)\//i.test(entry));
if (forbidden.length) throw new Error('Forbidden Java artifact contents: ' + forbidden.join('\n'));
if (!entries.some(entry => entry.includes('/modules/sync/application/StoreBatch.class')) || !entries.some(entry => entry.endsWith('protocol/SyncBatch.json'))) throw new Error('Cloud module or generated schema missing from artifact');
process.stdout.write(`Cloud JAR boundary verified (${entries.length} entries)\n`);
