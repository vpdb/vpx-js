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

import { Table } from '../..';
import { CatmullCurve2D } from '../../math/catmull-curve';
import { DragPoint } from '../../math/dragpoint';
import { RenderVertex, Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionType } from '../../physics/collision-type';
import { PHYS_SKIN } from '../../physics/constants';
import { FireEvents } from '../../physics/fire-events';
import { Hit3DPoly } from '../../physics/hit-3dpoly';
import { HitObject } from '../../physics/hit-object';
import { Mesh } from '../mesh';
import { TriggerData } from './trigger-data';
import { TriggerLineSeg } from './trigger-line-seg';

export class TriggerHitGenerator {

	private readonly data: TriggerData;

	constructor(data: TriggerData) {
		this.data = data;
	}

	public generateHitObjects(fireEvents: FireEvents, table: Table): Array<HitObject<FireEvents>> {

		const hitObjects: Array<HitObject<FireEvents>> = [];
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		const vVertex: RenderVertex[] = DragPoint.getRgVertex<RenderVertex>(this.data.dragPoints, () => new RenderVertex(), CatmullCurve2D.fromVertex2D as any);

		const count = vVertex.length;
		const rgv: RenderVertex[] = new Array<RenderVertex>(count);
		const rgv3D: Vertex3D[] = new Array<Vertex3D>(count);

		for (let i = 0; i < count; i++) {
			rgv[i] = vVertex[i];
			rgv3D[i] = new Vertex3D(rgv[i].x, rgv[i].y, height + (PHYS_SKIN * 2.0));
		}

		for (let i = 0; i < count; i++) {
			const pv2 = rgv[(i < count - 1) ? (i + 1) : 0];
			const pv3 = rgv[(i < count - 2) ? (i + 2) : (i + 2 - count)];
			hitObjects.push(this.getLineSeg(pv2, pv3, height));
		}

		const ph3dpoly = new Hit3DPoly(rgv3D, CollisionType.Trigger);
		ph3dpoly.obj = fireEvents;
		hitObjects.push(ph3dpoly);

		return hitObjects;
	}

	private getLineSeg(pv1: RenderVertex, pv2: RenderVertex, height: number): TriggerLineSeg {
		return new TriggerLineSeg(
			new Vertex2D(pv1.x, pv1.y),
			new Vertex2D(pv2.x, pv2.y),
			height,
			height + Math.max(this.data.hitHeight - 8.0, 0), //adjust for same hit height as circular
			this.data,
		);
	}
}
