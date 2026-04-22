const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  fix: false,
  rules: {
    'no-trailing-whitespace': 'error',
    'indent': ['warn', { style: 'spaces', width: 2 }],
    'max-line-length': ['warn', { max: 120 }],
    'no-multiple-blank-lines': ['error', { max: 1 }],
    'eol-last': 'error',
    'silent-reference': ['error', { enforce: 'always' }],
    'variable-naming': ['warn', { convention: 'camelCase' }],
    'block-matching': 'error',
    'known-viewtools': ['warn', { preset: 'dotcms', extra: [] }],
  },
};

/**
 * Normalize a rule entry into { severity, options }.
 * Accepts: "off", "warn", "error", or ["warn", { ...options }]
 */
function normalizeRule(entry) {
  if (typeof entry === 'string') {
    return { severity: entry, options: {} };
  }
  if (Array.isArray(entry)) {
    return { severity: entry[0], options: entry[1] || {} };
  }
  return { severity: 'off', options: {} };
}

/**
 * Search for .vtllintrc.json up the directory tree from cwd.
 */
function findConfigFile() {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const candidate = path.join(dir, '.vtllintrc.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }
  return null;
}

/**
 * Load and merge config. Priority: explicit path > discovered file > defaults.
 */
function loadConfig(explicitPath) {
  let userConfig = {};

  const configPath = explicitPath || findConfigFile();

  if (configPath) {
    const resolvedPath = path.resolve(configPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Config file not found: ${resolvedPath}`);
      process.exit(1);
    }
    try {
      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      userConfig = JSON.parse(raw);
    } catch (err) {
      console.error(`Error reading config file: ${err.message}`);
      process.exit(1);
    }
  }

  // Merge: user rules override defaults
  const mergedRules = { ...DEFAULT_CONFIG.rules };
  if (userConfig.rules) {
    for (const [ruleId, value] of Object.entries(userConfig.rules)) {
      mergedRules[ruleId] = value;
    }
  }

  return {
    fix: userConfig.fix ?? DEFAULT_CONFIG.fix,
    rules: mergedRules,
  };
}

module.exports = { loadConfig, normalizeRule, DEFAULT_CONFIG };
