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

import { EventProxy } from '../../game/event-proxy';
import { Player } from '../../game/player';
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
import { Surface } from './surface';
import { SurfaceData } from './surface-data';

export class SurfaceHitGenerator {

	private readonly surface: Surface;
	private readonly data: SurfaceData;
	public lineSling: LineSegSlingshot[] = [];

	constructor(surface: Surface, data: SurfaceData) {
		this.surface = surface;
		this.data = data;
	}

	public generateHitObjects(events: EventProxy, player: Player, table: Table): HitObject[] {
		return this.updateCommonParameters(this.generate3DPolys(events, player, table), events, table);
	}

	/**
	 * Returns all hit objects for the surface.
	 * @see Surface::CurvesToShapes
	 */
	private generate3DPolys(events: EventProxy, player: Player, table: Table): HitObject[] {

		const hitObjects: HitObject[] = [];
		const vVertex: RenderVertex[] = DragPoint.getRgVertex<RenderVertex>(this.data.dragPoints, () => new RenderVertex(), CatmullCurve2D.fromVertex2D as any);

		const count = vVertex.length;
		const rgv3Dt: Vertex3D[] = [];
		const rgv3Db: Vertex3D[] | null = this.data.isBottomSolid ? [] : null;

		const bottom = this.data.heightBottom + table.getTableHeight();
		const top = this.data.heightTop + table.getTableHeight();

		for (let i = 0; i < count; ++i) {
			const pv1 = vVertex[i];
			rgv3Dt[i] = new Vertex3D(pv1.x, pv1.y, top);

			if (rgv3Db) {
				rgv3Db[count - 1 - i] = new Vertex3D(pv1.x, pv1.y, bottom);
			}

			const pv2 = vVertex[(i + 1) % count];
			const pv3 = vVertex[(i + 2) % count];
			hitObjects.push(...this.generateLinePolys(pv2, pv3, events, player, table));
		}

		hitObjects.push(new Hit3DPoly(rgv3Dt));

		if (rgv3Db) {
			hitObjects.push(new Hit3DPoly(rgv3Db));
		}

		return hitObjects;
	}

	/**
	 * Returns the hit line polygons for the surface.
	 * @see Surface::AddLine
	 */
	private generateLinePolys(pv1: RenderVertex, pv2: RenderVertex, events: EventProxy, player: Player, table: Table): HitObject[]  {

		const linePolys: HitObject[] = [];
		const bottom = this.data.heightBottom + table.getTableHeight();
		const top = this.data.heightTop + table.getTableHeight();

		if (!pv1.fSlingshot) {
			linePolys.push(new LineSeg(pv1, pv2, bottom, top));

		} else {
			const slingLine = new LineSegSlingshot(this.surface, this.data, pv1, pv2, bottom, top, player);
			slingLine.force = this.data.slingshotForce;

			// slingshots always have hit events
			slingLine.obj = events;
			slingLine.fe = true;
			slingLine.threshold = this.data.threshold!;

			linePolys.push(slingLine);
			this.lineSling.push(slingLine);
		}

		if (this.data.heightBottom !== 0) {
			// add lower edge as a line
			linePolys.push(new HitLine3D(new Vertex3D(pv1.x, pv1.y, bottom), new Vertex3D(pv2.x, pv2.y, bottom)));
		}

		// add upper edge as a line
		linePolys.push(new HitLine3D(new Vertex3D(pv1.x, pv1.y, top), new Vertex3D(pv2.x, pv2.y, top)));

		// create vertical joint between the two line segments
		linePolys.push(new HitLineZ(pv1, bottom, top));

		// add upper and lower end points of line
		if (this.data.heightBottom !== 0) {
			linePolys.push(new HitPoint(new Vertex3D(pv1.x, pv1.y, bottom)));
		}
		linePolys.push(new HitPoint(new Vertex3D(pv1.x, pv1.y, top)));

		return linePolys;
	}

	/**
	 * Updates the hit object with parameters common to the surface.
	 * @see Surface::SetupHitObject
	 */
	private updateCommonParameters(hitObjects: HitObject[], events: EventProxy, table: Table): HitObject[] {
		for (const obj of hitObjects) {

			obj.applyPhysics(this.data, table);

			if (this.data.hitEvent) {
				obj.obj = events;
				obj.fe = true;
				obj.threshold = this.data.threshold!;
			}
		}
		return hitObjects;
	}
}
