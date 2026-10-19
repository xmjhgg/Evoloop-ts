import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const log = await readFile(join(root, '.test-data/verify.log'), 'utf8');
const nodeGroups = [...log.matchAll(/^# tests (\d+)\r?$/gm)].map(match => Number(match[1]));
if (nodeGroups.length !== 6 || !log.includes('BUILD SUCCESS') || /# fail [1-9]|# skipped [1-9]/.test(log)) throw new Error('Successful full verification evidence required');
const java = [];
for (const file of (await readdir(join(root, 'apps/cloud/target/surefire-reports'))).filter(name => name.startsWith('TEST-') && name.endsWith('.xml'))) {
  const xml = await readFile(join(root, 'apps/cloud/target/surefire-reports', file), 'utf8');
  const attributes = /<testsuite\b([^>]+)>/.exec(xml)?.[1] ?? '';
  const get = name => new RegExp('\\b' + name + '="([^"]+)"').exec(attributes)?.[1];
  const result = { name: get('name'), tests: Number(get('tests')), failures: Number(get('failures')), errors: Number(get('errors')), skipped: Number(get('skipped')) };
  if (result.failures || result.errors || result.skipped) throw new Error('Java tests did not fully pass');
  java.push(result);
}
async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true }), result = [];
  for (const entry of entries) {
    if (['.git', 'node_modules', 'target', '.test-data', '.tools', 'docs', 'dist', '.expo', 'build'].includes(entry.name)) continue;
    if (/apps[\\/]mobile$/.test(directory) && ['ios', 'android'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await sources(path));
    else if (/\.(?:tsx?|java|sql|xml|json|[cm]?js|ya?ml|lock)$/.test(path) || /pnpm-lock.yaml$/.test(path)) {
      result.push({ path: relative(root, path).replaceAll('\\', '/'), sha256: hash((await readFile(path, 'utf8')).replaceAll('\r\n', '\n')) });
    }
  }
  return result;
}
const snapshot = (await sources(root)).sort((a, b) => a.path < b.path ? -1 : 1);
const total = nodeGroups.reduce((a, b) => a + b, 0) + java.reduce((sum, result) => sum + result.tests, 0);
const evidence = { date: '2026-10-17', command: 'pnpm verify', outcome: 'PASSED', totalTests: total,
  node: { unit: nodeGroups[0], mobile: nodeGroups[1], storageIntegration: nodeGroups[2], compatibility: nodeGroups[3], backupRecovery: nodeGroups[4], javaSqliteRoundtrip: nodeGroups[5] }, java,
  skipped: 0, tools: { node: process.versions.node, pnpm: '11.25.0', typescript: '5.9.3', mobileTypescript: '6.0.3', expo: '57.0.30', reactNative: '0.86.3', java: '21.0.8', maven: '3.9.11', springBoot: '4.0.8', mysql: '8.4.10' },
  database: { name: 'evoloop_two_test', port: '13317', isolated: true },
  verifyLogSha256: hash(log.replaceAll('\r\n', '\n')),
  cloudJarSha256: hash(await readFile(join(root, 'apps/cloud/target/evoloop-cloud-0.1.0.jar'))),
  normalizedSourceDigest: hash(JSON.stringify(snapshot)), sources: snapshot,
  boundaries: ['strict pure TS without Node/DOM', 'public package/domain imports and cycles', 'file/function sizes', 'generated protocol equality', 'real cloud JAR', 'resolved Java runtime dependency lock'],
  notVerified: ['iOS native compilation, screen/device interaction and signing', 'native SQLCipher/Keychain/camera/files and WeChat file API', 'real browser IndexedDB quotas/multiple tabs', 'real AI provider', 'production deployment', 'all 140 acceptance criteria', 'performance targets'],
  outOfScope: ['legacy data migration per user instruction', 'miniapp/H5 implementation'],
  historicalEvidence: '20261017-results.json' };
await mkdir(join(root, 'docs/verification/evidence'), { recursive: true });
await writeFile(join(root, 'docs/verification/evidence/20261017-refactor-results.json'), JSON.stringify(evidence, null, 2) + '\n');
process.stdout.write(`Recorded ${total} passing tests and ${snapshot.length} source hashes\n`);
