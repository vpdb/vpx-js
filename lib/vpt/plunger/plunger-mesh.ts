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

import { Table } from '../table';
import { PlungerType } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerDesc } from './plunger-desc';
import { Vertex3DNoTex2 } from '../../math/vertex';

const PLUNGER_FRAME_COUNT = 25;

export class PlungerMesh {

	private table: Table;
	private data: PlungerData;

	private zheight: number;
	private stroke: number;
	private beginy: number;
	private endy: number;
	private cframes: number;
	private inv_scale: number;
	private dyPerFrame: number;
	private circlePoints: number;
	private springLoops: number;
	private springEndLoops: number;
	private springGauge: number;
	private springRadius: number;
	private springMinSpacing: number;
	private rody: number;
	private zScale: number;
	private srcCells: number;
	private cellWid: number;
	private lathePoints!: number;
	private vtsPerFrame!: number;
	private indicesPerFrame!: number;

	constructor(data: PlungerData, table: Table) {
		this.data = data;
		this.table = table;
		this.zheight = table.getSurfaceHeight(data.szSurface, data.center.x, data.center.y) + data.zAdjust;
		this.stroke = data.stroke!;
		this.beginy = data.center.y;
		this.endy = data.center.y - this.stroke;
		this.cframes = Math.floor(PLUNGER_FRAME_COUNT * (this.stroke * (1.0 / 80.0))) + 1; // 25 frames per 80 units travel
		this.inv_scale = (this.cframes > 1) ? (1.0 / (this.cframes - 1)) : 0.0;
		this.dyPerFrame = (this.endy - this.beginy) * this.inv_scale;
		this.circlePoints = (data.type === PlungerType.Flat) ? 0 : 24;
		this.springLoops = 0.0;
		this.springEndLoops = 0.0;
		this.springGauge = 0.0;
		this.springRadius = 0.0;
		this.springMinSpacing = 2.2;
		this.rody = this.beginy + data.height;
		this.zScale = table.getScaleZ();

		// note the number of cells in the source image
		this.srcCells = data.animFrames || 1;
		if (this.srcCells < 1) {
			this.srcCells = 1;
		}

		// figure the width in relative units (0..1) of each cell
		this.cellWid = 1.0 / this.srcCells;
	}

	public generateMeshes(data: PlungerData, table: Table) {

		const desc = this.getDesc();

		// get the number of lathe points from the descriptor
		this.lathePoints = desc.n;

		this.calculateFrameRenderingDetails();

	}

	private getDesc(): PlungerDesc {
		switch (this.data.type) {
			case PlungerType.Modern:
				return PlungerDesc.getModern();
			case PlungerType.Flat:
				return PlungerDesc.getFlat();
			case PlungerType.Custom:
				const result = PlungerDesc.getCustom(this.data, this.beginy, this.springMinSpacing);
				this.rody = result.rody;
				this.springGauge = result.springGauge;
				this.springRadius = result.springRadius;
				this.springLoops = result.springLoops;
				this.springEndLoops = result.springEndLoops;
				return result.desc;
		}
	}

	private calculateFrameRenderingDetails(): void {
		let latheVts = 0;
		let springVts = 0;
		let latheIndices = 0;
		let springIndices = 0;
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
			latheVts = this.lathePoints * this.circlePoints;
			springVts = Math.floor((this.springLoops + this.springEndLoops) * this.circlePoints) * 3;
			this.vtsPerFrame = latheVts + springVts;

			// For the lathed section, we need two triangles == 6
			// indices for every point on every lathe circle past
			// the first.  (We connect pairs of lathe circles, so
			// the first one doesn't count: two circles -> one set
			// of triangles, three circles -> two sets, etc).
			latheIndices = 6 * this.circlePoints * (this.lathePoints - 1);

			// For the spring, we need 4 triangles == 12 indices
			// for every matching set of three vertices on the
			// three spirals, not counting the first set (as above,
			// we're connecting adjacent sets, so the first doesn't
			// count).  We already counted the total number of
			// vertices, so divide that by 3 to get the number
			// of sets.  12*vts/3 = 4*vts.
			//
			// The spring only applies to the custom plunger.
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

	private buildAnimationFrame(i: number, desc: PlungerDesc): void {

		// figure the relative spring gauge, in terms of the overall width
		const springGaugeRel = this.springGauge / this.data.width;

		const buf: Vertex3DNoTex2[] = [];
		const ytip = this.beginy + this.dyPerFrame * i;

		if (this.data.type !== PlungerType.Flat) {
			// Go around in a circle starting at the top, stepping through
			// 'circlePoints' angles along the circle.  Start the texture
			// mapping in the middle, so that the centerline of the texture
			// maps to the centerline of the top of the cylinder surface.
			// Work outwards on the texture to wrap it around the cylinder.
			let tu = 0.51;

			const stepU = 1.0 / this.circlePoints;
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
					const c = desc.c[m];
					buf[offset] = pm;

					// get the current point's coordinates
					let y = c.y + ytip;
					const r = c.r;
					let tv = c.tv;

					// the last coordinate is always the bottom of the rod
					if (m + 1 === this.lathePoints) {

						// set the end point
						y = this.rody;

						// Figure the texture mapping for the rod position.  This is
						// important because we draw the rod with varying length -
						// the part that's pulled back beyond the 'rody' point is
						// hidden.  We want the texture to maintain the same apparent
						// position and scale in each frame, so we need to figure the
						// proportional point of the texture at our cut-off point on
						// the object surface.
						const ratio = i * this.inv_scale;
						tv = buf[offset - 1].tv + (tv - buf[offset - 1].tv) * ratio;
					}

					// figure the point coordinates
					pm.x = r * (sn * this.data.width) + this.data.center.x;
					pm.y = y;
					pm.z = (r * (cs * this.data.width) + this.data.width + this.zheight) * this.zScale;
					pm.nx = c.nx * sn;
					pm.ny = c.ny;
					pm.nz = -c.nx * cs;
					pm.tu = tu;
					pm.tv = tv;
				}
			}
		}

		// Build the flat plunger rectangle, if desired
		if (this.data.type === PlungerType.Flat) {
			// Flat plunger - overlay the alpha image on a rectangular surface.

			// Figure the corner coordinates.
			//
			// The tip of the plunger for this frame is at 'height', which is the
			// nominal y position (m_d.m_v.y) plus the portion of the stroke length
			// for the current frame.  (The 0th frame is the most retracted position;
			// the cframe-1'th frame is the most forward position.)  The base is at
			// the nominal y position plus m_d.m_height.
			const xLt = this.data.center.x - this.data.width;
			const xRt = this.data.center.x + this.data.width;
			const yTop = ytip;
			const yBot = this.beginy + this.data.height;

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
			const z = (this.zheight + this.data.width * 1.25) * this.zScale;

			// Figure out which animation cell we're using.  The source image might not
			// (and probably does not) have the same number of cells as the frame list
			// we're generating, since our frame count depends on the stroke length.
			// So we need to interpolate between the image cells and the generated frames.
			//
			// The source image is arranged with the fully extended image in the leftmost
			// cell and the fully retracted image in the rightmost cell.  Our frame
			// numbering is just the reverse, so figure the cell number in right-to-left
			// order to simplify the texture mapping calculations.
			let cellIdx = this.srcCells - 1 - Math.floor((i * this.srcCells / this.cframes) + 0.5);
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
			const tvLocal = (yBot - yTop) / (this.beginy + this.data.height - this.endy);

			// Fill in the four corner vertices.
			// Vertices are (in order): bottom left, top left, top right, bottom right.
			buf[0].x = xLt;        buf[0].nx = 0.0;          buf[0].tu = tuLocal;           // left
			buf[0].y = yBot;       buf[0].ny = 0.0;          buf[0].tv = tvLocal;           // bottom
			buf[0].z = z;          buf[0].nz = -1.0;
			buf[1].x = xLt;        buf[1].nx = 0.0;          buf[1].tu = tuLocal;           // left
			buf[1].y = yTop;       buf[1].ny = 0.0;          buf[1].tv = 0.0;               // top
			buf[1].z = z;          buf[1].nz = -1.0;
			buf[2].x = xRt;        buf[2].nx = 0.0;          buf[2].tu = tuLocal + this.cellWid; // right
			buf[2].y = yTop;       buf[2].ny = 0.0;          buf[2].tv = 0.0;                    // top
			buf[2].z = z;          buf[2].nz = -1.0;
			buf[3].x = xRt;        buf[3].nx = 0.0;          buf[3].tu = tuLocal + this.cellWid; // right
			buf[3].y = yBot;       buf[3].ny = 0.0;          buf[3].tv = tvLocal;                // bottom
			buf[3].z = z;          buf[3].nz = -1.0;

		} else {
			// Build the spring.  We build this as wedge shape wrapped around a spiral.
			// So we actually have three spirals: the front edge, the top edge, and the
			// back edge.  The y extent is the length of the rod; the rod starts at the
			// second-to-last entry and ends at the last entry.  But the actual base
			// position of the spring is fixed at the end of the shaft, which might
			// differ from the on-screen position of the last point in that the rod can
			// be visually cut off by the length adjustment.  So use the true rod base
			// (rody) position to figure the spring length.
			const offset = this.circlePoints * this.lathePoints;
			const y0 = buf[offset - 2].y;
			const y1 = this.rody;
			let n = Math.floor((this.springLoops + this.springEndLoops) * this.circlePoints);
			const nEnd = Math.floor(this.springEndLoops * this.circlePoints);
			const nMain = n - nEnd;
			const yEnd = this.springEndLoops * this.springGauge * this.springMinSpacing;
			const dyMain = (y1 - y0 - yEnd) / (nMain - 1);
			const dyEnd = yEnd / (nEnd - 1);
			let dy = dyEnd;
			let pm = buf[ offset ];
			const dtheta = (Math.PI * 2.0) / (this.circlePoints - 1) + Math.PI / (n - 1);
			for (let theta = Math.PI, y = y0; n !== 0; --n, theta += dtheta, y += dy) {
				if (n === nMain) {
					dy = dyMain;
				}
				if (theta >= Math.PI * 2.0) {
					theta -= Math.PI * 2.0;
				}
				const sn = Math.sin(theta);
				const cs = Math.cos(theta);

				// set the point on the front spiral
				pm.x = this.springRadius * (sn * this.data.width) + this.data.center.x;
				pm.y = y - this.springGauge;
				pm.z = (this.springRadius * (cs * this.data.width) + this.data.width + this.zheight) * this.zScale;
				pm.nx = 0.0;
				pm.ny = -1.0;
				pm.nz = 0.0;
				pm.tu = (sn + 1.0) * 0.5;
				pm.tv = 0.76;

				// set the point on the top spiral
				pm = buf[offset + 1];
				pm.x = (this.springRadius + springGaugeRel / 1.5) * (sn * this.data.width) + this.data.center.x;
				pm.y = y;
				pm.z = ((this.springRadius + springGaugeRel / 1.5) * (cs * this.data.width) + this.data.width + this.zheight) * this.zScale;
				pm.nx = sn;
				pm.ny = 0.0;
				pm.nz = -cs;
				pm.tu = (sn + 1.0) * 0.5;
				pm.tv = 0.85;

				// set the point on the back spiral
				pm = buf[offset + 2];
				pm.x = this.springRadius * (sn * this.data.width) + this.data.center.x;
				pm.y = y + this.springGauge;
				pm.z = (this.springRadius * (cs * this.data.width) + this.data.width + this.zheight) * this.zScale;
				pm.nx = 0.0;
				pm.ny = 1.0;
				pm.nz = 0.0;
				pm.tu = (sn + 1.0) * 0.5;
				pm.tv = 0.98;

				offset += 3;
			}

			//y1 += 0;
		}
	}
}
