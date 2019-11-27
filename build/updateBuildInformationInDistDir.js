'use strict';

// update the version and timestamp of the current build in the final artefact

const path = require('path');
const fs = require('fs');

const timestamp = Date.now();
const version = require('../package.json').version;

const distDirectory = path.join(__dirname, '..', 'dist');
const distCjs = path.join(distDirectory, 'cjs', 'lib', 'meta', 'index.js');
const distEsm = path.join(distDirectory, 'esm', 'lib', 'meta', 'index.js');

const cjsBuildInformation = fs.readFileSync(distCjs, 'utf8');
const updatedCjsBuildInformation = updateBuildInformation(cjsBuildInformation);
fs.writeFileSync(distCjs, updatedCjsBuildInformation);

const esmBuildInformation = fs.readFileSync(distEsm, 'utf8');
const updatedEsmBuildInformation = updateBuildInformation(esmBuildInformation);
fs.writeFileSync(distEsm, updatedEsmBuildInformation);

function updateBuildInformation(fileContent) {
	return fileContent
		.replace(/const\s+version\s*=.*/, 'const version = \'' + version + '\';')
		.replace(/const\s+buildTimestamp\s*=.*/, 'const buildTimestamp = ' + timestamp + ';');
}
