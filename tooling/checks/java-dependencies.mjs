import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const resolved = await readFile(resolve(root, 'apps/cloud/target/runtime-dependencies.txt'), 'utf8');
const dependencies = resolved.split(/\r?\n/).map(line => line.trim().split(' -- ')[0])
  .filter(line => /^[^\s:]+:[^\s:]+:jar:[^\s:]+(?::[^\s:]+)?:(?:compile|runtime)$/.test(line)).sort();
if (!dependencies.length || dependencies.some(line => line.includes('SNAPSHOT'))) throw new Error('Expected resolved release Java runtime dependencies');
const expected = '# Generated resolved Java runtime coordinates. Update only with reviewed dependency changes.\n' + dependencies.join('\n') + '\n';
const path = resolve(root, 'apps/cloud/runtime-dependencies.lock');
if (process.argv.includes('--write')) await writeFile(path, expected);
else if (await readFile(path, 'utf8') !== expected) throw new Error('Resolved Java runtime dependencies differ from the reviewed lock');
process.stdout.write(`Java runtime dependency lock verified (${dependencies.length} artifacts)\n`);
