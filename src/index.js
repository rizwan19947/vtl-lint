/**
 * vtl-lint public API
 *
 * Usage:
 *   const { lint, lintFiles } = require('vtl-lint');
 *
 *   // Lint a string
 *   const diagnostics = lint(source, config);
 *
 *   // Lint files
 *   const results = await lintFiles(['file.vtl'], config);
 */

const { lintSource, lintFiles } = require('./runner');
const { loadConfig, normalizeRule, DEFAULT_CONFIG } = require('./config');

function lint(source, config) {
  const resolved = config || { ...DEFAULT_CONFIG };
  return lintSource(source, resolved);
}

module.exports = { lint, lintFiles, loadConfig, DEFAULT_CONFIG, normalizeRule };
