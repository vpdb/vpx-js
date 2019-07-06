
export { BrowserBinaryReader as BinaryReader } from './io/binary-reader.browser';
export { loadImage, getRawImage, streamImage, BrowserImage as Image } from './gltf/image.browser';
export { exportGltf } from './gltf/export-gltf.browser';

// polyfills
if (typeof(window) !== 'undefined') {
	(window as any).Buffer = require('buffer/').Buffer;
}
