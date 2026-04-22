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

registerRule('no-trailing-whitespace', require('./no-trailing-whitespace'));
registerRule('indent', require('./indent'));
registerRule('max-line-length', require('./max-line-length'));
registerRule('no-multiple-blank-lines', require('./no-multiple-blank-lines'));
registerRule('eol-last', require('./eol-last'));
registerRule('silent-reference', require('./silent-reference'));
registerRule('variable-naming', require('./variable-naming'));
registerRule('block-matching', require('./block-matching'));
registerRule('known-viewtools', require('./known-viewtools'));

module.exports = { registerRule, getRules };
