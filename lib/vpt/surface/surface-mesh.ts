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

import { CatmullCurve2D } from '../../math/catmull-curve';
import { DragPoint } from '../../math/dragpoint';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { RenderVertex, Vertex2D } from '../../math/vertex2d';
import { Mesh } from '../mesh';
import { Table } from '../table/table';
import { SurfaceData } from './surface-data';

export class SurfaceMesh {

	public generateMeshes(data: SurfaceData, table: Table): { top?: Mesh, side?: Mesh } {

		const topMesh = new Mesh(`surface.top-${data.getName()}`);
		const sideMesh = new Mesh(`surface.side-${data.getName()}`);

		const vvertex: RenderVertex[] = DragPoint.getRgVertex<RenderVertex>(data.dragPoints, () => new RenderVertex(), CatmullCurve2D.fromVertex2D as any);
		const rgtexcoord = DragPoint.getTextureCoords(data.dragPoints, vvertex);

		const numVertices = vvertex.length;
		const rgnormal: Vertex2D[] = [];

		for (let i = 0; i < numVertices; i++) {

			const pv1 = vvertex[i];
			const pv2 = vvertex[(i < numVertices - 1) ? (i + 1) : 0];
			const dx = pv1.x - pv2.x;
			const dy = pv1.y - pv2.y;

			const invLen = 1.0 / Math.sqrt(dx * dx + dy * dy);

			rgnormal[i] = new Vertex2D();
			rgnormal[i].x = dy * invLen;
			rgnormal[i].y = dx * invLen;
		}

		const bottom = data.heightbottom * table.getScaleZ() + table.getTableHeight();
		const top = data.heighttop * table.getScaleZ() + table.getTableHeight();

		let offset = 0;

		// Render side
		for (let i = 0; i < numVertices; i++) {

			const pv1 = vvertex[i];
			const pv2 = vvertex[(i < numVertices - 1) ? (i + 1) : 0];

			const a = (i === 0) ? (numVertices - 1) : (i - 1);
			const c = (i < numVertices - 1) ? (i + 1) : 0;

			const vnormal = [new Vertex2D(), new Vertex2D()];
			if (pv1.fSmooth) {
				vnormal[0].x = (rgnormal[a].x + rgnormal[i].x) * 0.5;
				vnormal[0].y = (rgnormal[a].y + rgnormal[i].y) * 0.5;
			} else {
				vnormal[0].x = rgnormal[i].x;
				vnormal[0].y = rgnormal[i].y;
			}

			if (pv2.fSmooth) {
				vnormal[1].x = (rgnormal[i].x + rgnormal[c].x) * 0.5;
				vnormal[1].y = (rgnormal[i].y + rgnormal[c].y) * 0.5;
			} else {
				vnormal[1].x = rgnormal[i].x;
				vnormal[1].y = rgnormal[i].y;
			}

			vnormal[0].normalize();
			vnormal[1].normalize();

			sideMesh.vertices[offset] = new Vertex3DNoTex2();
			sideMesh.vertices[offset + 1] = new Vertex3DNoTex2();
			sideMesh.vertices[offset + 2] = new Vertex3DNoTex2();
			sideMesh.vertices[offset + 3] = new Vertex3DNoTex2();

			sideMesh.vertices[offset].x = pv1.x;
			sideMesh.vertices[offset].y = pv1.y;
			sideMesh.vertices[offset].z = bottom;
			sideMesh.vertices[offset + 1].x = pv1.x;
			sideMesh.vertices[offset + 1].y = pv1.y;
			sideMesh.vertices[offset + 1].z = top;
			sideMesh.vertices[offset + 2].x = pv2.x;
			sideMesh.vertices[offset + 2].y = pv2.y;
			sideMesh.vertices[offset + 2].z = top;
			sideMesh.vertices[offset + 3].x = pv2.x;
			sideMesh.vertices[offset + 3].y = pv2.y;
			sideMesh.vertices[offset + 3].z = bottom;

			if (data.szSideImage) {
				sideMesh.vertices[offset].tu = rgtexcoord[i];
				sideMesh.vertices[offset].tv = 1.0;

				sideMesh.vertices[offset + 1].tu = rgtexcoord[i];
				sideMesh.vertices[offset + 1].tv = 0;

				sideMesh.vertices[offset + 2].tu = rgtexcoord[c];
				sideMesh.vertices[offset + 2].tv = 0;

				sideMesh.vertices[offset + 3].tu = rgtexcoord[c];
				sideMesh.vertices[offset + 3].tv = 1.0;
			}

			sideMesh.vertices[offset].nx = vnormal[0].x;
			sideMesh.vertices[offset].ny = -vnormal[0].y;
			sideMesh.vertices[offset].nz = 0;

			sideMesh.vertices[offset + 1].nx = vnormal[0].x;
			sideMesh.vertices[offset + 1].ny = -vnormal[0].y;
			sideMesh.vertices[offset + 1].nz = 0;

			sideMesh.vertices[offset + 2].nx = vnormal[1].x;
			sideMesh.vertices[offset + 2].ny = -vnormal[1].y;
			sideMesh.vertices[offset + 2].nz = 0;

			sideMesh.vertices[offset + 3].nx = vnormal[1].x;
			sideMesh.vertices[offset + 3].ny = -vnormal[1].y;
			sideMesh.vertices[offset + 3].nz = 0;

			offset += 4;
		}

		// prepare index buffer for sides
		let offset2 = 0;
		for (let i = 0; i < numVertices; i++) {
			sideMesh.indices[i * 6] = offset2;
			sideMesh.indices[i * 6 + 1] = offset2 + 1;
			sideMesh.indices[i * 6 + 2] = offset2 + 2;
			sideMesh.indices[i * 6 + 3] = offset2;
			sideMesh.indices[i * 6 + 4] = offset2 + 2;
			sideMesh.indices[i * 6 + 5] = offset2 + 3;

			offset2 += 4;
		}

		// draw top
		const vpoly: number[] = [];
		for (let i = 0; i < numVertices; i++) {
			vpoly[i] = i;
		}

		topMesh.indices = Mesh.polygonToTriangles(vvertex, vpoly);

		const numPolys = topMesh.indices.length / 3;
		if (numPolys === 0) {
			// no polys to render leave vertex buffer undefined
			return {};
		}

		const heightNotDropped = data.heighttop * table.getScaleZ();
		const heightDropped = data.heightbottom * table.getScaleZ() + 0.1;

		const dim = table.getDimensions();
		const invTablewidth = 1.0 / dim.width;
		const invTableheight = 1.0 / dim.height;

		const vertsTop: Vertex3DNoTex2[][] = [[], [], []];
		for (let i = 0; i < numVertices; i++) {

			const pv0 = vvertex[i];

			vertsTop[0][i] = new Vertex3DNoTex2();
			vertsTop[0][i].x = pv0.x;
			vertsTop[0][i].y = pv0.y;
			vertsTop[0][i].z = heightNotDropped + table.getTableHeight();
			vertsTop[0][i].tu = pv0.x * invTablewidth;
			vertsTop[0][i].tv = pv0.y * invTableheight;
			vertsTop[0][i].nx = 0;
			vertsTop[0][i].ny = 0;
			vertsTop[0][i].nz = 1.0;

			vertsTop[1][i] = new Vertex3DNoTex2();
			vertsTop[1][i].x = pv0.x;
			vertsTop[1][i].y = pv0.y;
			vertsTop[1][i].z = heightDropped;
			vertsTop[1][i].tu = pv0.x * invTablewidth;
			vertsTop[1][i].tv = pv0.y * invTableheight;
			vertsTop[1][i].nx = 0;
			vertsTop[1][i].ny = 0;
			vertsTop[1][i].nz = 1.0;

			vertsTop[2][i] = new Vertex3DNoTex2();
			vertsTop[2][i].x = pv0.x;
			vertsTop[2][i].y = pv0.y;
			vertsTop[2][i].z = data.heightbottom;
			vertsTop[2][i].tu = pv0.x * invTablewidth;
			vertsTop[2][i].tv = pv0.y * invTableheight;
			vertsTop[2][i].nx = 0;
			vertsTop[2][i].ny = 0;
			vertsTop[2][i].nz = -1.0;
		}
		topMesh.vertices = vertsTop[0];

		const meshes: { top?: Mesh, side?: Mesh } = {};
		if (topMesh.vertices.length > 0 && data.fTopBottomVisible) {
			meshes.top = topMesh;
		}
		if (top !== bottom && data.fSideVisible) {
			meshes.side = sideMesh;
		}
		return meshes;
	}
}
