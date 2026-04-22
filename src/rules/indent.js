const meta = {
  name: 'indent',
  description: 'Enforce consistent indentation (spaces or tabs)',
  fixable: true,
};

const LEADING_WS = /^([ \t]*)/;

function check(lines, source, options) {
  const style = options.style || 'spaces';
  const width = options.width || 2;
  const results = [];
  let offset = 0;

  const badChar = style === 'spaces' ? '\t' : ' ';
  const badCharName = style === 'spaces' ? 'tab' : 'space';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = LEADING_WS.exec(line);
    const indent = match ? match[1] : '';

    if (indent.length > 0 && indent.includes(badChar)) {
      // Build the replacement indent
      let fixedIndent;
      if (style === 'spaces') {
        // Replace each tab with `width` spaces
        fixedIndent = indent.replace(/\t/g, ' '.repeat(width));
      } else {
        // Replace every `width` spaces with a tab
        fixedIndent = indent.replace(new RegExp(` {${width}}`, 'g'), '\t');
      }

      results.push({
        line: i + 1,
        column: 1,
        message: `Expected ${style} for indentation, found ${badCharName}s`,
        fix: {
          range: [offset, offset + indent.length],
          text: fixedIndent,
        },
      });
    }

    // Check for mixed indentation even if primary char is correct
    if (indent.length > 0 && !indent.includes(badChar)) {
      const hasMixed = /[ \t]/.test(indent) && /\t/.test(indent) && / /.test(indent);
      if (hasMixed) {
        results.push({
          line: i + 1,
          column: 1,
          message: 'Mixed spaces and tabs for indentation',
        });
      }
    }

    offset += line.length + 1;
  }

  return results;
}

module.exports = { meta, check };
