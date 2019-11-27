'use strict';

// create json file with build information

const path = require('path');
const fs = require('fs');

const timestamp = Date.now();
const version = require('../package.json').version;

const targetFile = path.join(__dirname, '..', 'dist', 'build.json');
const buildInformation = {
	version,
	timestamp,
};
fs.writeFileSync(targetFile, JSON.stringify(buildInformation));
