const meta = {
  name: 'no-multiple-blank-lines',
  description: 'Disallow multiple consecutive blank lines',
  fixable: true,
};

function check(lines, source, options) {
  const max = options.max != null ? options.max : 1;
  const results = [];
  let consecutiveBlanks = 0;
  let blankRunStart = -1;
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBlank = line.trim().length === 0;

    if (isBlank) {
      if (consecutiveBlanks === 0) {
        blankRunStart = offset;
      }
      consecutiveBlanks++;
    } else {
      if (consecutiveBlanks > max) {
        // Calculate the range of excess blank lines
        // Keep `max` blank lines, remove the rest
        let keepOffset = blankRunStart;
        for (let k = 0; k < max; k++) {
          keepOffset += lines[i - consecutiveBlanks + k].length + 1;
        }

        results.push({
          line: i - consecutiveBlanks + max + 1,
          column: 1,
          message: `More than ${max} blank line${max === 1 ? '' : 's'} not allowed`,
          fix: {
            range: [keepOffset, offset],
            text: '',
          },
        });
      }
      consecutiveBlanks = 0;
    }

    offset += line.length + 1;
  }

  // Handle trailing blank lines at end of file
  if (consecutiveBlanks > max) {
    let keepOffset = blankRunStart;
    const startIdx = lines.length - consecutiveBlanks;
    for (let k = 0; k < max; k++) {
      keepOffset += lines[startIdx + k].length + 1;
    }

    results.push({
      line: startIdx + max + 1,
      column: 1,
      message: `More than ${max} blank line${max === 1 ? '' : 's'} not allowed`,
      fix: {
        range: [keepOffset, offset - 1],
        text: '',
      },
    });
  }

  return results;
}

module.exports = { meta, check };
