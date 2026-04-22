const meta = {
  name: 'no-trailing-whitespace',
  description: 'Disallow trailing whitespace at the end of lines',
  fixable: true,
};

const TRAILING_WS = /[ \t]+$/;

function check(lines, source, options) {
  const results = [];
  let offset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = TRAILING_WS.exec(line);

    if (match) {
      const wsStart = offset + match.index;
      const wsEnd = offset + line.length;

      results.push({
        line: i + 1,
        column: match.index + 1,
        message: 'Trailing whitespace',
        fix: {
          range: [wsStart, wsEnd],
          text: '',
        },
      });
    }

    // +1 for the newline character
    offset += line.length + 1;
  }

  return results;
}

module.exports = { meta, check };
