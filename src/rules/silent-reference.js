const path = require('path');
const fs = require('fs');

const meta = {
  name: 'silent-reference',
  description: 'Enforce using silent references ($!) to avoid printing "null" in output',
  fixable: false,
};

// Load known viewtools to exclude (they are always initialized)
let knownViewtools = null;
function getKnownViewtools() {
  if (knownViewtools) return knownViewtools;
  try {
    const presetPath = path.join(__dirname, '..', '..', 'defaults', 'dotcms-viewtools.json');
    const data = JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
    knownViewtools = new Set(data.viewtools);
  } catch {
    knownViewtools = new Set();
  }
  return knownViewtools;
}

// Matches $variable or ${variable} references that are NOT silent ($!)
// Excludes:
//   - References inside ## comments
//   - References inside #set, #if, #elseif, #foreach conditions (logic context, not output)
//   - References that are part of directive syntax (#, $!)
//   - String literals inside quotes
const DIRECTIVE_LINE = /^\s*#(set|if|elseif|foreach|macro|parse|include|define|evaluate)\b/;
const COMMENT_LINE = /^\s*##/;

// Match $var, ${var}, $var.method(), ${var.method()} — but NOT $!var
const LOUD_REF = /(?<!\w)\$(?!!)\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g;

function check(lines, source, options) {
  const enforce = options.enforce || 'always';
  if (enforce === 'never') return [];

  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comment lines
    if (COMMENT_LINE.test(line)) continue;

    // Skip directive lines (references in logic context don't render)
    if (DIRECTIVE_LINE.test(line)) continue;

    // Skip lines that are purely directives like #end, #else, #break, #stop
    if (/^\s*#(end|else|break|stop)\b/.test(line)) continue;

    let match;
    LOUD_REF.lastIndex = 0;

    while ((match = LOUD_REF.exec(line)) !== null) {
      const col = match.index + 1;

      // Skip if inside a string literal (basic check: count quotes before match)
      const before = line.slice(0, match.index);
      const singleQuotes = (before.match(/'/g) || []).length;
      const doubleQuotes = (before.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0) continue;

      // Skip known viewtools — they are always initialized by the framework
      if (getKnownViewtools().has(match[1])) continue;

      results.push({
        line: i + 1,
        column: col,
        message: `Use silent reference $!${match[1]} instead of $${match[1]} to avoid printing "null"`,
      });
    }
  }

  return results;
}

module.exports = { meta, check };
