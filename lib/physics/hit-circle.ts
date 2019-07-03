import { Vertex2D } from '../math/vertex2d';
import { Ball } from './ball';
import { CollisionEvent } from './collision-event';
import { eObjType } from './collision-type';
import { HitObject } from './hit-object';

export class HitCircle extends HitObject {

	private center: Vertex2D;
	private radius: number;

	constructor(c: Vertex2D, r: number, zlow: number, zhigh: number) {
		super();
		this.m_hitBBox.zlow = zlow;
		this.m_hitBBox.zhigh = zhigh;
		this.center = c;
		this.radius = r;
	}

	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {

	}

	public GetType(): eObjType {
		return 'eCircle';
	}

	public Collide(coll: CollisionEvent): void {

	}

	public CalcHitBBox(): void {

	}

	public HitTestBasicRadius(pball: Ball, dtime: number, coll: CollisionEvent, direction: boolean, lateral: boolean, rigid: boolean): number {

	}
}
