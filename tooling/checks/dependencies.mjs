import { dirname, resolve, relative } from 'node:path';
import { files, root, name, readFile, source, imports, fail } from './files.mjs';

const all = await files(), errors = [], manifests = new Map(), graph = new Map();
for (const path of all.filter(path => /(?:packages[\\/][^\\/]+|apps[\\/]mobile)[\\/]package.json$/.test(path))) {
  const json = JSON.parse(await readFile(path, 'utf8'));
  manifests.set(json.name, { json, directory: dirname(path) });
}
const allowed = {
  kernel: [], 'data-schema': ['kernel'], contracts: ['kernel', 'data-schema'],
  'client-business-core': ['kernel'], 'local-runtime': ['kernel', 'contracts', 'data-schema', 'client-business-core'],
  'storage-sqlite': ['kernel', 'local-runtime', 'data-schema', 'client-business-core'],
  'storage-journal': ['kernel', 'local-runtime', 'data-schema', 'client-business-core'],
  'storage-indexeddb': ['kernel', 'local-runtime', 'data-schema', 'client-business-core'],
  'client-model': ['kernel', 'client-business-core'], 'design-tokens': [],
  mobile: ['kernel', 'contracts', 'client-business-core', 'local-runtime', 'storage-sqlite', 'client-model', 'design-tokens'],
};
for (const [packageName, { json }] of manifests) {
  const short = packageName.split('/')[1];
  for (const dependency of Object.keys(json.dependencies ?? {})) {
    if (dependency.startsWith('@evoloop/') && !allowed[short]?.includes(dependency.split('/')[1])) errors.push(`${packageName}: forbidden dependency ${dependency}`);
    if (dependency.includes('testing')) errors.push(`${packageName}: production dependency on testing`);
  }
}
for (const path of all.filter(path => /\.[cm]?tsx?$/.test(path) && /^(packages\/|apps\/mobile\/)/.test(name(path)))) {
  const text = await readFile(path, 'utf8'), location = name(path), packageName = location.split('/')[1];
  const node = source(path, text), dependencies = imports(node), edges = [];
  for (const dependency of dependencies) {
    let destination;
    if (dependency.startsWith('.')) {
      destination = resolve(dirname(path), dependency);
      if (relative(resolve(root, location.startsWith('apps/') ? 'apps' : 'packages', packageName), destination).startsWith('..')) errors.push(`${location}: cross-package relative import ${dependency}`);
    } else if (dependency.startsWith('@evoloop/')) {
      const parts = dependency.split('/'), pkg = manifests.get(parts.slice(0, 2).join('/'));
      const key = parts.length === 2 ? '.' : './' + parts.slice(2).join('/');
      if (!pkg?.json.exports[key]) errors.push(`${location}: nonpublic entry ${dependency}`);
      else destination = resolve(pkg.directory, pkg.json.exports[key]);
      if (!allowed[packageName]?.includes(parts[1])) errors.push(`${location}: forbidden import ${dependency}`);
    } else if (['kernel', 'contracts', 'data-schema', 'client-business-core', 'local-runtime', 'client-model', 'design-tokens'].includes(packageName) && /^(node:|react|@tarojs|expo|react-native|fs$|http$)/.test(dependency)) errors.push(`${location}: platform import ${dependency}`);
    if (packageName === 'mobile' && /\/src\/(screens|features)\//.test(location) && /^(expo|node:)/.test(dependency)) errors.push(`${location}: Feature/Screen imports native adapter ${dependency}`);
    if (destination) edges.push(destination);
  }
  const domain = /client-business-core\/src\/(profile|planning|execution|review)\//.exec(location)?.[1];
  if (domain) {
    for (const destination of edges) {
      const target = /client-business-core\/src\/(profile|planning|execution|review)\/(.*)/.exec(name(destination));
      if (target && target[1] !== domain && (target[2] !== 'public.ts' || !({ profile: [], planning: ['profile'], execution: ['planning'], review: ['profile', 'planning', 'execution'] })[domain].includes(target[1]))) errors.push(`${location}: invalid domain dependency ${name(destination)}`);
    }
    for (const match of text.matchAll(/\.store\(['"]([^'"]+)['"]\)/g)) if (match[1] !== domain) errors.push(`${location}: foreign repository access ${match[1]}`);
  }
  graph.set(path, edges);
}
const visited = new Set(), visiting = new Set();
function visit(path) {
  if (visiting.has(path)) { errors.push('Import cycle: ' + name(path)); return; }
  if (visited.has(path)) return;
  visiting.add(path);
  for (const target of graph.get(path) ?? []) visit(target);
  visiting.delete(path); visited.add(path);
}
for (const path of graph.keys()) visit(path);
for (const path of all.filter(path => name(path).startsWith('apps/cloud/src/main/java') && path.endsWith('.java'))) {
  const text = await readFile(path, 'utf8');
  if (/com\.evoloop\.(planning|execution|profile|review)|client-business-core|local-runtime|Graal|ProcessBuilder|ScriptEngine|Runtime\.getRuntime\(\)\.exec|CREATE TABLE (pln_|exe_|rev_|prf_)/i.test(text)) errors.push(`${name(path)}: forbidden cloud runtime/business dependency`);
}
const pom = await readFile(resolve(root, 'apps/cloud/pom.xml'), 'utf8');
if (/graal|javascript|nodejs|typescript|modulith/i.test(pom)) errors.push('Forbidden cloud dependency in pom');
for (const path of all.filter(path => name(path).startsWith('tooling/generators/') && path.endsWith('.ts'))) {
  const text = await readFile(path, 'utf8');
  if (/client-business-core|local-runtime|client-model|packages\/testing/.test(text)) errors.push(`${name(path)}: protocol generator loads forbidden business code`);
}
fail(errors);
process.stdout.write(`Dependency boundaries verified: ${graph.size} TS sources and Java sources\n`);
