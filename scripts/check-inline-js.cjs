const fs = require('node:fs');
const vm = require('node:vm');

const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/check-inline-js.cjs <html-file>');
const html = fs.readFileSync(file, 'utf8');
const tagPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
let match;
let checked = 0;
while ((match = tagPattern.exec(html))) {
  const attributes = match[1] || '';
  const source = match[2] || '';
  if (/\bsrc\s*=/.test(attributes) || !source.trim()) continue;
  const type = (attributes.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || 'text/javascript';
  if (!['text/javascript', 'application/javascript', 'module'].includes(type.toLowerCase())) continue;
  new vm.Script(source, { filename: file + '#inline-' + (++checked) });
}
if (!checked) throw new Error('No inline JavaScript blocks were checked in ' + file);
process.stdout.write('Syntax OK: ' + checked + ' inline JavaScript block(s) in ' + file + '\n');
