import { files, name, readFile, source, ts, fail } from './files.mjs';
const errors = [];
for (const path of (await files()).filter(path => /\.(tsx?|mjs|java|sql)$/.test(path) && !name(path).startsWith('contracts/'))) {
  const text = await readFile(path, 'utf8'), location = name(path);
  if (/^(?:<{7}|={7}|>{7})/m.test(text)) errors.push(`${location}: merge markers`);
  if (/\.tsx?$/.test(path)) {
    const node = source(path, text);
    if (node.parseDiagnostics.length) errors.push(`${location}: syntax diagnostics`);
    if (/@ts-(ignore|nocheck)|\bas any\b/.test(text)) errors.push(`${location}: unsafe type suppression`);
  }
}
fail(errors);
process.stdout.write('Source syntax and unsafe-suppression checks passed\n');
