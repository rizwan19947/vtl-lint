const meta = {
  name: 'block-matching',
  description: 'Detect unclosed or extra #if/#foreach/#macro blocks and #end directives',
  fixable: false,
};

const COMMENT_LINE = /^\s*##/;

// Block-opening directives
const BLOCK_OPEN = /#(if|foreach|macro|define)\b/g;

// Block-closing directive
const BLOCK_CLOSE = /#end\b/g;

function check(lines, source, options) {
  const results = [];
  const stack = []; // { directive, line }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comment lines
    if (COMMENT_LINE.test(line)) continue;

    // Strip string literals to avoid false matches inside strings
    const stripped = line.replace(/"[^"]*"|'[^']*'/g, '""');

    let match;

    // Find block openers
    BLOCK_OPEN.lastIndex = 0;
    while ((match = BLOCK_OPEN.exec(stripped)) !== null) {
      stack.push({
        directive: match[1],
        line: i + 1,
        column: match.index + 1,
      });
    }

    // Find block closers
    BLOCK_CLOSE.lastIndex = 0;
    while ((match = BLOCK_CLOSE.exec(stripped)) !== null) {
      if (stack.length === 0) {
        results.push({
          line: i + 1,
          column: match.index + 1,
          message: 'Unexpected #end without a matching opening directive',
        });
      } else {
        stack.pop();
      }
    }
  }

  // Any remaining items on the stack are unclosed
  for (const open of stack) {
    results.push({
      line: open.line,
      column: open.column,
      message: `Unclosed #${open.directive} — missing #end`,
    });
  }

  return results;
}

module.exports = { meta, check };
