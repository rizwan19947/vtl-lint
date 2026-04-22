const meta = {
  name: 'variable-naming',
  description: 'Enforce a naming convention for VTL variables',
  fixable: false,
};

const CONVENTIONS = {
  camelCase: /^[a-z][a-zA-Z0-9]*$/,
  snake_case: /^[a-z][a-z0-9_]*$/,
  PascalCase: /^[A-Z][a-zA-Z0-9]*$/,
  UPPER_CASE: /^[A-Z][A-Z0-9_]*$/,
};

// Match #set($varName = ...) — captures the variable name
const SET_DIRECTIVE = /#set\s*\(\s*\$\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?/g;

// Known built-in / loop variables to ignore
const BUILT_INS = new Set([
  'foreach',
  'velocityCount',
  'velocityHasNext',
]);

function check(lines, source, options) {
  const convention = options.convention || 'camelCase';
  const pattern = CONVENTIONS[convention];

  if (!pattern) {
    return [{
      line: 1,
      column: 1,
      message: `Unknown naming convention "${convention}". Use: ${Object.keys(CONVENTIONS).join(', ')}`,
    }];
  }

  const ignore = new Set([
    ...BUILT_INS,
    ...(options.ignore || []),
  ]);

  const results = [];
  let match;

  SET_DIRECTIVE.lastIndex = 0;
  while ((match = SET_DIRECTIVE.exec(source)) !== null) {
    const varName = match[1];

    if (ignore.has(varName)) continue;

    // Single-char variables are fine
    if (varName.length <= 1) continue;

    if (!pattern.test(varName)) {
      // Find the line number
      const beforeMatch = source.slice(0, match.index);
      const lineNum = beforeMatch.split('\n').length;

      results.push({
        line: lineNum,
        column: match.index - beforeMatch.lastIndexOf('\n'),
        message: `Variable "$${varName}" does not match ${convention} convention`,
      });
    }
  }

  return results;
}

module.exports = { meta, check };
