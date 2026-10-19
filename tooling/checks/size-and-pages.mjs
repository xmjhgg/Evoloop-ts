import { files, name, readFile, source, ts, fail, root } from './files.mjs';
import { resolve } from 'node:path';

const errors = [], all = await files();
const pageMap = await readFile(resolve(root, 'docs/engineering/page-map.md'), 'utf8');
for (const path of all.filter(path => /\.(tsx?|java)$/.test(path) && !name(path).startsWith('contracts/'))) {
  const location = name(path), text = await readFile(path, 'utf8');
  const code = text.split(/\r?\n/).filter(line => line.trim() && !/^\s*(\/\/|\/\*|\*|\*\/)/.test(line));
  const test = /(^tests\/|\/test\/)/.test(location);
  const limit = test ? 500 : /(?:^|\/)(?:App|main|CloudApplication)\./.test(location) ? 80 : /\/use[^/]*\.tsx?$/.test(location) ? 150 : /Screen\.tsx?$|\/application\/(commands|queries)\/|\/domain\/.*policy/.test(location) ? 200 : 350;
  if (code.length > limit) errors.push(`${location}: ${code.length} code lines exceeds ${limit}`);
  if (path.endsWith('.java')) {
    const lines = text.split(/\r?\n/);
    for (let start = 0; start < lines.length; start++) {
      if (!/^\s*(?:@\w+\s+)*(?:public|private|protected)\s+(?!class|record|interface).*\([^;]*\).*\{/.test(lines[start])) continue;
      let depth = 0, entered = false, count = 0;
      for (let index = start; index < lines.length; index++) {
        const line = lines[index].replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
        if (line.trim()) count++;
        for (const character of line) {
          if (character === '{') { depth++; entered = true; }
          if (character === '}') depth--;
        }
        if (entered && depth === 0) break;
      }
      if (count > 80) errors.push(`${location}: Java method exceeds 80 lines (${count})`);
    }
    continue;
  }
  const node = source(path, text);
  function walk(child) {
    if (ts.isFunctionLike(child) && child.body) {
      const lines = child.body.getText(node).split(/\r?\n/).filter(line => line.trim() && !line.trim().startsWith('//')).length;
      if (lines > 80) errors.push(`${location}: function exceeds 80 lines (${lines})`);
    }
    ts.forEachChild(child, walk);
  }
  walk(node);
  if (/apps\/(miniapp|mobile)\/src\/(?:screens|pages)\//.test(location)) {
    if (!pageMap.includes(location)) errors.push(`${location}: missing from page map`);
    if (/\bfetch\s*\(|storage-|from ['"].*(?:sqlite|database|cloud-sdk)/.test(text)) errors.push(`${location}: forbidden Screen dependency`);
  }
}
fail(errors);
process.stdout.write('File/function limits and implemented page map verified\n');
