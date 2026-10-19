import { readdir, readFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

export const root = resolve(import.meta.dirname, '../..');
export { ts, readFile };
export async function files(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (['node_modules', '.git', '.tools', '.test-data', 'target', '.expo', 'dist'].includes(entry.name)) continue;
    if (/apps[\\/]mobile$/.test(directory) && ['ios', 'android'].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await files(path));
    else result.push(path);
  }
  return result;
}
export function name(path) { return relative(root, path).replaceAll('\\', '/'); }
export function source(path, text) { return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS); }
export function imports(node) {
  const result = [];
  function walk(child) {
    if ((ts.isImportDeclaration(child) || ts.isExportDeclaration(child)) && child.moduleSpecifier && ts.isStringLiteral(child.moduleSpecifier)) result.push(child.moduleSpecifier.text);
    if (ts.isCallExpression(child) && (child.expression.kind === ts.SyntaxKind.ImportKeyword || child.expression.getText(node) === 'require')) {
      if (child.arguments.length !== 1 || !ts.isStringLiteral(child.arguments[0])) throw new Error('Nonliteral dynamic import: ' + node.fileName);
      result.push(child.arguments[0].text);
    }
    ts.forEachChild(child, walk);
  }
  walk(node);
  return result;
}
export function fail(errors) { if (errors.length) throw new Error(errors.join('\n')); }
