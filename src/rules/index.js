/**
 * Rule registry.
 *
 * Each rule module must export:
 * - meta: { name, description, fixable }
 * - check(lines, source, options): returns array of { line, column?, message, fix? }
 *   where fix is optional: { range: [startOffset, endOffset], text: string }
 */

const rules = {};

function registerRule(id, rule) {
  rules[id] = rule;
}

function getRules() {
  return rules;
}

// Rules will be registered here as they are implemented in Phase 2.
// Example:
// registerRule('no-trailing-whitespace', require('./no-trailing-whitespace'));

module.exports = { registerRule, getRules };
