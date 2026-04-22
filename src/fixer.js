/**
 * Apply a set of non-overlapping fixes to a source string.
 * Each fix has: { range: [startOffset, endOffset], text: string }
 *
 * Fixes are applied in reverse order to preserve offsets.
 */
function applyFixes(source, fixes) {
  if (!fixes || fixes.length === 0) return source;

  // Sort fixes by start offset descending so we apply from end to start
  const sorted = [...fixes].sort((a, b) => b.range[0] - a.range[0]);

  // Remove overlapping fixes (keep the first one in original order)
  const applied = [];
  let minStart = Infinity;

  for (const fix of sorted) {
    if (fix.range[1] <= minStart) {
      applied.push(fix);
      minStart = fix.range[0];
    }
  }

  let result = source;
  for (const fix of applied) {
    result = result.slice(0, fix.range[0]) + fix.text + result.slice(fix.range[1]);
  }

  return result;
}

module.exports = { applyFixes };
