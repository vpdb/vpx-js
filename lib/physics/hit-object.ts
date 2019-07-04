import { FRect3D } from '../math/frect3d';
import { Ball } from '../vpt/ball/ball';
import { CollisionEvent } from './collision-event';
import { eObjType } from './collision-type';
import { IFireEvents } from './events';
import { MoverObject } from './mover-object';

export class HitObject {

	private pfeDebug?: IFireEvents;
	private obj?: IFireEvents; // base object pointer (mainly used as IFireEvents, but also as HitTarget or Primitive or Trigger or Kicker or Gate, see below)

	private threshold: number = 0;  // threshold for firing an event (usually (always??) normal dot ball-velocity)

	public hitBBox: FRect3D;

	protected elasticity: number = 0.3;
	protected elasticityFalloff: number = 0;
	private friction: number = 0.3;
	protected scatter: number = 0; // in radians

	private objType: eObjType = 'eNull';

	private isEnabled: boolean = true;

	/**
	 * FireEvents for m_obj?
	 */
	private fe: boolean = false;

	/**
	 * currently only used to determine which HitTriangles/HitLines/HitPoints
	 * are being part of the same Primitive element m_obj, to be able to early
	 * out intersection traversal if primitive is flagged as not collidable
	 */
	private e: boolean = false;

	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
		return -1;
	} //!! shouldn't need to do this, but for whatever reason there is a pure virtual function call triggered otherwise that refuses to be debugged (all derived classes DO implement this one!)

	public GetType(): eObjType {

	}

	public Collide(coll: CollisionEvent): void {

	}

	/**
	 * apply contact forces for the given time interval. Ball, Spinner and Gate do nothing here, Flipper has a specialized handling
	 * @param coll
	 * @param dtime
	 * @constructor
	 */
	public Contact(coll: CollisionEvent, dtime: number): void {
		coll.ball.HandleStaticContact(coll, this.friction, dtime);
	}

	public CalcHitBBox(): void {

	}

	public GetMoverObject(): MoverObject {
		return null;
	}

	public SetFriction(friction: number): void {
		this.friction = friction;
	}

	public FireHitEvent(pball: Ball): void {
		if (this.obj && this.fe && this.isEnabled) {

			// is this the same place as last event? if same then ignore it
			const distLs = (pball.eventPos.clone().sub(pball.pos)).lengthSq();

			pball.eventPos = pball.pos;    //remember last collide position

			// hit targets when used with a captured ball have always a too small distance
			const normalDist = (this.objType === 'eHitTarget') ? 0.0 : 0.25; //!! magic distance

			if (distLs > normalDist) { // must be a new place if only by a little
				this.obj.FireGroupEvent(DISPID_HitEvents_Hit);
			}
		}
	}
}
