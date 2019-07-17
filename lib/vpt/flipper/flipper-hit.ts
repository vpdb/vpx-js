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

import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { CollisionType } from '../../physics/collision-type';
// import { Vertex2D } from '../../math/vertex2d';
// import { Vertex3D } from '../../math/vertex3d';
// import { CollisionEvent } from '../../physics/collision-event';
// import { CollisionType } from '../../physics/collision-type';
// import { C_CONTACTVEL, C_INTERATIONS, C_PRECISION, PHYS_TOUCH } from '../../physics/constants';
import { HitObject } from '../../physics/hit-object';
import { MoverObject } from '../../physics/mover-object';
import { Table } from '../table';
// import { Ball } from '../ball/ball';
import { TableData } from '../table-data';
import { FlipperConfig } from './flipper';
import { FlipperData } from './flipper-data';
import { FlipperMover } from './flipper-mover';

export class FlipperHit extends HitObject {

	private readonly flipperMover: FlipperMover;
	private readonly flipperData: FlipperData;
	private readonly tableData: TableData;
	private lastHitTime: number = 0;

	public static getInstance(flipperData: FlipperData, player: Player, table: Table): FlipperHit {
		const height = table.getSurfaceHeight(flipperData.szSurface, flipperData.center.x, flipperData.center.y);
		if (flipperData.flipperRadiusMin > 0 && flipperData.flipperRadiusMax > flipperData.flipperRadiusMin) {
			flipperData.flipperRadius = flipperData.flipperRadiusMax - (flipperData.flipperRadiusMax - flipperData.flipperRadiusMin) /* m_ptable->m_globalDifficulty*/;
			flipperData.flipperRadius = Math.max(flipperData.flipperRadius, flipperData.baseRadius - flipperData.endRadius + 0.05);
		} else {
			flipperData.flipperRadius = flipperData.flipperRadiusMax;
		}
		return new FlipperHit({
				center: flipperData.center,
				baseRadius: Math.max(flipperData.baseRadius, 0.01),
				endRadius: Math.max(flipperData.endRadius, 0.01),
				flipperRadius: Math.max(flipperData.flipperRadius, 0.01),
				angleStart: degToRad(flipperData.startAngle),
				angleEnd: degToRad(flipperData.endAngle),
				zLow: height,
				zHigh: height + flipperData.height,
			},
			flipperData,
			player,
			table.data!,
		);
	}

	constructor(config: FlipperConfig, data: FlipperData, player: Player, tableData: TableData) {
		super();
		this.flipperMover = new FlipperMover(config, data, player, tableData);
		this.flipperMover.isEnabled = data.fEnabled;
		this.flipperData = data;
		this.tableData = tableData;
		this.UpdatePhysicsFromFlipper();
	}

	// public HitTest(pball: Ball, dtime: number, coll: CollisionEvent): number {
	// 	if (!this.flipperMover.isEnabled) {
	// 		return -1;
	// 	}
	//
	// 	const lastface = this.flipperMover.lastHitFace;
	//
	// 	// for effective computing, adding a last face hit value to speed calculations
	// 	// a ball can only hit one face never two
	// 	// also if a ball hits a face then it can not hit either radius
	// 	// so only check these if a face is not hit
	// 	// endRadius is more likely than baseRadius ... so check it first
	//
	// 	let hittime = this.HitTestFlipperFace(pball, dtime, coll, lastface); // first face
	// 	if (hittime >= 0) {
	// 		return hittime;
	// 	}
	//
	// 	hittime = this.HitTestFlipperFace(pball, dtime, coll, !lastface); //second face
	// 	if (hittime >= 0) {
	// 		this.flipperMover.lastHitFace = !lastface; // change this face to check first // HACK
	// 		return hittime;
	// 	}
	//
	// 	hittime = this.HitTestFlipperEnd(pball, dtime, coll); // end radius
	// 	if (hittime >= 0) {
	// 		return hittime;
	// 	}
	//
	// 	hittime = this.flipperMover.hitCircleBase.HitTest(pball, dtime, coll);
	// 	if (hittime >= 0) {
	//
	// 		coll.hitVel = new Vertex2D();
	// 		coll.hitVel.x = 0;		//Tangent velocity of contact point (rotate Normal right)
	// 		coll.hitVel.y = 0;		//units: rad*d/t (Radians*diameter/time
	// 		coll.hitMomentBit = true;
	//
	// 		return hittime;
	// 	} else {
	// 		return -1.0;	// no hits
	// 	}
	// }

	public getType(): CollisionType {
		return CollisionType.Flipper;
	}

	// public Collide(coll: CollisionEvent): void {
	// }

	// public Contact(coll: CollisionEvent, dtime: number): void {
	//
	// }

	// public CalcHitBBox(): void {
	// 	// Allow roundoff
	// 	this.hitBBox.left = this.flipperMover.hitCircleBase.center.x - this.flipperMover.flipperRadius - this.flipperMover.endRadius - 0.1;
	// 	this.hitBBox.right = this.flipperMover.hitCircleBase.center.x + this.flipperMover.flipperRadius + this.flipperMover.endRadius + 0.1;
	// 	this.hitBBox.top = this.flipperMover.hitCircleBase.center.y - this.flipperMover.flipperRadius - this.flipperMover.endRadius - 0.1;
	// 	this.hitBBox.bottom = this.flipperMover.hitCircleBase.center.y + this.flipperMover.flipperRadius + this.flipperMover.endRadius + 0.1;
	// 	this.hitBBox.zlow = this.flipperMover.hitCircleBase.hitBBox.zlow;
	// 	this.hitBBox.zhigh = this.flipperMover.hitCircleBase.hitBBox.zhigh;
	// }

	public getMoverObject(): FlipperMover {
		return this.flipperMover;
	}

	public UpdatePhysicsFromFlipper(): void {
		this.elasticityFalloff = (this.flipperData.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.flipperData.overrideElasticityFalloff!
			: this.flipperData.elasticityFalloff!;
		this.elasticity = (this.flipperData.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.flipperData.overrideElasticity!
			: this.flipperData.elasticity!;
		this.setFriction((this.flipperData.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.flipperData.overrideFriction!
			: this.flipperData.friction!);
		this.scatter = degToRad((this.flipperData.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.flipperData.overrideScatterAngle!
			: this.flipperData.scatter!);
	}

	// public HitTestFlipperFace(pball: Ball, dtime: number, coll: CollisionEvent, face1: boolean): number {
	// 	return 0;
	// }

	// public HitTestFlipperEnd(pball: Ball, dtime: number, coll: CollisionEvent): number {
	//
	// 	const angleCur = this.flipperMover.angleCur;
	// 	let anglespeed = this.flipperMover.angleSpeed;		// rotation rate
	//
	// 	const flipperbase = this.flipperMover.hitCircleBase.center;
	//
	// 	const angleMin = Math.min(this.flipperMover.angleStart, this.flipperMover.angleEnd);
	// 	const angleMax = Math.max(this.flipperMover.angleStart, this.flipperMover.angleEnd);
	//
	// 	const ballr = pball.radius;
	// 	const feRadius = this.flipperMover.endRadius;
	//
	// 	const ballrEndr = feRadius + ballr; // magnititude of (ball - flipperEnd)
	//
	// 	const ballx = pball.pos!.x;
	// 	const bally = pball.pos!.y;
	//
	// 	const ballvx = pball.vel.x;
	// 	const ballvy = pball.vel.y;
	//
	// 	const vp = new Vertex2D(
	// 		0.0,                           // m_flipperradius * sin(0);
	// 		-this.flipperMover.flipperRadius, // m_flipperradius * (-cos(0));
	// 	);
	//
	// 	let ballvtx = 0;
	// 	let ballvty = 0;	// new ball position at time t in flipper face coordinate
	// 	let contactAng = 0;
	// 	let bfend = 0;
	// 	let cbcedist = 0;
	// 	let t0 = 0;
	// 	let t1 = 0;
	// 	let d0 = 0;
	// 	let d1 = 0;
	// 	let dp = 0;
	//
	// 	let t = 0; //start first interval ++++++++++++++++++++++++++
	// 	let k: number;
	// 	for (k = 1; k <= C_INTERATIONS; ++k) {
	//
	// 		// determine flipper rotation direction, limits and parking
	// 		contactAng = angleCur + anglespeed * t; // angle at time t
	//
	// 		if (contactAng >= angleMax) {
	// 			contactAng = angleMax; // stop here
	// 		} else if (contactAng <= angleMin) {
	// 			contactAng = angleMin; // stop here
	// 		}
	//
	// 		const radsin = Math.sin(contactAng); // Green's transform matrix... rotate angle delta
	// 		const radcos = Math.cos(contactAng); // rotational transform from zero position to position at time t
	//
	// 		// rotate angle delta unit vector, rotates system according to flipper face angle
	// 		const vt = new Vertex2D(
	// 			vp.x * radcos - vp.y * radsin + flipperbase.x, //rotate and translate to world position
	// 			vp.y * radcos + vp.x * radsin + flipperbase.y,
	// 		);
	//
	// 		ballvtx = ballx + ballvx * t - vt.x; // new ball position relative to flipper end radius
	// 		ballvty = bally + ballvy * t - vt.y;
	//
	// 		cbcedist = Math.sqrt(ballvtx * ballvtx + ballvty * ballvty); // center ball to center end radius distance
	//
	// 		bfend = cbcedist - ballrEndr; // ball face-to-radius surface distance
	//
	// 		if (Math.abs(bfend) <= C_PRECISION) {
	// 			break;
	// 		}
	//
	// 		if (k === 1) {                                 // end of pass one ... set full interval pass, t = dtime
	// 			// test for extreme conditions
	// 			if (bfend < -(pball.radius + feRadius)) {
	// 				// too deeply embedded, ambigious position
	// 				return -1.0;
	// 			}
	// 			if (bfend <= PHYS_TOUCH) {
	// 				// inside the clearance limits
	// 				break;
	// 			}
	// 			// set for second pass, force t=dtime
	// 			t0 = t1 = dtime; d0 = 0; d1 = bfend;
	//
	// 		} else if (k === 2) {                          // end pass two, check if zero crossing on initial interval, exit if none
	// 			if (dp * bfend > 0.0) {
	// 				// no solution ... no obvious zero crossing
	// 				return -1.0;
	// 			}
	//
	// 			t0 = 0;
	// 			t1 = dtime;
	// 			d0 = dp;
	// 			d1 = bfend; // set initial boundaries
	//
	// 		} else {                                       // (k >= 3) // MFP root search
	// 			if (bfend * d0 <= 0.0) {// zero crossing
	// 				t1 = t;
	// 				d1 = bfend;
	// 				if (dp * bfend > 0) {
	// 					d0 *= 0.5;
	// 				}
	// 			} else {
	// 				t0 = t;
	// 				d0 = bfend;
	// 				if (dp * bfend > 0) {
	// 					d1 *= 0.5;
	// 				}
	// 			}	// 	move left interval limit
	// 		}
	//
	// 		t = t0 - d0 * (t1 - t0) / (d1 - d0); // estimate next t
	// 		dp = bfend; // remember
	//
	// 	} //for loop
	// 	//+++ End time interation loop found time t soultion ++++++
	//
	// 	// time is outside this frame ... no collision
	// 	if (!isFinite(t) || t < 0 || t > dtime || ((k > C_INTERATIONS) && (Math.abs(bfend) > pball.radius * 0.25))) { // last ditch effort to accept a solution
	// 		return -1.0; // no solution
	// 	}
	//
	// 	// here ball and flipper end are in contact .. well in most cases, near and embedded solutions need calculations
	// 	const hitz = pball.pos!.z + pball.vel.z * t; // check for a hole, relative to ball rolling point at hittime
	//
	// 	if ((hitz + ballr * 0.5) < this.hitBBox.zlow		//check limits of object's height and depth
	// 		|| (hitz - ballr * 0.5) > this.hitBBox.zhigh) {
	// 		return -1.0;
	// 	}
	//
	// 	// ok we have a confirmed contact, calc the stats, remember there are "near" solution, so all
	// 	// parameters need to be calculated from the actual configuration, i.e. contact radius must be calc'ed
	// 	const invCbcedist = 1.0 / cbcedist;
	// 	coll.hitNormal = new Vertex3D();
	// 	coll.hitNormal.x = ballvtx * invCbcedist;				// normal vector from flipper end to ball
	// 	coll.hitNormal.y = ballvty * invCbcedist;
	// 	coll.hitNormal.z = 0.0;
	//
	// 	const dist = new Vertex2D(
	// 		pball.pos!.x + ballvx * t - ballr * coll.hitNormal.x - this.flipperMover.hitCircleBase.center.x, // vector from base to flipperEnd plus the projected End radius
	// 		pball.pos!.y + ballvy * t - ballr * coll.hitNormal.y - this.flipperMover.hitCircleBase.center.y);
	//
	// 	const distance = Math.sqrt(dist.x * dist.x + dist.y * dist.y); // distance from base center to contact point
	//
	// 	if ((contactAng >= angleMax && anglespeed > 0) || (contactAng <= angleMin && anglespeed < 0)) { // hit limits ???
	// 		anglespeed = 0; // rotation stopped
	// 	}
	//
	// 	const invDistance = 1.0 / distance;
	// 	coll.hitVel = new Vertex2D();
	// 	coll.hitVel.x = -dist.y * invDistance; //Unit Tangent vector velocity of contact point(rotate normal right)
	// 	coll.hitVel.y = dist.x * invDistance;
	//
	// 	coll.hitMomentBit = (distance === 0);
	//
	// 	// recheck using actual contact angle of velocity direction
	// 	const dv = new Vertex2D(
	// 		ballvx - coll.hitVel.x * anglespeed * distance,
	// 		ballvy - coll.hitVel.y * anglespeed * distance); //delta velocity ball to face
	//
	// 	const bnv = dv.x * coll.hitNormal.x + dv.y * coll.hitNormal.y;  //dot Normal to delta v
	//
	// 	if (bnv >= 0) {
	// 		return -1.0; // not hit ... ball is receding from face already, must have been embedded or shallow angled
	// 	}
	//
	// 	if (Math.abs(bnv) <= C_CONTACTVEL && bfend <= PHYS_TOUCH) {
	// 		coll.isContact = true;
	// 		coll.hitOrgNormalVelocity = bnv;
	// 	}
	//
	// 	coll.hitDistance = bfend;			//actual contact distance ..
	//
	// 	return t;
	// }

	public getHitTime(): number {
		return this.flipperMover.getHitTime();
	}
}
