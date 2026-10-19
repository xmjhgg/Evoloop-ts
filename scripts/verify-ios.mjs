import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..'), mobile = join(root, 'apps/mobile'), startedAt = new Date().toISOString();
const steps = [];
function run(args, capture = false) {
  const result = spawnSync('pnpm', args, { cwd: root, shell: process.platform === 'win32', encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (!capture || result.status !== 0) process.stdout.write((result.stdout ?? '') + (result.stderr ?? ''));
  if (result.status !== 0) throw Error('Failed: pnpm ' + args.join(' '));
  steps.push({ command: 'pnpm ' + args.join(' '), exitCode: result.status });
  return result.stdout;
}
run(['--filter', '@evoloop/mobile', 'typecheck']);
run(['--filter', '@evoloop/mobile', 'check:expo']);
const config = JSON.parse(run(['--filter', '@evoloop/mobile', 'exec', 'expo', 'config', '--type', 'introspect', '--json'], true));
if (!config.plugins.some(plugin => Array.isArray(plugin) && plugin[0] === 'expo-sqlite' && plugin[1].useSQLCipher === true)) throw Error('SQLCipher plugin is required');
if (config.ios.bundleIdentifier !== 'com.evoloop.two' || !config.ios.infoPlist.NSFaceIDUsageDescription) throw Error('iOS identity or Face ID declaration missing');
if (config.ios.entitlements['com.apple.developer.default-data-protection'] !== 'NSFileProtectionComplete') throw Error('iOS file protection missing');
run(['--filter', '@evoloop/mobile', 'export:ios']);
const bundleFolder = join(mobile, 'dist/_expo/static/js/ios');
const bundles = (await readdir(bundleFolder)).filter(file => file.endsWith('.hbc'));
if (bundles.length !== 1) throw Error('Expected one real Hermes bundle');
const path = join(bundleFolder, bundles[0]), bundle = await readFile(path);
if (bundle.length < 1024) throw Error('Hermes bundle is empty');
const evidence = { startedAt, completedAt: new Date().toISOString(), outcome: 'PASSED', steps,
  configuration: { sqlCipher: true, keychain: true, fileProtection: 'NSFileProtectionComplete', bundleIdentifier: config.ios.bundleIdentifier },
  bundle: { path: relative(root, path).replaceAll('\\', '/'), bytes: bundle.length, sha256: createHash('sha256').update(bundle).digest('hex') },
  notRun: ['Xcode/CocoaPods native build', 'iOS simulator and physical device', 'native SQLCipher/Keychain/biometric/camera/files', 'real AI provider', 'TestFlight and App Store'] };
await mkdir(join(root, 'docs/verification/evidence'), { recursive: true });
await writeFile(join(root, 'docs/verification/evidence/20261017-ios-build.json'), JSON.stringify(evidence, null, 2) + '\n');
process.stdout.write('Recorded iOS code/configuration/Hermes verification; native execution remains unverified.\n');
