import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Ball } from './ball';
import { HitObject } from './hit-object';

export class CollisionEvent {

	/**
	 * the ball that collided with smth
	 */
	public ball: Ball;

	/**
	 * what the ball collided with
	 */
	public obj: HitObject;

	/**
	 * when the collision happens (relative to current physics state)
	 */
	public hittime: number;

	/**
	 * hit distance
	 */
	public hitdistance: number;

	// additional collision information
	public hitnormal: Vertex3D;
	public hitvel: Vertex2D; // only "correctly" used by plunger and flipper
	public hitOrgNormalVelocity?: number; // only set if isContact is true

	public hitmomentBit: boolean;

	public hitflag: boolean; // UnHit signal/direction of hit/side of hit (spinner/gate)

	public isContact: boolean;
}
