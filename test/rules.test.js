const { describe, it } = require('node:test');
const assert = require('node:assert');

const noTrailingWhitespace = require('../src/rules/no-trailing-whitespace');
const indent = require('../src/rules/indent');
const maxLineLength = require('../src/rules/max-line-length');
const noMultipleBlankLines = require('../src/rules/no-multiple-blank-lines');
const eolLast = require('../src/rules/eol-last');
const silentReference = require('../src/rules/silent-reference');
const variableNaming = require('../src/rules/variable-naming');
const blockMatching = require('../src/rules/block-matching');
const knownViewtools = require('../src/rules/known-viewtools');

function toLines(source) {
  return source.split(/\r?\n/);
}

describe('no-trailing-whitespace', () => {
  it('detects trailing spaces', () => {
    const src = 'hello   \nworld\n';
    const results = noTrailingWhitespace.check(toLines(src), src, {});
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].line, 1);
    assert.ok(results[0].fix);
  });

  it('passes clean lines', () => {
    const src = 'hello\nworld\n';
    const results = noTrailingWhitespace.check(toLines(src), src, {});
    assert.strictEqual(results.length, 0);
  });
});

describe('indent', () => {
  it('detects tabs when spaces expected', () => {
    const src = '\t<p>hello</p>\n';
    const results = indent.check(toLines(src), src, { style: 'spaces', width: 2 });
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].fix);
  });

  it('detects spaces when tabs expected', () => {
    const src = '  <p>hello</p>\n';
    const results = indent.check(toLines(src), src, { style: 'tabs', width: 2 });
    assert.strictEqual(results.length, 1);
  });

  it('passes correct indentation', () => {
    const src = '  <p>hello</p>\n';
    const results = indent.check(toLines(src), src, { style: 'spaces', width: 2 });
    assert.strictEqual(results.length, 0);
  });
});

describe('max-line-length', () => {
  it('detects long lines', () => {
    const src = 'a'.repeat(130) + '\n';
    const results = maxLineLength.check(toLines(src), src, { max: 120 });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].line, 1);
  });

  it('passes short lines', () => {
    const src = 'hello world\n';
    const results = maxLineLength.check(toLines(src), src, { max: 120 });
    assert.strictEqual(results.length, 0);
  });
});

describe('no-multiple-blank-lines', () => {
  it('detects triple blank lines', () => {
    const src = 'hello\n\n\n\nworld\n';
    const results = noMultipleBlankLines.check(toLines(src), src, { max: 1 });
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].fix);
  });

  it('allows single blank line', () => {
    const src = 'hello\n\nworld\n';
    const results = noMultipleBlankLines.check(toLines(src), src, { max: 1 });
    assert.strictEqual(results.length, 0);
  });
});

describe('eol-last', () => {
  it('detects missing final newline', () => {
    const src = 'hello';
    const results = eolLast.check(toLines(src), src, {});
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].fix);
  });

  it('passes with final newline', () => {
    const src = 'hello\n';
    const results = eolLast.check(toLines(src), src, {});
    assert.strictEqual(results.length, 0);
  });
});

describe('silent-reference', () => {
  it('flags loud references in output context', () => {
    const src = '<p>$userName</p>\n';
    const results = silentReference.check(toLines(src), src, { enforce: 'always' });
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].message.includes('$!userName'));
  });

  it('skips directive lines', () => {
    const src = '#set($userName = "test")\n#if($userName)\n#end\n';
    const results = silentReference.check(toLines(src), src, { enforce: 'always' });
    assert.strictEqual(results.length, 0);
  });

  it('skips known viewtools', () => {
    const src = '<p>$dotcontent.pull("+contentType:Blog")</p>\n';
    const results = silentReference.check(toLines(src), src, { enforce: 'always' });
    assert.strictEqual(results.length, 0);
  });

  it('skips comment lines', () => {
    const src = '## $userName is set above\n';
    const results = silentReference.check(toLines(src), src, { enforce: 'always' });
    assert.strictEqual(results.length, 0);
  });
});

describe('variable-naming', () => {
  it('flags snake_case when camelCase expected', () => {
    const src = '#set($my_var = "test")\n';
    const results = variableNaming.check(toLines(src), src, { convention: 'camelCase' });
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].message.includes('my_var'));
  });

  it('flags camelCase when snake_case expected', () => {
    const src = '#set($myVar = "test")\n';
    const results = variableNaming.check(toLines(src), src, { convention: 'snake_case' });
    assert.strictEqual(results.length, 1);
  });

  it('passes matching convention', () => {
    const src = '#set($myVar = "test")\n';
    const results = variableNaming.check(toLines(src), src, { convention: 'camelCase' });
    assert.strictEqual(results.length, 0);
  });

  it('ignores single-character variables', () => {
    const src = '#set($i = 0)\n';
    const results = variableNaming.check(toLines(src), src, { convention: 'camelCase' });
    assert.strictEqual(results.length, 0);
  });
});

describe('block-matching', () => {
  it('detects unclosed #if', () => {
    const src = '#if($x)\n  <p>hello</p>\n';
    const results = blockMatching.check(toLines(src), src, {});
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].message.includes('Unclosed #if'));
  });

  it('detects extra #end', () => {
    const src = '#end\n';
    const results = blockMatching.check(toLines(src), src, {});
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].message.includes('Unexpected #end'));
  });

  it('passes balanced blocks', () => {
    const src = '#if($x)\n  <p>hello</p>\n#end\n';
    const results = blockMatching.check(toLines(src), src, {});
    assert.strictEqual(results.length, 0);
  });

  it('handles nested blocks', () => {
    const src = '#if($x)\n  #foreach($i in $list)\n    <p>$i</p>\n  #end\n#end\n';
    const results = blockMatching.check(toLines(src), src, {});
    assert.strictEqual(results.length, 0);
  });

  it('skips directives inside comments', () => {
    const src = '## #if($x)\nhello\n';
    const results = blockMatching.check(toLines(src), src, {});
    assert.strictEqual(results.length, 0);
  });
});

describe('known-viewtools', () => {
  it('passes known dotcms viewtools', () => {
    const src = '$dotcontent.pull("+contentType:Blog")\n$navtool.getNav("/")\n';
    const results = knownViewtools.check(toLines(src), src, { preset: 'dotcms', extra: [] });
    assert.strictEqual(results.length, 0);
  });

  it('flags unknown viewtools', () => {
    const src = '$foobar.doStuff()\n';
    const results = knownViewtools.check(toLines(src), src, { preset: 'dotcms', extra: [] });
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].message.includes('foobar'));
  });

  it('allows extra viewtools from config', () => {
    const src = '$customTool.run()\n';
    const results = knownViewtools.check(toLines(src), src, { preset: 'dotcms', extra: ['customTool'] });
    assert.strictEqual(results.length, 0);
  });

  it('ignores foreach loop variables', () => {
    const src = '#foreach($item in $items)\n$item.name\n#end\n';
    const results = knownViewtools.check(toLines(src), src, { preset: 'dotcms', extra: [] });
    assert.strictEqual(results.length, 0);
  });
});
