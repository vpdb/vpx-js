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

import { degToRad, radToDeg } from '../../math/float';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { PHYS_FACTOR } from '../../physics/constants';
import { GameData } from '../game-data';
import { FlipperData } from './flipper-data';

export class FlipperMover {

	private data: FlipperData;
	private tableData: GameData;

	//private hitcircleBase: HitCircle;
	private endRadius: number;
	private readonly flipperRadius: number;

	// kinematic state
	private angularMomentum: number;
	private angularAcceleration: number;
	private angleSpeed: number;
	private angleCur: number;

	private curTorque: number;
	private contactTorque?: number;

	private angleStart: number;
	private angleEnd: number;

	private inertia: number; // moment of inertia

	private zeroAngNorm: Vertex2D = new Vertex2D(); // base norms at zero degrees

	private enableRotateEvent: number; // -1,0,1

	private direction: boolean;

	private solState: boolean; // is solenoid enabled?
	private isInContact: boolean;

	// private isEnabled: boolean;
	// private isVisible: boolean;
	private lastHitFace: boolean;

	constructor(center: Vertex2D, baser: number, endr: number, flipr: number, angleStart: number, angleEnd: number, zlow: number, zhigh: number, data: FlipperData, tableData: GameData) {

		this.data = data;
		this.tableData = tableData;

		this.endRadius = endr;         // radius of flipper end
		this.flipperRadius = flipr;    // radius of flipper arc, center-to-center radius

		if (angleEnd === angleStart) { // otherwise hangs forever in collisions/updates
			angleEnd += 0.0001;
		}

		this.direction = angleEnd >= angleStart;
		this.solState = false;
		this.isInContact = false;
		this.curTorque = 0.0;
		this.enableRotateEvent = 0;

		this.angleStart = angleStart;
		this.angleEnd = angleEnd;
		this.angleCur = angleStart;

		this.angularMomentum = 0;
		this.angularAcceleration = 0;
		this.angleSpeed = 0;

		const ratio = (baser - endr) / flipr;

		// model inertia of flipper as that of rod of length flipr around its end
		const mass = this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics)
			? this.data.overrideMass!
			: this.data.mass;
		this.inertia = (1.0 / 3.0) * mass * (flipr * flipr);

		this.lastHitFace = false; // used to optimize hit face search order

		this.zeroAngNorm.x =  Math.sqrt(1.0 - ratio * ratio); // F2 Norm, used in Green's transform, in FPM time search  // =  sinf(faceNormOffset)
		this.zeroAngNorm.y = -ratio;                   // F1 norm, change sign of x component, i.e -zeroAngNorm.x // = -cosf(faceNormOffset)

	}

	public updateDisplacements(dtime: number): void {
		this.angleCur += this.angleSpeed * dtime;	// move flipper angle

		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		if (this.angleCur > angleMax) {
			this.angleCur = angleMax;
		}
		if (this.angleCur < angleMin) {
			this.angleCur = angleMin;
		}

		if (Math.abs(this.angleSpeed) < 0.0005) {   // avoids 'jumping balls' when two or more balls held on flipper (and more other balls are in play) //!! make dependent on physics update rate
			return;
		}

		let handleEvent = false;

		if (this.angleCur === angleMax) {        // hit stop?
			if (this.angleSpeed > 0) {
				handleEvent = true;
			}
		} else if (this.angleCur === angleMin) {
			if (this.angleSpeed < 0) {
				handleEvent = true;
			}
		}

		if (handleEvent) {
			const anglespd = Math.abs(radToDeg(this.angleSpeed));
			this.angularMomentum *= -0.3; //!! make configurable?
			this.angleSpeed = this.angularMomentum / this.inertia;

			if (this.enableRotateEvent > 0) {
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_EOS, anglespd); // send EOS event
				//
				// g_pplayer->this.m_pininput.this.m_leftkey_down_usec_EOS = usec(); // debug only
				// g_pplayer->this.m_pininput.this.m_leftkey_down_frame_EOS = g_pplayer->this.m_overall_frames;

			} else if (this.enableRotateEvent < 0) {
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_BOS, anglespd); // send Beginning of Stroke/Park event
			}
			this.enableRotateEvent = 0;
		}
	}

	public updateVelocities(): void {

		let desiredTorque = this.getStrength();
		if (!this.solState) {// this.m_solState: true = button pressed, false = released
			desiredTorque *= -this.getReturnRatio();
		}

		// hold coil is weaker
		const eosAngle = degToRad(
			(this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
				? this.data.overrideTorqueDampingAngle!
				: this.data.torqueDampingAngle!);

		if (Math.abs(this.angleCur - this.angleEnd) < eosAngle) {
			const lerp = Math.sqrt(Math.sqrt(Math.abs(this.angleCur - this.angleEnd) / eosAngle)); // fade in/out damping, depending on angle to end
			desiredTorque *= lerp + ((this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
				? this.data.overrideTorqueDamping!
				: this.data.torqueDamping!) * (1.0 - lerp);
		}

		if (!this.direction) {
			desiredTorque = -desiredTorque;
		}

		let torqueRampupSpeed = (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideCoilRampUp!
			: this.data.rampUp!;

		if (torqueRampupSpeed <= 0) {
			torqueRampupSpeed = 1e6; // set very high for instant coil response
		} else {
			torqueRampupSpeed = Math.min(this.getStrength() / torqueRampupSpeed, 1e6);
		}

		// update current torque linearly towards desired torque
		// (simple model for coil hysteresis)
		if (desiredTorque >= this.curTorque) {
			this.curTorque = Math.min(this.curTorque + torqueRampupSpeed * PHYS_FACTOR, desiredTorque);
		} else {
			this.curTorque = Math.max(this.curTorque - torqueRampupSpeed * PHYS_FACTOR, desiredTorque);
		}

		// resolve contacts with stoppers
		let torque = this.curTorque;
		this.isInContact = false;
		if (Math.abs(this.angleSpeed) <= 1e-2) {
			const angleMin = Math.min(this.angleStart, this.angleEnd);
			const angleMax = Math.max(this.angleStart, this.angleEnd);

			if (this.angleCur >= angleMax - 1e-2 && torque > 0.) {
				this.angleCur = angleMax;
				this.isInContact = true;
				this.contactTorque = torque;
				this.angularMomentum = 0.;
				torque = 0.;
			} else if (this.angleCur <= angleMin + 1e-2 && torque < 0.) {
				this.angleCur = angleMin;
				this.isInContact = true;
				this.contactTorque = torque;
				this.angularMomentum = 0.;
				torque = 0.;
			}
		}

		this.angularMomentum += PHYS_FACTOR * torque;
		this.angleSpeed = this.angularMomentum / this.inertia;
		this.angularAcceleration = torque / this.inertia;
	}

	public addToList(): boolean {
		return true;
	}

	public setSolenoidState(s: boolean): void {
		this.solState = s;
	}

	public getStrokeRatio(): number {
		return (this.angleCur - this.angleStart) / (this.angleEnd - this.angleStart); // End == Start cannot happen, as handled in ctor
	}

	public setStartAngle(r: number): void {
		this.angleStart = r;
		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);
		if (this.angleCur > angleMax) {
			this.angleCur = angleMax;
		}
		if (this.angleCur < angleMin) {
			this.angleCur = angleMin;
		}
	}

	public setEndAngle(r: number): void {
		this.angleEnd = r;
		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		if (this.angleCur > angleMax) {
			this.angleCur = angleMax;
		}
		if (this.angleCur < angleMin) {
			this.angleCur = angleMin;
		}
	}

	public getReturnRatio(): number {
		return (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideReturnStrength!
			: this.data.return!;
	}

	public getMass(): number {
		return 3.0 * this.inertia / (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public setMass(m: number): void {
		this.inertia = (1.0 / 3.0) * m * (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public getStrength(): number {
		return (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideStrength!
			: this.data.strength!;
	}

	// rigid body functions
	public surfaceVelocity(surfP: Vertex3D): Vertex3D {
		return FlipperMover.CrossZ(this.angleSpeed, surfP);
	}

	public surfaceAcceleration(surfP: Vertex3D): Vertex3D {
		// tangential acceleration = (0, 0, omega) x surfP
		const tangAcc = FlipperMover.CrossZ(this.angularAcceleration, surfP);

		// centripetal acceleration = (0,0,omega) x ( (0,0,omega) x surfP )
		const av2 = this.angleSpeed * this.angleSpeed;
		const centrAcc = new Vertex3D(-av2 * surfP.x, -av2 * surfP.y, 0);

		return tangAcc.add(centrAcc);
	}

	public getHitTime(): number {
		if (this.angleSpeed === 0) {
			return -1.0;
		}

		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		const dist = (this.angleSpeed > 0)
			? angleMax - this.angleCur       // >= 0
			: angleMin - this.angleCur;      // <= 0

		const hitTime = dist / this.angleSpeed;

		if (!isFinite(hitTime) || hitTime < 0) {
			return -1.0;
		} else {
			return hitTime;
		}
	}

	public applyImpulse(rotI: Vertex3D): void {
		this.angularMomentum += rotI.z;            // only rotation about z axis
		this.angleSpeed = this.angularMomentum / this.inertia;    // TODO: figure out moment of inertia
	}

	private static CrossZ(rz: number, v: Vertex3D): Vertex3D {
		return new Vertex3D(-rz * v.y, rz * v.x, 0);
	}
}
