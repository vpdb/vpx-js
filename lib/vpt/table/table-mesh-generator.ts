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

/* tslint:disable:no-bitwise */
import { BufferGeometry, ExtrudeBufferGeometry, Shape, Vector2 } from 'three';
import { VpTableExporterOptions } from '../../gltf/table-exporter';
import { Vertex3DNoTex2 } from '../../math/vertex';
import { Mesh } from '../mesh';
import { Table } from './table';
import { TableData } from './table-data';

export class TableMeshGenerator {

	private readonly data: TableData;

	constructor(data: TableData) {
		this.data = data;
	}

	public getMesh(table: Table, opts: VpTableExporterOptions): BufferGeometry {
		/* istanbul ignore if */
		if (!this.data) {
			throw new Error('Table data is not loaded. Load table with tableDataOnly = false.');
		}
		let geometry: BufferGeometry;
		const dim = table.getDimensions();

		const pfShape = new Shape();
		pfShape.moveTo(this.data.left, this.data.top);
		pfShape.lineTo(this.data.right, this.data.top);
		pfShape.lineTo(this.data.right, this.data.bottom);
		pfShape.lineTo(this.data.left, this.data.bottom);
		pfShape.lineTo(this.data.left, this.data.top);

		// drill holes if playfield lights are rendered separately.
		if (opts.exportPlayfieldLights) {
			pfShape.holes = Object.values(table.lights)
				.filter(l => l.isPlayfieldLight(table))
				.map(l => l.getPath(table));
		}

		const invTableWidth = 1.0 / dim.width;
		const invTableHeight = 1.0 / dim.height;

		geometry = new ExtrudeBufferGeometry(pfShape, {
			depth: Table.playfieldThickness,
			bevelEnabled: false,
			steps: 1,
			UVGenerator: {
				generateSideWallUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number, indexD: number): Vector2[] {
					return [
						new Vector2(0, 0),
						new Vector2(0, 0),
						new Vector2(0, 0),
						new Vector2(0, 0),
					];
				},
				generateTopUV(g: ExtrudeBufferGeometry, vertices: number[], indexA: number, indexB: number, indexC: number): Vector2[] {
					const ax = vertices[indexA * 3];
					const ay = vertices[indexA * 3 + 1];
					const bx = vertices[indexB * 3];
					const by = vertices[indexB * 3 + 1];
					const cx = vertices[indexC * 3];
					const cy = vertices[indexC * 3 + 1];
					return [
						new Vector2(ax * invTableWidth, 1 - ay * invTableHeight),
						new Vector2(bx * invTableWidth, 1 - by * invTableHeight),
						new Vector2(cx * invTableWidth, 1 - cy * invTableHeight),
					];
				},
			},
		});

		return geometry;
	}

	/* istanbul ignore next */
	private get2DMesh(): Mesh {
		const rgv: Vertex3DNoTex2[] = [];
		for (let i = 0; i < 7; i++) {
			rgv.push(new Vertex3DNoTex2());
		}
		rgv[0].x = this.data.left;     rgv[0].y = this.data.top;      rgv[0].z = this.data.tableheight;
		rgv[1].x = this.data.right;    rgv[1].y = this.data.top;      rgv[1].z = this.data.tableheight;
		rgv[2].x = this.data.right;    rgv[2].y = this.data.bottom;   rgv[2].z = this.data.tableheight;
		rgv[3].x = this.data.left;     rgv[3].y = this.data.bottom;   rgv[3].z = this.data.tableheight;

		// These next 4 vertices are used just to set the extents
		rgv[4].x = this.data.left;     rgv[4].y = this.data.top;      rgv[4].z = this.data.tableheight + Table.playfieldThickness;
		rgv[5].x = this.data.left;     rgv[5].y = this.data.bottom;   rgv[5].z = this.data.tableheight + Table.playfieldThickness;
		rgv[6].x = this.data.right;    rgv[6].y = this.data.bottom;   rgv[6].z = this.data.tableheight + Table.playfieldThickness;
		//rgv[7].x=g_pplayer->m_ptable->m_right;    rgv[7].y=g_pplayer->m_ptable->m_top;      rgv[7].z=50.0f;

		for (let i = 0; i < 4; ++i) {
			rgv[i].nx = 0;
			rgv[i].ny = 0;
			rgv[i].nz = 1.0;

			rgv[i].tv = (i & 2) ? 1.0 : 0.0;
			rgv[i].tu = (i === 1 || i === 2) ? 1.0 : 0.0;
		}

		const playfieldPolyIndices = [ 0, 1, 3, 0, 3, 2, 2, 3, 5, 6 ];
		Mesh.setNormal(rgv, playfieldPolyIndices.splice(6), 4);

		const buffer: Vertex3DNoTex2[] = [];
		for (let i = 0; i < 7; i++) {
			buffer.push(new Vertex3DNoTex2());
		}
		let offs = 0;
		for (let y = 0; y <= 1; ++y) {
			for (let x = 0; x <= 1; ++x) {
				buffer[offs].x = (x & 1) ? rgv[1].x : rgv[0].x;
				buffer[offs].y = (y & 1) ? rgv[2].y : rgv[0].y;
				buffer[offs].z = rgv[0].z;

				buffer[offs].tu = (x & 1) ? rgv[1].tu : rgv[0].tu;
				buffer[offs].tv = (y & 1) ? rgv[2].tv : rgv[0].tv;

				buffer[offs].nx = rgv[0].nx;
				buffer[offs].ny = rgv[0].ny;
				buffer[offs].nz = rgv[0].nz;
				++offs;
			}
		}
		return new Mesh(buffer, playfieldPolyIndices);
	}
}
