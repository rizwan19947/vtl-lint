const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  underline: '\x1b[4m',
  reset: '\x1b[0m',
};

function colorize(text, color, enabled) {
  if (!enabled) return text;
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

/**
 * Print lint results to stdout.
 * Returns { errorCount, warningCount, fixedFileCount, fixCount }.
 */
function report(results, options = {}) {
  const { quiet = false, color = true, dryRun = false } = options;

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;
  let fixedFileCount = 0;
  let totalFixCount = 0;

  for (const { filePath, diagnostics, fixed, fixCount } of results) {
    if (fixed) {
      fixedFileCount++;
      totalFixCount += fixCount || 0;
    }
    const filtered = quiet
      ? diagnostics.filter((d) => d.severity === 'error')
      : diagnostics;

    if (filtered.length === 0) continue;

    filesWithIssues++;

    console.log('');
    console.log(colorize(filePath, 'underline', color));

    for (const d of filtered) {
      if (d.severity === 'error') totalErrors++;
      else totalWarnings++;

      const location = colorize(`  ${d.line}:${d.column}`, 'dim', color);
      const severity =
        d.severity === 'error'
          ? colorize('error', 'red', color)
          : colorize('warn ', 'yellow', color);
      const rule = colorize(d.ruleId, 'dim', color);

      console.log(`${location}  ${severity}  ${d.message}  ${rule}`);
    }
  }

  // Print fix summary
  if (fixedFileCount > 0) {
    console.log('');
    const verb = dryRun ? 'Would fix' : 'Fixed';
    console.log(
      colorize(
        `${verb} ${totalFixCount} problem${totalFixCount === 1 ? '' : 's'} in ${fixedFileCount} file${fixedFileCount === 1 ? '' : 's'}.`,
        'bold',
        color,
      ),
    );
  }

  if (filesWithIssues > 0) {
    console.log('');
    const summary = [];
    if (totalErrors > 0) {
      summary.push(colorize(`${totalErrors} error${totalErrors === 1 ? '' : 's'}`, 'red', color));
    }
    if (totalWarnings > 0) {
      summary.push(colorize(`${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}`, 'yellow', color));
    }
    const remaining = fixedFileCount > 0 ? ' remaining' : '';
    console.log(`Found ${summary.join(' and ')}${remaining} in ${filesWithIssues} file${filesWithIssues === 1 ? '' : 's'}.`);
  } else if (fixedFileCount === 0) {
    console.log('No issues found.');
  }

  return { errorCount: totalErrors, warningCount: totalWarnings, fixedFileCount, fixCount: totalFixCount };
}

module.exports = { report };
