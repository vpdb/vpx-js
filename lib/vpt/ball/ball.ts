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

import { Matrix3 } from 'three/src/math/Matrix3';
import { Vertex3D } from '../../math/vertex3d';
import { CollisionEvent } from '../../physics/collision-event';
import { IFireEvents } from '../../physics/events';
import { HitObject } from '../../physics/hit-object';
import { Texture } from '../texture';
import { BallMover } from './ball-mover';

export class Ball extends HitObject {

	private color: number;

	// Per frame info
	//CCO(BallEx) * m_pballex; // Object model version of the ball

	private szImage: string[];
	private szImageFront: string[];

	private pinballEnv: Texture;
	private pinballDecal: Texture;
	public vpVolObjs: IFireEvents[]; // vector of triggers and kickers we are now inside (stored as IFireEvents* though, as HitObject.m_obj stores it like that!)

	private coll: CollisionEvent;  // collision information, may not be a actual hit if something else happens first

	private ballMover: BallMover;

	public pos: Vertex3D;
	private defaultZ: number;       // normal height of the ball //!! remove?

	private oldpos: Vertex3D[]; // for the optional ball trails
	private ringcounter_oldpos: number;

	public vel: Vertex3D;        // ball velocity
	private oldVel: Vertex3D;

	public radius: number;
	private mass: number;
	private invMass: number;

	private rcHitRadiusSqr: number; // extended (by m_vel + magic) squared radius, used in collision detection

	public eventPos: Vertex3D;  // last hit event position (to filter hit 'equal' hit events)

	private orientation: Matrix3;
	private angularmomentum: Vertex3D;
	private angularvelocity: Vertex3D;
	private inertia: number;

	private id: number; // unique ID for each ball

	private bulbIntensityScale: number; // to dampen/increase contribution of the bulb lights (locally/by script)

	private playfieldReflectionStrength: number;

	public isFrozen: boolean;
	private reflectionEnabled: boolean;
	private forceReflection: boolean;
	private visible: boolean;
	private decalMode: boolean;

	private static ballID: number; // increased for each ball created to have an unique ID for scripts for each ball

	constructor() {
		super();
		this.id = Ball.ballID;
		Ball.ballID++;
		this.coll = new CollisionEvent(this);
	}

	public Init(mass: number): void {

	}

	public RenderSetup(): void {

	}

	public UpdateDisplacements(dtime: number): void {

	}

	public UpdateVelocities(): void {

	}

	// From HitObject
	public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {

	}

	public GetType(): CollisionType {
		return CollisionType.Ball;
	}

	public Collide(coll: CollisionEvent): void {

	}

	public Contact(coll: CollisionEvent, dtime: number): void {

	}

	public CalcHitBBox(): void {

	}

	public Collide3DWall(hitNormal: Vertex3D, elasticity: number, elastFalloff: number, friction: number, scatter_angle: number): void {

	}

	public ApplyFriction(hitnormal: Vertex3D, dtime: number, fricCoeff: number): void {

	}

	public HandleStaticContact(coll: CollisionEvent, friction: number, dtime: number): void {

	}

	public SurfaceVelocity(surfP: Vertex3D): Vertex3D {

	}

	public SurfaceAcceleration(surfP: Vertex3D): Vertex3D {

	}

	public ApplySurfaceImpulse(rotI: Vertex3D, impulse: Vertex3D): void {

	}

	public EnsureOMObject(): void {

	}

}
