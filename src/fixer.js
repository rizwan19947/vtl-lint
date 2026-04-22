const BOM = '\uFEFF';

/**
 * Apply a set of non-overlapping fixes to a source string.
 * Each fix has: { range: [startOffset, endOffset], text: string }
 *
 * Fixes are applied in reverse order to preserve offsets.
 * Returns { output, fixCount } where fixCount is the number of fixes applied.
 */
function applyFixes(source, fixes) {
  if (!fixes || fixes.length === 0) return { output: source, fixCount: 0 };

  // Preserve BOM if present — strip before fixing, re-add after
  const hasBom = source.startsWith(BOM);
  const raw = hasBom ? source.slice(1) : source;

  // Detect original line ending style
  const useCRLF = raw.includes('\r\n');

  // Normalize to LF for consistent offsets
  const normalized = useCRLF ? raw.replace(/\r\n/g, '\n') : raw;

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

  let result = normalized;
  for (const fix of applied) {
    result = result.slice(0, fix.range[0]) + fix.text + result.slice(fix.range[1]);
  }

  // Restore original line ending style
  if (useCRLF) {
    result = result.replace(/\n/g, '\r\n');
  }

  // Restore BOM
  if (hasBom) {
    result = BOM + result;
  }

  return { output: result, fixCount: applied.length };
}

module.exports = { applyFixes };
