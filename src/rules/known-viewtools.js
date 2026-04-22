const path = require('path');
const fs = require('fs');

const meta = {
  name: 'known-viewtools',
  description: 'Warn when using viewtool references not in the known list',
  fixable: false,
};

// Cache loaded presets
const presetCache = {};

function loadPreset(presetName) {
  if (presetCache[presetName]) return presetCache[presetName];

  const presetPath = path.join(__dirname, '..', '..', 'defaults', `${presetName}-viewtools.json`);
  if (!fs.existsSync(presetPath)) {
    return null;
  }

  const data = JSON.parse(fs.readFileSync(presetPath, 'utf-8'));
  presetCache[presetName] = new Set(data.viewtools);
  return presetCache[presetName];
}

// Match $tool.method() or $tool.property — captures the tool name
// Excludes $! silent refs (still captures tool name after $!)
const VIEWTOOL_REF = /\$!?\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?\s*\.\s*[a-zA-Z]/g;

// Standard VTL variables and common implicit objects to ignore
const BUILT_INS = new Set([
  'foreach',
  'request',
  'response',
  'session',
  'context',
  'velocityCount',
  'velocityHasNext',
]);

const COMMENT_LINE = /^\s*##/;

// Match #foreach($var in ...) to collect loop variable names
const FOREACH_VAR = /#foreach\s*\(\s*\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?\s+in\b/g;

function collectLoopVars(source) {
  const vars = new Set();
  let match;
  FOREACH_VAR.lastIndex = 0;
  while ((match = FOREACH_VAR.exec(source)) !== null) {
    vars.add(match[1]);
  }
  return vars;
}

function check(lines, source, options) {
  const presetName = options.preset || 'dotcms';
  const extra = options.extra || [];

  const knownTools = loadPreset(presetName);
  if (!knownTools) {
    return [{
      line: 1,
      column: 1,
      message: `Unknown viewtools preset "${presetName}"`,
    }];
  }

  // Collect loop variables from #foreach directives
  const loopVars = collectLoopVars(source);

  // Merge extra tools, built-ins, and loop variables
  const allowed = new Set([...knownTools, ...extra, ...BUILT_INS, ...loopVars]);

  const results = [];
  const reported = new Set(); // avoid duplicate reports for same tool name

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (COMMENT_LINE.test(line)) continue;

    let match;
    VIEWTOOL_REF.lastIndex = 0;

    while ((match = VIEWTOOL_REF.exec(line)) !== null) {
      const toolName = match[1];

      if (allowed.has(toolName)) continue;
      if (reported.has(toolName)) continue;

      reported.add(toolName);

      results.push({
        line: i + 1,
        column: match.index + 1,
        message: `Unknown viewtool "$${toolName}" — not in ${presetName} preset. Add to "extra" if intentional.`,
      });
    }
  }

  return results;
}

module.exports = { meta, check };
