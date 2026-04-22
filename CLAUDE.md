# CLAUDE.md — vtl-lint

## What this project is

vtl-lint is a regex-based linter for Velocity Template Language (VTL) files, built for dotCMS projects. It ships as a Node.js CLI tool (`npx vtl-lint`) with a JSON config file (`.vtllintrc.json`) that the team shares — same model as eslint/prettier.

This is v0.1.0. It must work reliably out of the box. If something is broken, then rip team (do report it tho).

## Quick start (using vtl-lint in your dotCMS project)

```bash
npm install --save-dev vtl-lint
npx vtl-lint "templates/**/*.vtl"
npx vtl-lint --fix "templates/**/*.vtl"       # autofix formatting issues
npx vtl-lint --fix-dry-run "templates/**/*.vtl" # preview fixes without writing
```

Config lives in `.vtllintrc.json` at your project root. See SETUP.md for full team setup including pre-commit hooks and CI.

## Project structure

```
bin/vtl-lint.js          CLI entry point
src/
  cli.js                 Arg parsing, file glob resolution, orchestration
  config.js              Config loader — walks up dirs for .vtllintrc.json, merges with defaults
  runner.js              Reads files, runs enabled rules, handles fix+write cycle
  fixer.js               Applies text replacements by character offset (handles CRLF, BOM)
  reporter.js            Colored stdout output in file:line:col format
  index.js               Public API (lint, lintFiles, loadConfig)
  rules/
    index.js             Rule registry — all rules registered here
    <rule-name>.js       One file per rule
defaults/
  dotcms-viewtools.json  60 known dotCMS viewtool keys from toolbox.xml
test/
  rules.test.js          Unit tests (node:test, 28 tests)
  fixtures/              Sample .vtl files for testing
```

## Rules

| Rule | Fixable | What it checks |
|------|---------|----------------|
| no-trailing-whitespace | Yes | Trailing spaces/tabs on lines |
| indent | Yes | Tabs vs spaces consistency (configurable style + width) |
| max-line-length | No | Line length exceeds configured max |
| no-multiple-blank-lines | Yes | Consecutive blank lines exceeding configured max |
| eol-last | Yes | File must end with a newline |
| silent-reference | No | `$var` in output context should be `$!var` to avoid printing "null" |
| variable-naming | No | Naming convention for `#set` variables (camelCase, snake_case, PascalCase, UPPER_CASE) |
| block-matching | No | Unclosed `#if`/`#foreach`/`#macro`/`#define` or extra `#end` |
| known-viewtools | No | `$tool.method()` where `$tool` is not in the dotCMS preset |

## How rules work

Every rule module exports `{ meta, check }`:

- `meta`: `{ name, description, fixable }` — metadata only.
- `check(lines, source, options)`: receives the file split into lines, the raw source string, and rule-specific options from config. Returns an array of diagnostics:

```js
{
  line: 5,           // 1-based line number
  column: 12,        // 1-based column (optional, defaults to 1)
  message: "...",    // Human-readable message
  fix: {             // Optional — only for fixable rules
    range: [50, 55], // Character offsets in the source string
    text: ""         // Replacement text
  }
}
```

Rules never write files. They return diagnostics and optional fix objects. The runner and fixer handle the rest.

## How autofix works

1. Runner collects all diagnostics with a `fix` property.
2. Fixer sorts fixes by offset descending (back-to-front), skips overlapping ones, applies the rest.
3. Runner writes the fixed file, then re-lints to report remaining unfixable issues.

Back-to-front application is critical — it preserves character offsets for subsequent fixes.

Only formatting rules (whitespace, indentation, blank lines, EOF newline) offer fixes. Rules that change semantics (variable names, references) are report-only. This is intentional — renaming a variable in one place without updating all references would break the template.

## How config works

Config is loaded from `.vtllintrc.json`, searched upward from cwd. Each rule entry is either:

- `"off" | "warn" | "error"` — severity only, default options
- `["warn", { "option": "value" }]` — severity + options

If no config file is found, built-in defaults apply (defined in `src/config.js` `DEFAULT_CONFIG`).

CLI flags (`--fix`, `--fix-dry-run`, `--quiet`, `--config`) override config values.

## Key behaviors to know

- **silent-reference skips known viewtools.** dotCMS viewtools ($dotcontent, $velutil, etc.) are always initialized by the framework — they never produce "null". The rule loads `defaults/dotcms-viewtools.json` and excludes them.
- **known-viewtools skips #foreach loop variables.** It parses `#foreach($item in ...)` and adds `$item` to the allowed set so it isn't flagged as an unknown viewtool.
- **Fixer preserves line endings.** Files with CRLF (`\r\n`) get normalized to LF for offset calculation, then restored to CRLF before writing. UTF-8 BOM is also preserved.
- **variable-naming only checks `#set` declarations.** It doesn't scan all `$variable` references — only the variable being assigned in `#set($varName = ...)`.

## IDE integration (fix-on-save)

vtl-lint has no native IDE plugin. Use your IDE's "run command on save" feature to get prettier-style fix-on-save behavior.

**VS Code** — install the "Run on Save" extension (`emeraldwalk.RunOnSave`), then add to `.vscode/settings.json`:

```json
{
  "emeraldwalk.runonsave": {
    "commands": [
      {
        "match": "\\.vtl$",
        "cmd": "npx vtl-lint --fix ${file}"
      }
    ]
  }
}
```

**JetBrains (WebStorm/IntelliJ)** — Settings > Tools > File Watchers. Add a watcher:

- File type: `*.vtl`
- Program: `npx`
- Arguments: `vtl-lint --fix $FilePath$`
- Output paths to refresh: `$FilePath$`

Both run `vtl-lint --fix` on the saved file automatically. Only fixable rules (formatting) are applied — non-fixable rules (naming, block matching, silent refs) are reported but not changed.

## Running tests

```bash
npm test
```

Uses `node:test` (built-in, no test framework dependency). All 28 tests must pass. Tests are in `test/rules.test.js`, one describe block per rule.

## Adding a new rule

1. Create `src/rules/<rule-name>.js` exporting `{ meta, check }`.
2. Register it in `src/rules/index.js`: `registerRule('rule-name', require('./rule-name'))`.
3. Add a default entry in `DEFAULT_CONFIG` in `src/config.js`.
4. Add tests in `test/rules.test.js`.
5. Update `.vtllintrc.json` with the new rule.

## Known limitations (v0.1.0)

- **Regex-based, not a parser.** The linter does not build an AST. Edge cases with complex nested string literals, multi-line expressions, or `#evaluate` with dynamic VTL may produce false positives. This is acceptable for v1 — the rules are conservative.
- **silent-reference uses line-level heuristics.** It skips directive lines entirely (lines starting with `#set`, `#if`, etc.). A `$variable` on the same line as HTML output but after an inline `#if` may be missed or falsely flagged.
- **block-matching is scope-unaware.** It counts `#if`/`#end` pairs but doesn't track which `#end` closes which `#if`. A misplaced `#end` in a nested block will be detected as imbalanced, but the error message points to the opener, not the specific misplaced closer.
- **No `#macro` call validation.** The linter doesn't check if `#macro` calls match defined signatures.

## Do not

- Do not add autofix to `variable-naming` or `silent-reference` — renaming without updating all references breaks templates.
- Do not remove viewtools from `defaults/dotcms-viewtools.json` without checking the dotCMS toolbox.xml source of truth.
- Do not change rule `check()` signatures — `(lines, source, options)` is the contract all 9 rules follow.
- Do not add dependencies unless absolutely necessary. The only runtime dep is `glob`. Keep it that way.
