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

export type GltfId = number;

interface GltfNamedElement extends GltfElement {
	name?: any;
}

interface GltfElement {
	extensions?: any;
	extras?: any;
	[k: string]: any;
}

/**
 * Indices of those attributes that deviate from their initialization value.
 */
export interface GltfAccessorSparseIndices extends GltfElement {

	/**
	 * The index of the bufferView with sparse indices. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
	 */
	bufferView: GltfId;

	/**
	 * The offset relative to the start of the bufferView in bytes. Must be aligned.
	 */
	byteOffset?: number;

	/**
	 * The indices data type.
	 */
	componentType: 5121 | 5123 | 5125 | number;
}

/**
 * Array of size `accessor.sparse.count` times number of components storing the displaced accessor attributes pointed by `accessor.sparse.indices`.
 */
export interface GltfAccessorSparseValues extends GltfElement {

	/**
	 * The index of the bufferView with sparse values. Referenced bufferView can't have ARRAY_BUFFER or ELEMENT_ARRAY_BUFFER target.
	 */
	bufferView: GltfId;

	/**
	 * The offset relative to the start of the bufferView in bytes. Must be aligned.
	 */
	byteOffset?: number;
}

/**
 * Sparse storage of attributes that deviate from their initialization value.
 */
export interface GltfAccessorSparse extends GltfElement {

	/**
	 * Number of entries stored in the sparse array.
	 */
	count: number;

	/**
	 * Index array of size `count` that points to those accessor attributes that deviate from their initialization value. Indices must strictly increase.
	 */
	indices: GltfAccessorSparseIndices;

	/**
	 * Array of size `count` times number of components, storing the displaced accessor attributes pointed by `indices`. Substituted values must have the same `componentType` and number of components as the base accessor.
	 */
	values: GltfAccessorSparseValues;
}

/**
 * A typed view into a bufferView.  A bufferView contains raw binary data.  An accessor provides a typed view into a bufferView or a subset of a bufferView similar to how WebGL's `vertexAttribPointer()` defines an attribute in a buffer.
 */
export interface GltfAccessor extends GltfNamedElement {

	/**
	 * The index of the bufferView.
	 */
	bufferView?: GltfId;

	/**
	 * The offset relative to the start of the bufferView in bytes.
	 */
	byteOffset?: number;

	/**
	 * The datatype of components in the attribute.
	 */
	componentType: 5120 | 5121 | 5122 | 5123 | 5125 | 5126 | number;

	/**
	 * Specifies whether integer data values should be normalized.
	 */
	normalized?: boolean;

	/**
	 * The number of attributes referenced by this accessor.
	 */
	count: number;

	/**
	 * Specifies if the attribute is a scalar, vector, or matrix.
	 */
	type: 'SCALAR' | 'VEC2' | 'VEC3' | 'VEC4' | 'MAT2' | 'MAT3' | 'MAT4' | string;

	/**
	 * Maximum value of each component in this attribute.
	 */
	max?: number[];

	/**
	 * Minimum value of each component in this attribute.
	 */
	min?: number[];

	/**
	 * Sparse storage of attributes that deviate from their initialization value.
	 */
	sparse?: GltfAccessorSparse;
}

/**
 * The index of the node and TRS property that an animation channel targets.
 */
export interface GltfAnimationChannelTarget extends GltfElement {

	/**
	 * The index of the node to target.
	 */
	node?: GltfId;

	/**
	 * The name of the node's TRS property to modify, or the "weights" of the Morph Targets it instantiates. For the "translation" property, the values that are provided by the sampler are the translation along the x, y, and z axes. For the "rotation" property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the "scale" property, the values are the scaling factors along the x, y, and z axes.
	 */
	path: 'translation' | 'rotation' | 'scale' | 'weights' | string;
}

/**
 * Targets an animation's sampler at a node's property.
 */
export interface GltfAnimationChannel extends GltfElement {

	/**
	 * The index of a sampler in this animation used to compute the value for the target.
	 */
	sampler: GltfId;

	/**
	 * The index of the node and TRS property to target.
	 */
	target: GltfAnimationChannelTarget;
}

/**
 * Combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
 */
export interface GltfAnimationSampler extends GltfElement {

	/**
	 * The index of an accessor containing keyframe input values, e.g., time.
	 */
	input: GltfId;

	/**
	 * Interpolation algorithm.
	 */
	interpolation?: 'LINEAR' | 'STEP' | 'CUBICSPLINE' | string;

	/**
	 * The index of an accessor, containing keyframe output values.
	 */
	output: GltfId;
}

/**
 * A keyframe animation.
 */
export interface GltfAnimation extends GltfNamedElement {

	/**
	 * An array of channels, each of which targets an animation's sampler at a node's property. Different channels of the same animation can't have equal targets.
	 */
	channels: GltfAnimationChannel[];

	/**
	 * An array of samplers that combines input and output accessors with an interpolation algorithm to define a keyframe graph (but not its target).
	 */
	samplers: GltfAnimationSampler[];
}

/**
 * Metadata about the glTF asset.
 */
export interface GltfAsset extends GltfElement {

	/**
	 * A copyright message suitable for display to credit the content creator.
	 */
	copyright?: string;

	/**
	 * Tool that generated this glTF model.  Useful for debugging.
	 */
	generator?: string;

	/**
	 * The glTF version that this asset targets.
	 */
	version: string;

	/**
	 * The minimum glTF version that this asset targets.
	 */
	minVersion?: string;
}

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface GltfBuffer extends GltfNamedElement {

	/**
	 * The uri of the buffer.
	 */
	uri?: string | Buffer;

	/**
	 * The length of the buffer in bytes.
	 */
	byteLength: number;
}

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface GltfBufferView extends GltfNamedElement {

	/**
	 * The index of the buffer.
	 */
	buffer: GltfId;

	/**
	 * The offset into the buffer in bytes.
	 */
	byteOffset: number;

	/**
	 * The length of the bufferView in bytes.
	 */
	byteLength: number;

	/**
	 * The stride, in bytes.
	 */
	byteStride?: number;

	/**
	 * The target that the GPU buffer should be bound to.
	 */
	target?: 34962 | 34963 | number;
}

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface GltfCameraOrthographic extends GltfElement {

	/**
	 * The floating-point horizontal magnification of the view. Must not be zero.
	 */
	xmag: number;

	/**
	 * The floating-point vertical magnification of the view. Must not be zero.
	 */
	ymag: number;

	/**
	 * The floating-point distance to the far clipping plane. `zfar` must be greater than `znear`.
	 */
	zfar: number;

	/**
	 * The floating-point distance to the near clipping plane.
	 */
	znear: number;
}

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface GltfCameraPerspective extends GltfElement {

	/**
	 * The floating-point aspect ratio of the field of view.
	 */
	aspectRatio?: number;

	/**
	 * The floating-point vertical field of view in radians.
	 */
	yfov: number;

	/**
	 * The floating-point distance to the far clipping plane.
	 */
	zfar?: number;

	/**
	 * The floating-point distance to the near clipping plane.
	 */
	znear: number;
}

/**
 * A camera's projection.  A node can reference a camera to apply a transform to place the camera in the scene.
 */
export interface GltfCamera extends GltfNamedElement {

	/**
	 * An orthographic camera containing properties to create an orthographic projection matrix.
	 */
	orthographic?: GltfCameraOrthographic;

	/**
	 * A perspective camera containing properties to create a perspective projection matrix.
	 */
	perspective?: GltfCameraPerspective;

	/**
	 * Specifies if the camera uses a perspective or orthographic projection.
	 */
	type: 'perspective' | 'orthographic' | string;
}

/**
 * Image data used to create a texture. Image can be referenced by URI or `bufferView` index. `mimeType` is required in the latter case.
 */
export interface GltfImage extends GltfNamedElement {

	/**
	 * The uri of the image.
	 */
	uri?: string;

	/**
	 * The image's MIME type.
	 */
	mimeType?: 'image/jpeg' | 'image/png' | string;

	/**
	 * The index of the bufferView that contains the image. Use this instead of the image's uri property.
	 */
	bufferView?: GltfId;
}

/**
 * Reference to a texture.
 */
export interface GltfTextureInfo extends GltfElement {

	/**
	 * The index of the texture.
	 */
	index: GltfId;

	/**
	 * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
	 */
	texCoord?: number;
}

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export interface GltfMaterialPbrMetallicRoughness extends GltfElement {

	/**
	 * The material's base color factor.
	 */
	baseColorFactor?: number[];

	/**
	 * The base color texture.
	 */
	baseColorTexture?: GltfTextureInfo;

	/**
	 * The metalness of the material.
	 */
	metallicFactor?: number;

	/**
	 * The roughness of the material.
	 */
	roughnessFactor?: number;

	/**
	 * The metallic-roughness texture.
	 */
	metallicRoughnessTexture?: GltfTextureInfo;
}

export interface GltfMaterialNormalTextureInfo extends GltfElement {

	index?: any;
	texCoord?: any;

	/**
	 * The scalar multiplier applied to each normal vector of the normal texture.
	 */
	scale?: number;
}

export interface GltfMaterialOcclusionTextureInfo extends GltfElement {

	index?: any;
	texCoord?: any;

	/**
	 * A scalar multiplier controlling the amount of occlusion applied.
	 */
	strength?: number;
}

/**
 * The material appearance of a primitive.
 */
export interface GltfMaterial extends GltfNamedElement {

	/**
	 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology. When not specified, all the default values of `pbrMetallicRoughness` apply.
	 */
	pbrMetallicRoughness?: GltfMaterialPbrMetallicRoughness;

	/**
	 * The normal map texture.
	 */
	normalTexture?: GltfMaterialNormalTextureInfo;

	/**
	 * The occlusion map texture.
	 */
	occlusionTexture?: GltfMaterialOcclusionTextureInfo;

	/**
	 * The emissive map texture.
	 */
	emissiveTexture?: GltfTextureInfo;

	/**
	 * The emissive color of the material.
	 */
	emissiveFactor?: number[];

	/**
	 * The alpha rendering mode of the material.
	 */
	alphaMode?: 'OPAQUE' | 'MASK' | 'BLEND' | string;

	/**
	 * The alpha cutoff value of the material.
	 */
	alphaCutoff?: number;

	/**
	 * Specifies whether the material is double sided.
	 */
	doubleSided?: boolean;
}

/**
 * Geometry to be rendered with the given material.
 */
export interface GltfMeshPrimitive extends GltfElement {

	/**
	 * A dictionary object, where each key corresponds to mesh attribute semantic and each value is the index of the accessor containing attribute's data.
	 */
	attributes: {
		[k: string]: GltfId;
	};

	/**
	 * The index of the accessor that contains the indices.
	 */
	indices?: GltfId;

	/**
	 * The index of the material to apply to this primitive when rendering.
	 */
	material?: GltfId;

	/**
	 * The type of primitives to render.
	 */
	mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | number;

	/**
	 * An array of Morph Targets, each  Morph Target is a dictionary mapping attributes (only `POSITION`, `NORMAL`, and `TANGENT` supported) to their deviations in the Morph Target.
	 */
	targets?: Array<{
		[k: string]: GltfId;
	}>;
}

/**
 * A set of primitives to be rendered.  A node can contain one mesh.  A node's transform places the mesh in the scene.
 */
export interface GltfMesh extends GltfNamedElement {

	/**
	 * An array of primitives, each defining geometry to be rendered with a material.
	 */
	primitives: GltfMeshPrimitive[];
	/**
	 * Array of weights to be applied to the Morph Targets.
	 */
	weights?: number[];
}

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` must contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node can have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), only TRS properties may be present; `matrix` will not be present.
 */
export interface GltfNode extends GltfNamedElement {

	/**
	 * The index of the camera referenced by this node.
	 */
	camera?: GltfId;

	/**
	 * The indices of this node's children.
	 */
	children?: GltfId[];

	/**
	 * The index of the skin referenced by this node.
	 */
	skin?: GltfId;

	/**
	 * A floating-point 4x4 transformation matrix stored in column-major order.
	 */
	matrix?: number[];

	/**
	 * The index of the mesh in this node.
	 */
	mesh?: GltfId;

	/**
	 * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
	 */
	rotation?: number[];

	/**
	 * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
	 */
	scale?: number[];

	/**
	 * The node's translation along the x, y, and z axes.
	 */
	translation?: number[];

	/**
	 * The weights of the instantiated Morph Target. Number of elements must match number of Morph Targets of used mesh.
	 */
	weights?: number[];
}

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface GltfSampler extends GltfNamedElement {

	/**
	 * Magnification filter.
	 */
	magFilter?: 9728 | 9729 | number;

	/**
	 * Minification filter.
	 */
	minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987 | number;

	/**
	 * s wrapping mode.
	 */
	wrapS?: 33071 | 33648 | 10497 | number;

	/**
	 * t wrapping mode.
	 */
	wrapT?: 33071 | 33648 | 10497 | number;
}

/**
 * The root nodes of a scene.
 */
export interface GltfScene extends GltfNamedElement {
	/**
	 * The indices of each root node.
	 */
	nodes?: GltfId[];
}

/**
 * Joints and matrices defining a skin.
 */
export interface GltfSkin extends GltfNamedElement {

	/**
	 * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.  The default is that each matrix is a 4x4 identity matrix, which implies that inverse-bind matrices were pre-applied.
	 */
	inverseBindMatrices?: GltfId;

	/**
	 * The index of the node used as a skeleton root. When undefined, joints transforms resolve to scene root.
	 */
	skeleton?: GltfId;

	/**
	 * Indices of skeleton nodes, used as joints in this skin.
	 */
	joints: GltfId[];
}

/**
 * A texture and its sampler.
 */
export interface GltfTexture extends GltfNamedElement {

	/**
	 * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering should be used.
	 */
	sampler?: GltfId;

	/**
	 * The index of the image used by this texture.
	 */
	source?: GltfId;
}

/**
 * The root object for a glTF asset.
 */
export interface GltfFile extends GltfElement {

	/**
	 * Names of glTF extensions used somewhere in this asset.
	 */
	extensionsUsed?: string[];

	/**
	 * Names of glTF extensions required to properly load this asset.
	 */
	extensionsRequired?: string[];

	/**
	 * An array of accessors.
	 */
	accessors?: GltfAccessor[];

	/**
	 * An array of keyframe animations.
	 */
	animations?: GltfAnimation[];

	/**
	 * Metadata about the glTF asset.
	 */
	asset: GltfAsset;

	/**
	 * An array of buffers.
	 */
	buffers?: GltfBuffer[];

	/**
	 * An array of bufferViews.
	 */
	bufferViews?: GltfBufferView[];

	/**
	 * An array of cameras.
	 */
	cameras?: GltfCamera[];

	/**
	 * An array of images.
	 */
	images?: GltfImage[];

	/**
	 * An array of materials.
	 */
	materials?: GltfMaterial[];

	/**
	 * An array of meshes.
	 */
	meshes?: GltfMesh[];

	/**
	 * An array of nodes.
	 */
	nodes?: GltfNode[];

	/**
	 * An array of samplers.
	 */
	samplers?: GltfSampler[];

	/**
	 * The index of the default scene.
	 */
	scene?: GltfId;

	/**
	 * An array of scenes.
	 */
	scenes?: GltfScene[];

	/**
	 * An array of skins.
	 */
	skins?: GltfSkin[];

	/**
	 * An array of textures.
	 */
	textures?: GltfTexture[];
}
