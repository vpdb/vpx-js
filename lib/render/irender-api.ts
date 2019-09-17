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

import { IRenderable } from '../game/irenderable';
import { Storage } from '../io/ole-doc';
import { Matrix3D } from '../math/matrix3d';
import { Binary } from '../vpt/binary';
import { LightData } from '../vpt/light/light-data';
import { Mesh } from '../vpt/mesh';
import { Table, TableGenerateOptions } from '../vpt/table/table';

export interface IRenderApi<NODE, GEOMETRY, POINT_LIGHT> {

	/**
	 * Applies global transformations to the scene.
	 *
	 * Use this to size and rotate the playfield to a suitable position.
	 *
	 * @param scene Root table node
	 * @param table Table
	 */
	transformScene(scene: NODE, table: Table): void;

	/**
	 * Creates a new parent node.
	 *
	 * @param name Name of the node
	 */
	createParentNode(name: string): NODE;

	/**
	 * Adds a child to a parent node.
	 *
	 * @param parent Parent node
	 * @param child Child node
	 */
	addChildToParent(parent: NODE, child: NODE | POINT_LIGHT): void;

	/**
	 * Retrieves a child node from a parent node.
	 *
	 * @param parent Parent node
	 * @param name Name of the child node
	 */
	findInGroup(parent: NODE, name: string): NODE | undefined;

	/**
	 * Removes a child from a parent node
	 *
	 * @param parent The parent node
	 * @param child The child node to remove
	 */
	removeFromParent(parent: NODE, child: NODE | undefined): void;

	/**
	 * Applies a matrix transformation to a node.
	 *
	 * @param matrix The transformation matrix
	 * @param node The node to transform. Does nothing if not set.
	 */
	applyMatrixToNode(matrix: Matrix3D, node: NODE | undefined): void;

	/**
	 * Updates a node with a new mesh.
	 *
	 * @param mesh New mesh. Must contain the same number of vertices as the node.
	 * @param node The node to which the new mesh is applied to.
	 */
	applyMeshToNode(mesh: Mesh, node: NODE | undefined): void;

	/**
	 * Creates a new node based on a renderable.
	 *
	 * @param renderable The renderable from the VPX file
	 * @param table The table object
	 * @param opts Options, see {@link TableGenerateOptions}.
	 */
	createObjectFromRenderable(renderable: IRenderable, table: Table, opts: TableGenerateOptions): Promise<NODE>;

	/**
	 * Creates a playfield light geometry.
	 *
	 * @param lightData Light parameters from the VPX file
	 * @param table The table object
	 */
	createLightGeometry(lightData: LightData, table: Table): GEOMETRY;

	/**
	 * Creates the playfield geometry.
	 *
	 * @param table The table object
	 * @param opts Options, see {@link TableGenerateOptions}.
	 */
	createPlayfieldGeometry(table: Table, opts: TableGenerateOptions): GEOMETRY;

	/**
	 * Creates a new point light.
	 *
	 * @param lightData Light parameters from the VPX file.
	 */
	createPointLight(lightData: LightData): POINT_LIGHT;
}

export interface ITextureLoader<TEXTURE> {

	loadTexture(name: string, data: Buffer): Promise<TEXTURE>;

	loadRawTexture(name: string, data: Buffer, width: number, height: number): Promise<TEXTURE>;

	loadDefaultTexture(name: string, fileName: string): Promise<TEXTURE>;

	// loadImage(name: string, data: Buffer, width: number, height: number): Promise<IMAGE>;
	//
	// loadRawImage(name: string, data: RAW_IMAGE, width: number, height: number): Promise<IMAGE>;
	//
	// getRawImage(data: Buffer, width: number, height: number): Promise<RAW_IMAGE>;

	//streamImage(storage: Storage, storageName?: string, binary?: Binary, localPath?: string): Promise<Buffer>;
}

export interface MeshConvertOptions {
	applyMaterials?: boolean;
	applyTextures?: ITextureLoader<any>;
	optimizeTextures?: boolean;
}
