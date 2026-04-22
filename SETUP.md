# vtl-lint — Team Setup Guide

## 1. Install in your dotCMS project

```bash
npm install --save-dev vtl-lint
```

## 2. Add a shared config

Create `.vtllintrc.json` in your project root:

```json
{
  "fix": false,
  "rules": {
    "no-trailing-whitespace": "error",
    "indent": ["warn", { "style": "spaces", "width": 2 }],
    "max-line-length": ["warn", { "max": 120 }],
    "no-multiple-blank-lines": ["error", { "max": 1 }],
    "eol-last": "error",
    "silent-reference": ["error", { "enforce": "always" }],
    "variable-naming": ["warn", { "convention": "camelCase" }],
    "block-matching": "error",
    "known-viewtools": ["warn", { "preset": "dotcms", "extra": [] }]
  }
}
```

Commit this file to the repo so the whole team shares the same rules.

## 3. Add an npm script

In your project's `package.json`:

```json
{
  "scripts": {
    "lint:vtl": "vtl-lint \"templates/**/*.vtl\"",
    "lint:vtl:fix": "vtl-lint --fix \"templates/**/*.vtl\""
  }
}
```

Adjust the glob pattern to match where your `.vtl` files live.

## 4. Pre-commit hook (optional but recommended)

Install husky and lint-staged:

```bash
npm install --save-dev husky lint-staged
npx husky init
```

Add to your project's `package.json`:

```json
{
  "lint-staged": {
    "*.vtl": "vtl-lint",
    "*.{js,jsx}": "eslint --fix",
    "*.css": "prettier --write"
  }
}
```

Edit `.husky/pre-commit` to contain:

```bash
npx lint-staged
```

Now every `git commit` will automatically lint staged `.vtl` files and block the commit if there are errors.

## 5. CI — GitHub Actions (optional but recommended)

Create `.github/workflows/lint.yml` in your dotCMS project:

```yaml
name: Lint VTL

on:
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx vtl-lint "templates/**/*.vtl"
```

To enforce it: GitHub repo → Settings → Branches → Branch protection rules → Require "Lint VTL" to pass before merging.

## CLI Reference

```bash
# Lint files
npx vtl-lint "templates/**/*.vtl"

# Autofix formatting issues
npx vtl-lint --fix "templates/**/*.vtl"

# Preview fixes without writing
npx vtl-lint --fix-dry-run "templates/**/*.vtl"

# Use a custom config
npx vtl-lint --config ./custom-config.json "**/*.vtl"

# Only show errors (hide warnings)
npx vtl-lint --quiet "**/*.vtl"
```

## Rule Reference

| Rule | Fixable | Description |
|------|---------|-------------|
| `no-trailing-whitespace` | Yes | No trailing spaces/tabs |
| `indent` | Yes | Enforce spaces or tabs |
| `max-line-length` | No | Max characters per line |
| `no-multiple-blank-lines` | Yes | Limit consecutive blank lines |
| `eol-last` | Yes | File must end with newline |
| `silent-reference` | No | Use `$!var` instead of `$var` in output |
| `variable-naming` | No | Enforce camelCase, snake_case, etc. |
| `block-matching` | No | Detect unclosed #if/#foreach/#macro |
| `known-viewtools` | No | Flag unknown `$tool.method()` calls |

### Rule severity

Each rule accepts `"off"`, `"warn"`, or `"error"`, or an array with options:

```json
"rule-name": "error"
"rule-name": ["warn", { "option": "value" }]
```

### Rule options

- **indent**: `{ "style": "spaces"|"tabs", "width": 2 }`
- **max-line-length**: `{ "max": 120 }`
- **no-multiple-blank-lines**: `{ "max": 1 }`
- **silent-reference**: `{ "enforce": "always"|"never" }`
- **variable-naming**: `{ "convention": "camelCase"|"snake_case"|"PascalCase"|"UPPER_CASE", "ignore": [] }`
- **known-viewtools**: `{ "preset": "dotcms", "extra": ["customTool1", "customTool2"] }`
