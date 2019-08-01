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
import { degToRad } from '../../math/float';
import { RenderVertex } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { Hit3DPoly } from '../../physics/hit-3dpoly';
import { HitLine3D } from '../../physics/hit-line-3d';
import { HitLineZ } from '../../physics/hit-line-z';
import { HitObject } from '../../physics/hit-object';
import { HitPoint } from '../../physics/hit-point';
import { LineSeg } from '../../physics/line-seg';
import { LineSegSlingshot } from '../../physics/line-seg-slingshot';
import { Table } from '../table/table';
import { SurfaceData } from './surface-data';

export class SurfaceHitGenerator {

	private readonly data: SurfaceData;
	private lineSling: LineSegSlingshot[] = [];

	constructor(data: SurfaceData) {
		this.data = data;
	}

	public generateHitObjects(table: Table): HitObject[] {
		const polys = this.generate3DPolys(table);
		return this.updateCommonParameters(polys, table);
	}

	private generate3DPolys(table: Table): HitObject[] {

		const hitObjects: HitObject[] = [];
		const vvertex: RenderVertex[] = DragPoint.getRgVertex<RenderVertex>(this.data.dragPoints, () => new RenderVertex(), CatmullCurve2D.fromVertex2D as any);

		const count = vvertex.length;
		const rgv3Dt: Vertex3D[] = [];
		const rgv3Db: Vertex3D[] | null = this.data.fIsBottomSolid ? [] : null;

		const bottom = this.data.heightbottom + table.getTableHeight();
		const top = this.data.heighttop + table.getTableHeight();

		for (let i = 0; i < count; ++i) {

			const pv1 = vvertex[i];

			rgv3Dt[i] = new Vertex3D(pv1.x, pv1.y, top);

			if (rgv3Db) {
				rgv3Db[count - 1 - i] = new Vertex3D(pv1.x, pv1.y, bottom);
			}

			const pv2 = vvertex[(i + 1) % count];
			const pv3 = vvertex[(i + 2) % count];

			hitObjects.push(...this.generateLinePolys(pv2, pv3, table));
		}

		hitObjects.push(new Hit3DPoly(rgv3Dt));

		if (rgv3Db) {
			hitObjects.push(new Hit3DPoly(rgv3Db));
		}

		return hitObjects;
	}

	private generateLinePolys(pv1: RenderVertex, pv2: RenderVertex, table: Table): HitObject[] {

		const linePolys: HitObject[] = [];
		const bottom = this.data.heightbottom + table.getTableHeight();
		const top = this.data.heighttop + table.getTableHeight();

		if (!pv1.fSlingshot) {
			linePolys.push(new LineSeg(pv1, pv2, bottom, top));

		} else {
			const plinesling = new LineSegSlingshot(this.data, pv1, pv2, bottom, top);
			plinesling.force = this.data.slingshotforce;

			// slingshots always have hit events
			// FIXME: plinesling.obj = (IFireEvents*)this;
			plinesling.fe = true;
			plinesling.threshold = this.data.threshold!;

			linePolys.push(plinesling);
			this.lineSling.push(plinesling);
		}

		if (this.data.heightbottom !== 0) {
			// add lower edge as a line
			linePolys.push(new HitLine3D(new Vertex3D(pv1.x, pv1.y, bottom), new Vertex3D(pv2.x, pv2.y, bottom)));
		}

		// add upper edge as a line
		linePolys.push(new HitLine3D(new Vertex3D(pv1.x, pv1.y, top), new Vertex3D(pv2.x, pv2.y, top)));

		// create vertical joint between the two line segments
		linePolys.push(new HitLineZ(pv1, bottom, top));

		// add upper and lower end points of line
		if (this.data.heightbottom !== 0) {
			linePolys.push(new HitPoint(new Vertex3D(pv1.x, pv1.y, bottom)));
		}
		linePolys.push(new HitPoint(new Vertex3D(pv1.x, pv1.y, top)));

		return linePolys;
	}

	private updateCommonParameters(hitObjects: HitObject[], table: Table): HitObject[] {
		const mat = table.getMaterial(this.data.szPhysicsMaterial);
		for (const obj of hitObjects) {

			if (mat && !this.data.fOverwritePhysics) {
				obj.setElasticy(mat.fElasticity);
				obj.setFriction(mat.fFriction);
				obj.setScatter(degToRad(mat.fScatterAngle));

			} else {
				obj.setElasticy(this.data.elasticity!);
				obj.setFriction(this.data.friction!);
				obj.setScatter(degToRad(this.data.scatter!));
				obj.setEnabled(this.data.fCollidable);
			}

			// FIXME events
			// if (this.data.fHitEvent) {
			// 	obj.obj = (IFireEvents*)this;
			// 	obj.fe = true;
			// 	obj.threshold = this.data.threshold!;
			// }
		}
		return hitObjects;
	}
}
