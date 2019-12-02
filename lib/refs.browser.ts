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

export { BrowserBinaryReader as BinaryReader } from './io/binary-reader.browser';
export { storage } from './io/storage.browser';
export { exportGltf } from './gltf/export-gltf.browser';
export { now } from './util/time.browser';
export {
	Object3D, Mesh, Box3, Scene, AnimationClip, KeyframeTrack, PropertyBinding, Camera, ClampToEdgeWrapping,
	DoubleSide, InterpolateDiscrete, InterpolateLinear, LinearFilter, LinearMipMapLinearFilter, LinearMipMapNearestFilter,
	MirroredRepeatWrapping, NearestFilter, NearestMipMapLinearFilter, NearestMipMapNearestFilter, PixelFormat,
	RepeatWrapping, TriangleFanDrawMode, TriangleStripDrawMode, BufferAttribute, BufferGeometry, Geometry,
	InterleavedBufferAttribute, Light, Material, Color, Matrix4, Vector3, Bone, Texture, Math,
	PointLight, Group, MeshStandardMaterial, Face3, Matrix3, Vector2, Path, Shape, ExtrudeBufferGeometry,
	Float32BufferAttribute, Line, RGBAFormat, UnsignedByteType, TextureLoader, DataTexture, FloatType, SpotLight,
	LoadingManager, DataTextureLoader, TextureDataType, DefaultLoadingManager, HalfFloatType, LinearEncoding,
	RGBEEncoding, RGBEFormat, RGBFormat, AdditiveBlending, PointLightHelper,
} from 'three';
export { getTextFile } from './scripting/vbs-scripts.browser';
export { ThreeTextureLoaderBrowser as ThreeTextureLoader } from './render/threejs/three-texture-loader-browser';
export { HowlerSoundAdapter as SoundAdapter } from './audio/howler/howler-adapter';

// polyfills
if (typeof(window) !== 'undefined') {
	(window as any).Buffer = require('buffer/').Buffer;
}
