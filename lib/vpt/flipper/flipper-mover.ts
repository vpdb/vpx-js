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

/* tslint:disable:variable-name */
import { degToRad, radToDeg } from '../../math/float';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { GameData } from '../game-data';
import { PHYS_FACTOR } from '../physics';
import { FlipperData } from './flipper-data';

export class FlipperMover {

	private data: FlipperData;
	private tableData: GameData;

	//private m_hitcircleBase: HitCircle;
	private m_endradius: number;
	private m_flipperradius: number;

	// kinematic state
	private m_angularMomentum: number;
	private m_angularAcceleration: number;
	private m_angleSpeed: number;
	private m_angleCur: number;

	private m_curTorque: number;
	private m_contactTorque?: number;

	private m_angleStart: number;
	private m_angleEnd: number;

	private m_inertia: number;	        // moment of inertia

	private m_zeroAngNorm: Vertex2D = new Vertex2D();  // base norms at zero degrees

	private m_EnableRotateEvent: number; // -1,0,1

	private m_direction: boolean;

	private m_solState: boolean;         // is solenoid enabled?
	private m_isInContact: boolean;

	// private m_fEnabled: boolean;
	// private m_fVisible: boolean;
	private m_lastHitFace: boolean;

	constructor(center: Vertex2D, baser: number, endr: number, flipr: number, angleStart: number, angleEnd: number, zlow: number, zhigh: number, data: FlipperData, tableData: GameData) {

		this.data = data;
		this.tableData = tableData;

		this.m_endradius = endr;         // radius of flipper end
		this.m_flipperradius = flipr;    // radius of flipper arc, center-to-center radius

		if (angleEnd === angleStart) { // otherwise hangs forever in collisions/updates
			angleEnd += 0.0001;
		}

		this.m_direction = angleEnd >= angleStart;
		this.m_solState = false;
		this.m_isInContact = false;
		this.m_curTorque = 0.0;
		this.m_EnableRotateEvent = 0;

		this.m_angleStart = angleStart;
		this.m_angleEnd = angleEnd;
		this.m_angleCur = angleStart;

		this.m_angularMomentum = 0;
		this.m_angularAcceleration = 0;
		this.m_angleSpeed = 0;

		const ratio = (baser - endr) / flipr;

		// model inertia of flipper as that of rod of length flipr around its end
		const mass = this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics)
			? this.data.overrideMass!
			: this.data.mass;
		this.m_inertia = (1.0 / 3.0) * mass * (flipr * flipr);

		this.m_lastHitFace = false; // used to optimize hit face search order

		//m_faceLength = m_flipperradius * sqrtf(1.0f-ratio*ratio); // Cosine of face angle X hypotenuse // = m_flipperradius * cosf(fa)

		this.m_zeroAngNorm.x =  Math.sqrt(1.0 - ratio * ratio); // F2 Norm, used in Green's transform, in FPM time search  // =  sinf(faceNormOffset)
		this.m_zeroAngNorm.y = -ratio;                   // F1 norm, change sign of x component, i.e -zeroAngNorm.x // = -cosf(faceNormOffset)

	}

	public updateDisplacements(dtime: number): void {
		this.m_angleCur += this.m_angleSpeed * dtime;	// move flipper angle

		const angleMin = Math.min(this.m_angleStart, this.m_angleEnd);
		const angleMax = Math.max(this.m_angleStart, this.m_angleEnd);

		if (this.m_angleCur > angleMax) {
			this.m_angleCur = angleMax;
		}
		if (this.m_angleCur < angleMin) {
			this.m_angleCur = angleMin;
		}

		if (Math.abs(this.m_angleSpeed) < 0.0005) {   // avoids 'jumping balls' when two or more balls held on flipper (and more other balls are in play) //!! make dependent on physics update rate
			return;
		}

		let handle_event = false;

		if (this.m_angleCur === angleMax) {        // hit stop?
			if (this.m_angleSpeed > 0) {
				handle_event = true;
			}
		} else if (this.m_angleCur === angleMin) {
			if (this.m_angleSpeed < 0) {
				handle_event = true;
			}
		}

		if (handle_event) {
			const anglespd = Math.abs(radToDeg(this.m_angleSpeed));
			this.m_angularMomentum *= -0.3; //!! make configurable?
			this.m_angleSpeed = this.m_angularMomentum / this.m_inertia;

			if (this.m_EnableRotateEvent > 0) {
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_EOS, anglespd); // send EOS event
				//
				// g_pplayer->this.m_pininput.this.m_leftkey_down_usec_EOS = usec(); // debug only
				// g_pplayer->this.m_pininput.this.m_leftkey_down_frame_EOS = g_pplayer->this.m_overall_frames;

			} else if (this.m_EnableRotateEvent < 0) {
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_BOS, anglespd); // send Beginning of Stroke/Park event
			}
			this.m_EnableRotateEvent = 0;
		}
	}

	public updateVelocities(): void {

		let desiredTorque = this.getStrength();
		if (!this.m_solState) {// this.m_solState: true = button pressed, false = released
			desiredTorque *= -this.getReturnRatio();
		}

		// hold coil is weaker
		const EOS_angle = degToRad(
			(this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
				? this.data.overrideTorqueDampingAngle!
				: this.data.torqueDampingAngle!);

		if (Math.abs(this.m_angleCur - this.m_angleEnd) < EOS_angle) {
			const lerp = Math.sqrt(Math.sqrt(Math.abs(this.m_angleCur - this.m_angleEnd) / EOS_angle)); // fade in/out damping, depending on angle to end
			desiredTorque *= lerp + ((this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
				? this.data.overrideTorqueDamping!
				: this.data.torqueDamping!) * (1.0 - lerp);
		}

		if (!this.m_direction) {
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
		if (desiredTorque >= this.m_curTorque) {
			this.m_curTorque = Math.min(this.m_curTorque + torqueRampupSpeed * PHYS_FACTOR, desiredTorque);
		} else {
			this.m_curTorque = Math.max(this.m_curTorque - torqueRampupSpeed * PHYS_FACTOR, desiredTorque);
		}

		// resolve contacts with stoppers
		let torque = this.m_curTorque;
		this.m_isInContact = false;
		if (Math.abs(this.m_angleSpeed) <= 1e-2) {
			const angleMin = Math.min(this.m_angleStart, this.m_angleEnd);
			const angleMax = Math.max(this.m_angleStart, this.m_angleEnd);

			if (this.m_angleCur >= angleMax - 1e-2 && torque > 0.) {
				this.m_angleCur = angleMax;
				this.m_isInContact = true;
				this.m_contactTorque = torque;
				this.m_angularMomentum = 0.;
				torque = 0.;
			} else if (this.m_angleCur <= angleMin + 1e-2 && torque < 0.) {
				this.m_angleCur = angleMin;
				this.m_isInContact = true;
				this.m_contactTorque = torque;
				this.m_angularMomentum = 0.;
				torque = 0.;
			}
		}

		this.m_angularMomentum += PHYS_FACTOR * torque;
		this.m_angleSpeed = this.m_angularMomentum / this.m_inertia;
		this.m_angularAcceleration = torque / this.m_inertia;
	}

	public addToList(): boolean {
		return true;
	}

	public setSolenoidState(s: boolean): void {
		this.m_solState = s;
	}

	public getStrokeRatio(): number {
		return (this.m_angleCur - this.m_angleStart) / (this.m_angleEnd - this.m_angleStart); // End == Start cannot happen, as handled in ctor
	}

	public setStartAngle(r: number): void {
		this.m_angleStart = r;
		const angleMin = Math.min(this.m_angleStart, this.m_angleEnd);
		const angleMax = Math.max(this.m_angleStart, this.m_angleEnd);
		if (this.m_angleCur > angleMax) {
			this.m_angleCur = angleMax;
		}
		if (this.m_angleCur < angleMin) {
			this.m_angleCur = angleMin;
		}
	}

	public setEndAngle(r: number): void {
		this.m_angleEnd = r;
		const angleMin = Math.min(this.m_angleStart, this.m_angleEnd);
		const angleMax = Math.max(this.m_angleStart, this.m_angleEnd);

		if (this.m_angleCur > angleMax) {
			this.m_angleCur = angleMax;
		}
		if (this.m_angleCur < angleMin) {
			this.m_angleCur = angleMin;
		}
	}

	public getReturnRatio(): number {
		return (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideReturnStrength!
			: this.data.return!;
	}

	public getMass(): number {
		return 3.0 * this.m_inertia / (this.m_flipperradius * this.m_flipperradius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public setMass(m: number): void {
		this.m_inertia = (1.0 / 3.0) * m * (this.m_flipperradius * this.m_flipperradius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public getStrength(): number {
		return (this.data.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics))
			? this.data.overrideStrength!
			: this.data.strength!;
	}

	// rigid body functions
	public surfaceVelocity(surfP: Vertex3D): Vertex3D {
		return FlipperMover.CrossZ(this.m_angleSpeed, surfP);
	}

	public surfaceAcceleration(surfP: Vertex3D): Vertex3D {
		// tangential acceleration = (0, 0, omega) x surfP
		const tangAcc = FlipperMover.CrossZ(this.m_angularAcceleration, surfP);

		// centripetal acceleration = (0,0,omega) x ( (0,0,omega) x surfP )
		const av2 = this.m_angleSpeed * this.m_angleSpeed;
		const centrAcc = new Vertex3D(-av2 * surfP.x, -av2 * surfP.y, 0);

		return tangAcc.add(centrAcc);
	}

	public getHitTime(): number {
		if (this.m_angleSpeed === 0) {
			return -1.0;
		}

		const angleMin = Math.min(this.m_angleStart, this.m_angleEnd);
		const angleMax = Math.max(this.m_angleStart, this.m_angleEnd);

		const dist = (this.m_angleSpeed > 0)
			? angleMax - this.m_angleCur       // >= 0
			: angleMin - this.m_angleCur;      // <= 0

		const hittime = dist / this.m_angleSpeed;

		if (!isFinite(hittime) || hittime < 0) {
			return -1.0;
		} else {
			return hittime;
		}
	}

	public applyImpulse(rotI: Vertex3D): void {
		this.m_angularMomentum += rotI.z;            // only rotation about z axis
		this.m_angleSpeed = this.m_angularMomentum / this.m_inertia;    // TODO: figure out moment of inertia
	}

	private static CrossZ(rz: number, v: Vertex3D): Vertex3D {
		return new Vertex3D(-rz * v.y, rz * v.x, 0.);
	}
}
