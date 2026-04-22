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
 * Returns { errorCount, warningCount }.
 */
function report(results, options = {}) {
  const { quiet = false, color = true } = options;

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesWithIssues = 0;

  for (const { filePath, diagnostics } of results) {
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

  if (filesWithIssues > 0) {
    console.log('');
    const summary = [];
    if (totalErrors > 0) {
      summary.push(colorize(`${totalErrors} error${totalErrors === 1 ? '' : 's'}`, 'red', color));
    }
    if (totalWarnings > 0) {
      summary.push(colorize(`${totalWarnings} warning${totalWarnings === 1 ? '' : 's'}`, 'yellow', color));
    }
    console.log(`Found ${summary.join(' and ')} in ${filesWithIssues} file${filesWithIssues === 1 ? '' : 's'}.`);
  } else {
    console.log('No issues found.');
  }

  return { errorCount: totalErrors, warningCount: totalWarnings };
}

module.exports = { report };
