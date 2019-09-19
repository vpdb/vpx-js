/*
 * VPDB - Virtual Pinball Database
 * Copyright (C) 2019 freezy <freezy@vpdb.io>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
const { FileLoader } = require('three/build/three.module');

export { NodeBinaryReader as BinaryReader } from './io/binary-reader.node';
export { exportGltf } from './gltf/export-gltf.node';
export { now } from './util/time.node';

/*
 * Here we patch three.js' file loader to accept buffers directly.
 */
const originalFileLoaderLoad = FileLoader.prototype.load;
// tslint:disable-next-line:only-arrow-functions
FileLoader.prototype.load = function(urlOrBuffer: any, onLoad?: (response: string | ArrayBuffer) => void, onProgress?: (request: ProgressEvent) => void, onError?: (event: ErrorEvent) => void) {
	if (typeof urlOrBuffer === 'string') {
		return originalFileLoaderLoad(urlOrBuffer, onLoad, onProgress, onError);
	}
	if (onLoad) {
		onLoad(urlOrBuffer);
	}
};
