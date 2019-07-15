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

import { Vertex3DNoTex2 } from '../../math/vertex';
import { Mesh } from '../mesh';
import { Table } from '../table';
import { PlungerType } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerDesc } from './plunger-desc';

const PLUNGER_FRAME_COUNT = 25;

export class PlungerMesh {

	private readonly table: Table;
	private readonly data: PlungerData;

	public readonly cFrames: number;
	private readonly zHeight: number;
	private readonly stroke: number;
	private readonly beginY: number;
	private readonly endY: number;
	private readonly invScale: number;
	private readonly dyPerFrame: number;
	private readonly circlePoints: number;
	private readonly zScale: number;
	private readonly srcCells: number;
	private readonly cellWid: number;

	/** Rod bottom position */
	private rodY: number;
	private springLoops: number;
	private springEndLoops: number;
	private springGauge: number;
	private springRadius: number;
	private readonly springMinSpacing: number;

	private lathePoints!: number;
	private vtsPerFrame!: number;
	private indicesPerFrame!: number;
	private desc!: PlungerDesc;

	constructor(data: PlungerData, table: Table) {
		this.data = data;
		this.table = table;
		this.zHeight = table.getSurfaceHeight(data.szSurface, data.center.x, data.center.y) + data.zAdjust;
		this.stroke = data.stroke!;
		this.beginY = data.center.y;
		this.endY = data.center.y - this.stroke;
		this.cFrames = Math.floor(PLUNGER_FRAME_COUNT * (this.stroke * (1.0 / 80.0))) + 1; // 25 frames per 80 units travel
		this.invScale = (this.cFrames > 1) ? (1.0 / (this.cFrames - 1)) : 0.0;
		this.dyPerFrame = (this.endY - this.beginY) * this.invScale;
		this.circlePoints = (data.type === PlungerType.Flat) ? 0 : 24;
		this.springLoops = 0.0;
		this.springEndLoops = 0.0;
		this.springGauge = 0.0;
		this.springRadius = 0.0;
		this.springMinSpacing = 2.2;
		this.rodY = this.beginY + data.height;
		this.zScale = table.getScaleZ();

		// note the number of cells in the source image
		this.srcCells = data.animFrames || 1;
		if (this.srcCells < 1) {
			this.srcCells = 1;
		}

		// figure the width in relative units (0..1) of each cell
		this.cellWid = 1.0 / this.srcCells;
	}

	public generateMeshes(frame: number): { rod?: Mesh, spring?: Mesh, flat?: Mesh } {

		this.desc = this.getDesc();

		// get the number of lathe points from the descriptor
		this.lathePoints = this.desc.n;

		this.calculateFrameRenderingDetails();

		if (this.data.type === PlungerType.Flat) {
			return { flat: this.buildFlatMesh(frame) };
		} else {
			const rod = this.buildRodMesh(frame);
			const spring = this.buildSpringMesh(frame, rod.vertices);
			return { rod, spring };
		}
	}

	private getDesc(): PlungerDesc {
		switch (this.data.type) {

			case PlungerType.Modern:
				return PlungerDesc.getModern();

			case PlungerType.Flat:
				return PlungerDesc.getFlat();

			case PlungerType.Custom:
				const result = PlungerDesc.getCustom(this.data, this.beginY, this.springMinSpacing);
				this.rodY = result.rody;
				this.springGauge = result.springGauge;
				this.springRadius = result.springRadius;
				this.springLoops = result.springLoops;
				this.springEndLoops = result.springEndLoops;
				return result.desc;
		}
	}

	private calculateFrameRenderingDetails(): void {

		if (this.data.type === PlungerType.Flat) {
			// For the flat plunger, we render every frame as a simple
			// flat rectangle.  This requires four vertices for the corners,
			// and two triangles -> 6 indices.
			this.vtsPerFrame = 4;
			this.indicesPerFrame = 6;

		} else {

			// For all other plungers, we render one circle per lathe
			// point.  Each circle has 'circlePoints' vertices.  We
			// also need to render the spring:  this consists of 3
			// spirals, where each sprial has 'springLoops' loops
			// times 'circlePoints' vertices.
			const latheVts = this.lathePoints * this.circlePoints;
			const springVts = Math.floor((this.springLoops + this.springEndLoops) * this.circlePoints) * 3;
			this.vtsPerFrame = latheVts + springVts;

			// For the lathed section, we need two triangles == 6
			// indices for every point on every lathe circle past
			// the first.  (We connect pairs of lathe circles, so
			// the first one doesn't count: two circles -> one set
			// of triangles, three circles -> two sets, etc).
			const latheIndices = 6 * this.circlePoints * (this.lathePoints - 1);

			// For the spring, we need 4 triangles == 12 indices
			// for every matching set of three vertices on the
			// three spirals, not counting the first set (as above,
			// we're connecting adjacent sets, so the first doesn't
			// count).  We already counted the total number of
			// vertices, so divide that by 3 to get the number
			// of sets.  12*vts/3 = 4*vts.
			//
			// The spring only applies to the custom plunger.
			let springIndices = 0;
			if (this.data.type === PlungerType.Custom) {
				springIndices = (4 * springVts) - 12;
				if (springIndices < 0) {
					springIndices = 0;
				}
			}

			// the total number of indices is simply the sum of the
			// lathe and spring indices
			this.indicesPerFrame = latheIndices + springIndices;
		}
	}

	/**
	 * Build the rod mesh
	 *
	 * Go around in a circle starting at the top, stepping through 'circlePoints'
	 * angles along the circle. Start the texture mapping in the middle, so that
	 * the centerline of the texture maps to the centerline of the top of the
	 * cylinder surface. Work outwards on the texture to wrap it around the
	 * cylinder.
	 *
	 * @param i
	 */
	private buildRodMesh(i: number): Mesh {

		const mesh = new Mesh('rod');
		const yTip = this.beginY + this.dyPerFrame * i;

		const stepU = 1.0 / this.circlePoints;
		let tu = 0.51;
		for (let l = 0, offset = 0; l < this.circlePoints; l++, offset += this.lathePoints, tu += stepU) {
			// Go down the long axis, adding a vertex for each point
			// in the descriptor list at the current lathe angle.
			if (tu > 1.0) {
				tu -= 1.0;
			}
			const angle = ((Math.PI * 2.0) / this.circlePoints) * l;
			const sn = Math.sin(angle);
			const cs = Math.cos(angle);
			for (let m = 0; m < this.lathePoints; m++) {
				const pm = new Vertex3DNoTex2();
				const c = this.desc.c[m];

				// get the current point's coordinates
				let y = c.y + yTip;
				const r = c.r;
				let tv = c.tv;

				// the last coordinate is always the bottom of the rod
				if (m + 1 === this.lathePoints) {

					// set the end point
					y = this.rodY;

					// Figure the texture mapping for the rod position.  This is
					// important because we draw the rod with varying length -
					// the part that's pulled back beyond the 'rody' point is
					// hidden.  We want the texture to maintain the same apparent
					// position and scale in each frame, so we need to figure the
					// proportional point of the texture at our cut-off point on
					// the object surface.
					const ratio = i * this.invScale;
					tv = mesh.vertices[m - 1].tv + (tv - mesh.vertices[m - 1].tv) * ratio;
				}

				// figure the point coordinates
				pm.x = r * (sn * this.data.width) + this.data.center.x;
				pm.y = y;
				pm.z = (r * (cs * this.data.width) + this.data.width + this.zHeight) * this.zScale;
				pm.nx = c.nx * sn;
				pm.ny = c.ny;
				pm.nz = -c.nx * cs;
				pm.tu = tu;
				pm.tv = tv;

				mesh.vertices.push(pm);
			}
		}

		// set up the vertex list for the lathe circles
		let k = 0;
		const latheVts = this.lathePoints * this.circlePoints;
		for (let l = 0, offset = 0; l < this.circlePoints; l++, offset += this.lathePoints) {
			for (let m = 0; m < this.lathePoints - 1; m++) {
				mesh.indices[k++] = (m + offset) % latheVts;
				mesh.indices[k++] = (m + offset + this.lathePoints) % latheVts;
				mesh.indices[k++] = (m + offset + 1 + this.lathePoints) % latheVts;

				mesh.indices[k++] = (m + offset + 1 + this.lathePoints) % latheVts;
				mesh.indices[k++] = (m + offset + 1) % latheVts;
				mesh.indices[k++] = (m + offset) % latheVts;
			}
		}
		return mesh;
	}

	/**
	 * Build the spring mesh
	 *
	 * We build this as wedge shape wrapped around a spiral. So we actually
	 * have three spirals: the front edge, the top edge, and the back edge.
	 * The y extent is the length of the rod; the rod starts at the
	 * second-to-last entry and ends at the last entry.  But the actual base
	 * position of the spring is fixed at the end of the shaft, which might
	 * differ from the on-screen position of the last point in that the rod
	 * can be visually cut off by the length adjustment.
	 *
	 * So use the true rod base (rody) position to figure the spring length.
	 *
	 * @param i
	 * @param rodVertices
	 */
	private buildSpringMesh(i: number, rodVertices: Vertex3DNoTex2[]): Mesh {

		const mesh = new Mesh('spring');
		const springGaugeRel = this.springGauge / this.data.width;

		const offset = this.circlePoints * this.lathePoints;
		const y0 = rodVertices[offset - 2].y;
		const y1 = this.rodY;
		let n = Math.floor((this.springLoops + this.springEndLoops) * this.circlePoints);
		const nEnd = Math.floor(this.springEndLoops * this.circlePoints);
		const nMain = n - nEnd;
		const yEnd = this.springEndLoops * this.springGauge * this.springMinSpacing;
		const dyMain = (y1 - y0 - yEnd) / (nMain - 1);
		let dy = yEnd / (nEnd - 1);
		const dTheta = (Math.PI * 2.0) / (this.circlePoints - 1) + Math.PI / (n - 1);
		for (let theta = Math.PI, y = y0; n !== 0; --n, theta += dTheta, y += dy) {

			if (n === nMain) {
				dy = dyMain;
			}

			if (theta >= Math.PI * 2.0) {
				theta -= Math.PI * 2.0;
			}

			const sn = Math.sin(theta);
			const cs = Math.cos(theta);

			// set the point on the front spiral
			let pm = new Vertex3DNoTex2();
			pm.x = this.springRadius * (sn * this.data.width) + this.data.center.x;
			pm.y = y - this.springGauge;
			pm.z = (this.springRadius * (cs * this.data.width) + this.data.width + this.zHeight) * this.zScale;
			pm.nx = 0.0;
			pm.ny = -1.0;
			pm.nz = 0.0;
			pm.tu = (sn + 1.0) * 0.5;
			pm.tv = 0.76;
			mesh.vertices.push(pm);

			// set the point on the top spiral
			pm = new Vertex3DNoTex2();
			pm.x = (this.springRadius + springGaugeRel / 1.5) * (sn * this.data.width) + this.data.center.x;
			pm.y = y;
			pm.z = ((this.springRadius + springGaugeRel / 1.5) * (cs * this.data.width) + this.data.width + this.zHeight) * this.zScale;
			pm.nx = sn;
			pm.ny = 0.0;
			pm.nz = -cs;
			pm.tu = (sn + 1.0) * 0.5;
			pm.tv = 0.85;
			mesh.vertices.push(pm);

			// set the point on the back spiral
			pm = new Vertex3DNoTex2();
			pm.x = this.springRadius * (sn * this.data.width) + this.data.center.x;
			pm.y = y + this.springGauge;
			pm.z = (this.springRadius * (cs * this.data.width) + this.data.width + this.zHeight) * this.zScale;
			pm.nx = 0.0;
			pm.ny = 1.0;
			pm.nz = 0.0;
			pm.tu = (sn + 1.0) * 0.5;
			pm.tv = 0.98;
			mesh.vertices.push(pm);
		}

		// set up the vertex list for the spring
		let k = 0;
		for (i = 0; i < mesh.vertices.length; i += 3) {
			const v = mesh.vertices[i + 1];
			// Direct3D only renders faces if the vertices are in clockwise
			// order.  We want to render the spring all the way around, so
			// we need to use different vertex ordering for faces that are
			// above and below the vertical midpoint on the spring.  We
			// can use the z normal from the center spiral to determine
			// whether we're at a top or bottom face.  Note that all of
			// the springs in all frames have the same relative position
			// on the spiral, so we can use the first spiral as a proxy
			// for all of them - the only thing about the spring that
			// varies from frame to frame is the length of the spiral.
			if (v.nz <= 0.0) {
				// top half vertices
				mesh.indices[k++] = i;
				mesh.indices[k++] = i + 3;
				mesh.indices[k++] = i + 1;

				mesh.indices[k++] = i + 1;
				mesh.indices[k++] = i + 3;
				mesh.indices[k++] = i + 4;

				mesh.indices[k++] = i + 4;
				mesh.indices[k++] = i + 5;
				mesh.indices[k++] = i + 2;

				mesh.indices[k++] = i + 2;
				mesh.indices[k++] = i + 1;
				mesh.indices[k++] = i + 4;

			} else {
				// bottom half vertices
				mesh.indices[k++] = i + 3;
				mesh.indices[k++] = i;
				mesh.indices[k++] = i + 4;

				mesh.indices[k++] = i + 4;
				mesh.indices[k++] = i;
				mesh.indices[k++] = i + 1;

				mesh.indices[k++] = i + 1;
				mesh.indices[k++] = i + 2;
				mesh.indices[k++] = i + 5;

				mesh.indices[k++] = i + 5;
				mesh.indices[k++] = i + 1;
				mesh.indices[k++] = i + 2;
			}
		}
		return mesh;
	}

	/**
	 * Flat plunger - overlay the alpha image on a rectangular surface.
	 * @param i
	 */
	private buildFlatMesh(i: number): Mesh {

		const mesh = new Mesh('flat');

		const yTip = this.beginY + this.dyPerFrame * i;
		const vertices = mesh.vertices;

		// Figure the corner coordinates.
		//
		// The tip of the plunger for this frame is at 'height', which is the
		// nominal y position (m_d.m_v.y) plus the portion of the stroke length
		// for the current frame.  (The 0th frame is the most retracted position;
		// the cframe-1'th frame is the most forward position.)  The base is at
		// the nominal y position plus m_d.m_height.
		const xLt = this.data.center.x - this.data.width;
		const xRt = this.data.center.x + this.data.width;
		const yTop = yTip;
		const yBot = this.beginY + this.data.height;

		// Figure the z coordinate.
		//
		// For the shaped plungers, the vertical extent is determined by placing
		// the long axis at the plunger's nominal width (m_d.m_width) above the
		// playfield (or whatever the base surface is).  Since those are modeled
		// roughly as cylinders with the main shaft radius at about 1/4 the nominal
		// width, the top point is at about 1.25 the nominal width and the bulk
		// is between 1x and 1.25x the nominal width above the base surface.  To
		// get approximately the same effect, we place our rectangular surface at
		// 1.25x the width above the base surface.  The table author can tweak this
		// using the ZAdjust property, which is added to the zheight base level.
		//
		const z = (this.zHeight + this.data.width * 1.25) * this.zScale;

		// Figure out which animation cell we're using.  The source image might not
		// (and probably does not) have the same number of cells as the frame list
		// we're generating, since our frame count depends on the stroke length.
		// So we need to interpolate between the image cells and the generated frames.
		//
		// The source image is arranged with the fully extended image in the leftmost
		// cell and the fully retracted image in the rightmost cell.  Our frame
		// numbering is just the reverse, so figure the cell number in right-to-left
		// order to simplify the texture mapping calculations.
		let cellIdx = this.srcCells - 1 - Math.floor((i * this.srcCells / this.cFrames) + 0.5);
		if (cellIdx < 0) {
			cellIdx = 0;
		}

		// Figure the texture coordinates.
		//
		// The y extent (tv) maps to the top portion of the image with height
		// proportional to the current frame's height relative to the overall height.
		// Our frames vary in height to display the motion of the plunger.  The
		// animation cells are all the same height, so we need to map to the
		// proportional vertical share of the cell.  The images in the cells are
		// top-justified, so we always start at the top of the cell.
		//
		// The x extent is the full width of the current cell.
		const tuLocal = this.cellWid * cellIdx;
		const tvLocal = (yBot - yTop) / (this.beginY + this.data.height - this.endY);

		// Fill in the four corner vertices.
		// Vertices are (in order): bottom left, top left, top right, bottom right.
		vertices[0].x = xLt;        vertices[0].nx = 0.0;          vertices[0].tu = tuLocal;           // left
		vertices[0].y = yBot;       vertices[0].ny = 0.0;          vertices[0].tv = tvLocal;           // bottom
		vertices[0].z = z;          vertices[0].nz = -1.0;
		vertices[1].x = xLt;        vertices[1].nx = 0.0;          vertices[1].tu = tuLocal;           // left
		vertices[1].y = yTop;       vertices[1].ny = 0.0;          vertices[1].tv = 0.0;               // top
		vertices[1].z = z;          vertices[1].nz = -1.0;
		vertices[2].x = xRt;        vertices[2].nx = 0.0;          vertices[2].tu = tuLocal + this.cellWid; // right
		vertices[2].y = yTop;       vertices[2].ny = 0.0;          vertices[2].tv = 0.0;                    // top
		vertices[2].z = z;          vertices[2].nz = -1.0;
		vertices[3].x = xRt;        vertices[3].nx = 0.0;          vertices[3].tu = tuLocal + this.cellWid; // right
		vertices[3].y = yBot;       vertices[3].ny = 0.0;          vertices[3].tv = tvLocal;                // bottom
		vertices[3].z = z;          vertices[3].nz = -1.0;

		// for the flat rectangle, we just need two triangles:
		// bottom left - top left - top right
		// and top right - bottom right - bottom left
		mesh.indices[0] = 0;
		mesh.indices[1] = 1;
		mesh.indices[2] = 2;

		mesh.indices[3] = 2;
		mesh.indices[4] = 3;
		mesh.indices[5] = 0;

		return mesh;
	}
}
