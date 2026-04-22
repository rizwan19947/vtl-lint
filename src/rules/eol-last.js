const meta = {
  name: 'eol-last',
  description: 'Require a newline at the end of the file',
  fixable: true,
};

function check(lines, source, options) {
  if (source.length === 0) return [];

  const results = [];

  if (!source.endsWith('\n')) {
    results.push({
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
      message: 'File must end with a newline',
      fix: {
        range: [source.length, source.length],
        text: '\n',
      },
    });
  }

  return results;
}

module.exports = { meta, check };
