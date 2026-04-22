const fs = require('fs');
const { normalizeRule } = require('./config');
const { getRules } = require('./rules/index');
const { applyFixes } = require('./fixer');

/**
 * Lint a single file's content against all enabled rules.
 * Returns an array of diagnostics.
 */
function lintSource(source, config) {
  const rules = getRules();
  const lines = source.split(/\r?\n/);
  const diagnostics = [];

  for (const [ruleId, ruleEntry] of Object.entries(config.rules)) {
    const { severity, options } = normalizeRule(ruleEntry);

    if (severity === 'off') continue;

    const rule = rules[ruleId];
    if (!rule) continue;

    const results = rule.check(lines, source, options);

    for (const result of results) {
      diagnostics.push({
        ruleId,
        severity,
        message: result.message,
        line: result.line,
        column: result.column || 1,
        fix: result.fix || null,
      });
    }
  }

  // Sort by line, then column
  diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);

  return diagnostics;
}

/**
 * Lint an array of file paths.
 * Returns array of { filePath, diagnostics, source }.
 */
async function lintFiles(files, config) {
  const results = [];

  for (const filePath of files) {
    let source;
    try {
      source = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
      results.push({
        filePath,
        diagnostics: [{
          ruleId: 'internal',
          severity: 'error',
          message: `Could not read file: ${err.message}`,
          line: 0,
          column: 0,
          fix: null,
        }],
      });
      continue;
    }

    const diagnostics = lintSource(source, config);

    // Apply fixes if enabled
    if (config.fix) {
      const fixable = diagnostics.filter((d) => d.fix !== null);
      if (fixable.length > 0) {
        const fixed = applyFixes(source, fixable.map((d) => d.fix));
        fs.writeFileSync(filePath, fixed, 'utf-8');

        // Re-lint after fixing to get remaining issues
        const remaining = lintSource(fixed, config);
        results.push({ filePath, diagnostics: remaining });
        continue;
      }
    }

    results.push({ filePath, diagnostics });
  }

  return results;
}

module.exports = { lintFiles, lintSource };
