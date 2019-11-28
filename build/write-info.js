'use strict';

// create json file with build information

const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');

const timestamp = Date.now();
const version = require('../package.json').version;
const gitHash = childProcess.execSync('git rev-parse --short HEAD').toString().trim();
const gitBranch = childProcess.execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

const targetFile = path.join(__dirname, '..', 'dist', 'build.json');
const buildInformation = {
	version,
	timestamp,
	gitHash,
	gitBranch,
};
fs.writeFileSync(targetFile, JSON.stringify(buildInformation));
