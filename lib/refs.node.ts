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
import { FileLoader } from 'three';

export { NodeBinaryReader as BinaryReader } from './io/binary-reader.node';
export { exportGltf } from './gltf/export-gltf.node';
export { now } from './util/time.node';
export {
	Object3D, Mesh, Box3, Scene, AnimationClip, KeyframeTrack, PropertyBinding, Camera, ClampToEdgeWrapping,
	DoubleSide, InterpolateDiscrete, InterpolateLinear, LinearFilter, LinearMipMapLinearFilter, LinearMipMapNearestFilter,
	MirroredRepeatWrapping, NearestFilter, NearestMipMapLinearFilter, NearestMipMapNearestFilter, PixelFormat,
	RepeatWrapping, TriangleFanDrawMode, TriangleStripDrawMode, BufferAttribute, BufferGeometry, Geometry,
	InterleavedBufferAttribute, Light, Material, Color, Matrix4, Vector3, Bone, Texture, Math,
	PointLight, Group, MeshStandardMaterial, Face3, Matrix3, Vector2, Path, Shape, ExtrudeBufferGeometry,
	Float32BufferAttribute, Line, RGBAFormat, UnsignedByteType, TextureLoader, DataTexture, FloatType, SpotLight,
	LoadingManager, DataTextureLoader, TextureDataType, DefaultLoadingManager, HalfFloatType, LinearEncoding,
	RGBEEncoding, RGBEFormat, RGBFormat,
} from 'three';

/*
 * Here we patch three.js' file loader to accept buffers directly.
 */
const originalFileLoaderLoad = FileLoader.prototype.load;
// tslint:disable-next-line:only-arrow-functions
FileLoader.prototype.load = function(urlOrBuffer: any, onLoad?: (response: string | ArrayBuffer) => void, onProgress?: (request: ProgressEvent) => void, onError?: (event: ErrorEvent) => void) {
	/* istanbul ignore if: we don't it by url, but this should still work. */
	if (typeof urlOrBuffer === 'string') {
		return originalFileLoaderLoad(urlOrBuffer, onLoad, onProgress, onError);
	}
	if (onLoad) {
		onLoad(urlOrBuffer);
	}
};

/*
 * Node.js TextDecoder polyfills for Node.js v12
 * istanbul ignore if
 */
if (!('TextDecoder' in global)) {
	(global as any).TextDecoder = require('text-encoding').TextDecoder;
}
