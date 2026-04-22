#!/usr/bin/env node

const { cli } = require('../src/cli');

const exitCode = cli(process.argv.slice(2));

if (exitCode instanceof Promise) {
  exitCode.then((code) => {
    process.exitCode = code;
  });
} else {
  process.exitCode = exitCode;
}
