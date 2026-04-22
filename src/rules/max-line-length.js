const meta = {
  name: 'max-line-length',
  description: 'Enforce a maximum line length',
  fixable: false,
};

function check(lines, source, options) {
  const max = options.max || 120;
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.length > max) {
      results.push({
        line: i + 1,
        column: max + 1,
        message: `Line length ${line.length} exceeds maximum ${max}`,
      });
    }
  }

  return results;
}

module.exports = { meta, check };
