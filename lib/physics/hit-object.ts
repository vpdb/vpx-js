import { FRect3D } from '../math/frect3d';
import { Ball } from './ball';
import { CollisionEvent } from './collision-event';
import { eObjType } from './collision-type';
import { MoverObject } from './mover-object';

export class HitObject {

	// private m_pfedebug: IFireEvents;
	// private m_obj: IFireEvents; // base object pointer (mainly used as IFireEvents, but also as HitTarget or Primitive or Trigger or Kicker or Gate, see below)

	private m_threshold: number;  // threshold for firing an event (usually (always??) normal dot ball-velocity)

	protected m_hitBBox: FRect3D;

	private m_elasticity: number;
	private m_elasticityFalloff: number;
	private m_friction: number;
	private m_scatter: number; // in radians

	private m_ObjType: eObjType;

	private m_fEnabled: boolean;

	private m_fe: boolean;  // FireEvents for m_obj?
	private m_e: boolean;   // currently only used to determine which HitTriangles/HitLines/HitPoints are being part of the same Primitive element m_obj, to be able to early out intersection traversal if primitive is flagged as not collidable


	constructor() {
		// m_fEnabled(true), m_ObjType(eNull), m_obj(NULL),
		// 	m_elasticity(0.3f), m_elasticityFalloff(0.0f), m_friction(0.3f), m_scatter(0.0f),
		// m_threshold(0.f), m_pfedebug(NULL), m_fe(false), m_e(false)
	}

	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		return -1;
	} //!! shouldn't need to do this, but for whatever reason there is a pure virtual function call triggered otherwise that refuses to be debugged (all derived classes DO implement this one!)

	public GetType(): eObjType {

	}

	public Collide(coll: CollisionEvent): void {

	}

	public Contact(coll: CollisionEvent, dtime: number): void {
		// apply contact forces for the given time interval. Ball, Spinner and Gate do nothing here, Flipper has a specialized handling
	}

	public CalcHitBBox(): void {

	}

	public GetMoverObject(): MoverObject {
		return null;
	}

	public SetFriction(friction: number): void {
		this.m_friction = friction;
	}

	public FireHitEvent(pball: Ball): void {

	}
}
