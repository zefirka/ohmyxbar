#!/usr/bin/env node

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const build = require('../build');

const homedir = require('os').homedir();

let config;

try {
    config = require(argv.c || argv.config || `${homedir}/.ohmyxbarrc`);
} catch {
    config = {};
}

build.default(config);
