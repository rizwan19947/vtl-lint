const { glob } = require('glob');
const path = require('path');
const { loadConfig } = require('./config');
const { lintFiles } = require('./runner');
const { report } = require('./reporter');

function printHelp() {
  console.log(`
Usage: vtl-lint [options] <glob patterns...>

Options:
  --fix              Automatically fix fixable problems
  --config <path>    Path to config file (default: .vtllintrc.json)
  --quiet            Only report errors, not warnings
  --no-color         Disable colored output
  -h, --help         Show this help message
  -v, --version      Show version number

Examples:
  vtl-lint "templates/**/*.vtl"
  vtl-lint --fix "src/**/*.vtl"
  vtl-lint --config ./team-config.json "**/*.vtl"
`.trim());
}

function parseArgs(argv) {
  const args = {
    patterns: [],
    fix: false,
    configPath: null,
    quiet: false,
    color: true,
    help: false,
    version: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--fix':
        args.fix = true;
        break;
      case '--config':
        args.configPath = argv[++i];
        break;
      case '--quiet':
        args.quiet = true;
        break;
      case '--no-color':
        args.color = false;
        break;
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '-v':
      case '--version':
        args.version = true;
        break;
      default:
        if (!arg.startsWith('--')) {
          args.patterns.push(arg);
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exitCode = 1;
          return null;
        }
    }
  }

  return args;
}

async function cli(argv) {
  const args = parseArgs(argv);
  if (!args) return 1;

  if (args.help) {
    printHelp();
    return 0;
  }

  if (args.version) {
    const pkg = require('../package.json');
    console.log(pkg.version);
    return 0;
  }

  if (args.patterns.length === 0) {
    console.error('Error: No file patterns provided. Use --help for usage.');
    return 1;
  }

  // Resolve files from glob patterns
  let files = [];
  for (const pattern of args.patterns) {
    const matches = await glob(pattern, { absolute: true, nodir: true });
    files.push(...matches);
  }

  // Deduplicate
  files = [...new Set(files)];

  if (files.length === 0) {
    console.log('No files matched the provided patterns.');
    return 0;
  }

  // Load config
  const config = loadConfig(args.configPath);

  // Apply CLI overrides
  if (args.fix) {
    config.fix = true;
  }

  // Run linter
  const results = await lintFiles(files, config);

  // Report
  const { errorCount, warningCount } = report(results, {
    quiet: args.quiet,
    color: args.color,
  });

  if (errorCount > 0) return 1;
  return 0;
}

module.exports = { cli, parseArgs };
