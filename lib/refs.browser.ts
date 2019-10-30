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
export { _Math as Math } from 'three/src/math/Math';
export { AnimationClip } from 'three/src/animation/AnimationClip';
export { Bone } from 'three/src/objects/Bone';
export { Box3 } from 'three/src/math/Box3';
export { BufferAttribute } from 'three/src/core/BufferAttribute';
export { BufferGeometry } from 'three/src/core/BufferGeometry';
export { Camera } from 'three/src/cameras/Camera';
export { Color } from 'three/src/math/Color';
export { DataTexture } from 'three/src/textures/DataTexture';
export { DataTextureLoader } from 'three/src/loaders/DataTextureLoader';
export { ExtrudeBufferGeometry } from 'three/src/geometries/ExtrudeGeometry';
export { Face3 } from 'three/src/core/Face3';
export { Float32BufferAttribute } from 'three/src/core/BufferAttribute';
export { Geometry } from 'three/src/core/Geometry';
export { Group } from 'three/src/objects/Group';
export { InterleavedBufferAttribute } from 'three/src/core/InterleavedBufferAttribute';
export { KeyframeTrack } from 'three/src/animation/KeyframeTrack';
export { Light } from 'three/src/lights/Light';
export { Line } from 'three/src/objects/Line';
export { LoadingManager, DefaultLoadingManager } from 'three/src/loaders/LoadingManager';
export { Material } from 'three/src/materials/Material';
export { Matrix3 } from 'three/src/math/Matrix3';
export { Matrix4 } from 'three/src/math/Matrix4';
export { Mesh } from 'three/src/objects/Mesh';
export { MeshStandardMaterial } from 'three/src/materials/MeshStandardMaterial';
export { Object3D } from 'three/src/core/Object3D';
export { Path } from 'three/src/extras/core/Path';
export { PointLight } from 'three/src/lights/PointLight';
export { PropertyBinding } from 'three/src/animation/PropertyBinding';
export { Scene } from 'three/src/scenes/Scene';
export { Shape } from 'three/src/extras/core/Shape';
export { SpotLight } from 'three/src/lights/SpotLight';
export { Texture } from 'three/src/textures/Texture';
export { TextureLoader } from 'three/src/loaders/TextureLoader';
export { PointLightHelper } from 'three/src/helpers/PointLightHelper';
export { Vector2 } from 'three/src/math/Vector2';
export { Vector3 } from 'three/src/math/Vector3';
export { ClampToEdgeWrapping, DoubleSide, FloatType, InterpolateDiscrete, InterpolateLinear, LinearFilter,
	LinearMipMapLinearFilter, LinearMipMapNearestFilter, MirroredRepeatWrapping, NearestFilter,
	NearestMipMapLinearFilter, NearestMipMapNearestFilter, PixelFormat, RepeatWrapping, RGBAFormat, TriangleFanDrawMode,
	TriangleStripDrawMode, UnsignedByteType, TextureDataType, HalfFloatType, LinearEncoding, RGBEEncoding, RGBEFormat,
	RGBFormat,
} from 'three/src/constants';
export { getTextFile } from './scripting/vbs-scripts.browser';

// polyfills
if (typeof(window) !== 'undefined') {
	(window as any).Buffer = require('buffer/').Buffer;
}
