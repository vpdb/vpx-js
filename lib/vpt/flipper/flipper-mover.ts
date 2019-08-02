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
import { degToRad, radToDeg } from '../../math/float';
import { Vertex2D } from '../../math/vertex2d';
import { Vertex3D } from '../../math/vertex3d';
import { PHYS_FACTOR } from '../../physics/constants';
import { HitCircle } from '../../physics/hit-circle';
import { MoverObject } from '../../physics/mover-object';
import { logger } from '../../util/logger';
import { TableData } from '../table/table-data';
import { FlipperConfig } from './flipper';
import { FlipperData } from './flipper-data';
import { FlipperState } from './flipper-state';

export class FlipperMover implements MoverObject {

	private readonly data: FlipperData;
	private readonly state: FlipperState;

	private tableData: TableData;

	public hitCircleBase: HitCircle;
	public endRadius: number;
	public readonly flipperRadius: number;

	// kinematic state
	private angularMomentum: number;
	private angularAcceleration: number;
	public angleSpeed: number;

	private curTorque: number;
	public contactTorque: number = 0;

	public angleStart: number;
	public angleEnd: number;

	public inertia: number; // moment of inertia

	public zeroAngNorm: Vertex2D = new Vertex2D(); // base norms at zero degrees

	public enableRotateEvent: number; // -1,0,1

	private readonly direction: boolean;

	private solState: boolean; // is solenoid enabled?
	public isInContact: boolean;

	public isEnabled: boolean = false;
	public lastHitFace: boolean;
	private player!: Player;

	constructor(config: FlipperConfig, flipperData: FlipperData, state: FlipperState, player: Player, tableData: TableData) {

		this.hitCircleBase = new HitCircle(config.center, config.baseRadius, config.zLow, config.zHigh);
		this.data = flipperData;
		this.state = state;
		this.tableData = tableData;
		this.player = player;

		this.endRadius = config.endRadius;         // radius of flipper end
		this.flipperRadius = config.flipperRadius;    // radius of flipper arc, center-to-center radius

		if (config.angleEnd === config.angleStart) { // otherwise hangs forever in collisions/updates
			config.angleEnd += 0.0001;
		}

		this.direction = config.angleEnd >= config.angleStart;
		this.solState = false;
		this.isInContact = false;
		this.curTorque = 0.0;
		this.enableRotateEvent = 0;

		this.angleStart = config.angleStart;
		this.angleEnd = config.angleEnd;
		this.state.angle = config.angleStart;

		this.angularMomentum = 0;
		this.angularAcceleration = 0;
		this.angleSpeed = 0;

		const ratio = (config.baseRadius - config.endRadius) / config.flipperRadius;

		// model inertia of flipper as that of rod of length flipr around its end
		const mass = this.getFlipperMass();
		this.inertia = (1.0 / 3.0) * mass * (config.flipperRadius * config.flipperRadius);

		this.lastHitFace = false; // used to optimize hit face search order

		this.zeroAngNorm.x =  Math.sqrt(1.0 - ratio * ratio); // F2 Norm, used in Green's transform, in FPM time search  // =  sinf(faceNormOffset)
		this.zeroAngNorm.y = -ratio;                   // F1 norm, change sign of x component, i.e -zeroAngNorm.x // = -cosf(faceNormOffset)
	}

	public updateDisplacements(dtime: number): void {

		const lastAngle = this.state.angle;
		this.state.angle += this.angleSpeed * dtime;          // move flipper angle

		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		if (this.state.angle > angleMax) {
			this.state.angle = angleMax;
		}
		if (this.state.angle < angleMin) {
			this.state.angle = angleMin;
		}

		if (Math.abs(this.angleSpeed) < 0.0005) {          // avoids 'jumping balls' when two or more balls held on flipper (and more other balls are in play) //!! make dependent on physics update rate
			return;
		}

		let handleEvent = false;

		if (this.state.angle === angleMax) {                  // hit stop?
			if (this.angleSpeed > 0) {
				handleEvent = true;
			}
		} else if (this.state.angle === angleMin) {
			if (this.angleSpeed < 0) {
				handleEvent = true;
			}
		}

		if (handleEvent) {
			const anglespd = Math.abs(radToDeg(this.angleSpeed));
			this.angularMomentum *= -0.3;                            // make configurable?
			this.angleSpeed = this.angularMomentum / this.inertia;

			if (this.enableRotateEvent > 0) {
				logger().info('[%s] Flipper is up', this.data.getName());
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_EOS, anglespd); // send EOS event
				//
				// g_pplayer->this.m_pininput.this.m_leftkey_down_usec_EOS = usec(); // debug only
				// g_pplayer->this.m_pininput.this.m_leftkey_down_frame_EOS = g_pplayer->this.m_overall_frames;

			} else if (this.enableRotateEvent < 0) {
				logger().info('[%s] Flipper is down', this.data.getName());
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_BOS, anglespd); // send Beginning of Stroke/Park event
			}
			this.enableRotateEvent = 0;
		}
	}

	public updateVelocities(): void {

		let desiredTorque = this.getStrength();
		if (!this.solState) {                              // this.solState: true = button pressed, false = released
			desiredTorque *= -this.getReturnRatio();
		}

		// hold coil is weaker
		const eosAngle = degToRad(this.getTorqueDampingAngle());
		if (Math.abs(this.state.angle - this.angleEnd) < eosAngle) {
			// fade in/out damping, depending on angle to end
			const lerp = Math.sqrt(Math.sqrt(Math.abs(this.state.angle - this.angleEnd) / eosAngle));
			desiredTorque *= lerp + this.getTorqueDamping() * (1 - lerp);
		}

		if (!this.direction) {
			desiredTorque = -desiredTorque;
		}

		let torqueRampupSpeed = this.getRampUpSpeed();
		if (torqueRampupSpeed <= 0) {
			torqueRampupSpeed = 1e6;                       // set very high for instant coil response
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

			if (this.state.angle >= angleMax - 1e-2 && torque > 0) {
				this.state.angle = angleMax;
				this.isInContact = true;
				this.contactTorque = torque;
				this.angularMomentum = 0;
				torque = 0;

			} else if (this.state.angle <= angleMin + 1e-2 && torque < 0) {
				this.state.angle = angleMin;
				this.isInContact = true;
				this.contactTorque = torque;
				this.angularMomentum = 0;
				torque = 0;
			}
		}

		this.angularMomentum += PHYS_FACTOR * torque;
		this.angleSpeed = this.angularMomentum / this.inertia;
		this.angularAcceleration = torque / this.inertia;
	}

	public setSolenoidState(s: boolean): void {
		this.solState = s;
	}

	// public getStrokeRatio(): number {
	// 	return (this.state.angle - this.angleStart) / (this.angleEnd - this.angleStart); // End == Start cannot happen, as handled in ctor
	// }

	// public setStartAngle(r: number): void {
	// 	this.angleStart = r;
	// 	const angleMin = Math.min(this.angleStart, this.angleEnd);
	// 	const angleMax = Math.max(this.angleStart, this.angleEnd);
	// 	if (this.state.angle > angleMax) {
	// 		this.state.angle = angleMax;
	// 	}
	// 	if (this.state.angle < angleMin) {
	// 		this.state.angle = angleMin;
	// 	}
	// }

	// public setEndAngle(r: number): void {
	// 	this.angleEnd = r;
	// 	const angleMin = Math.min(this.angleStart, this.angleEnd);
	// 	const angleMax = Math.max(this.angleStart, this.angleEnd);
	//
	// 	if (this.state.angle > angleMax) {
	// 		this.state.angle = angleMax;
	// 	}
	// 	if (this.state.angle < angleMin) {
	// 		this.state.angle = angleMin;
	// 	}
	// }

	// public getMass(): number {
	// 	return 3.0 * this.inertia / (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	// }

	// public setMass(m: number): void {
	// 	this.inertia = (1.0 / 3.0) * m * (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	// }

	public getReturnRatio(): number {
		return this.doOverridePhysics()
			? this.data.overrideReturnStrength!
			: this.data.return!;
	}

	public getStrength(): number {
		return this.doOverridePhysics()
			? this.data.overrideStrength!
			: this.data.strength!;
	}

	private getTorqueDampingAngle(): number {
		return this.doOverridePhysics()
			? this.data.overrideTorqueDampingAngle!
			: this.data.torqueDampingAngle!;
	}
	private getFlipperMass(): number {
		return this.doOverridePhysics()
			? this.data.overrideMass!
			: this.data.mass;
	}

	private getTorqueDamping(): number {
		return this.doOverridePhysics()
			? this.data.overrideTorqueDamping!
			: this.data.torqueDamping!;
	}

	private getRampUpSpeed(): number {
		return this.doOverridePhysics()
			? this.data.overrideCoilRampUp!
			: this.data.rampUp!;
	}

	private doOverridePhysics(): boolean {
		return !!this.data.overridePhysics
			|| (this.tableData.overridePhysicsFlipper && !!this.tableData.overridePhysics);
	}

	// rigid body functions
	public surfaceVelocity(surfP: Vertex3D): Vertex3D {
		return Vertex3D.crossZ(this.angleSpeed, surfP);
	}

	public getHitTime(): number {
		if (this.angleSpeed === 0) {
			return -1.0;
		}

		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		const dist = this.angleSpeed > 0
			? angleMax - this.state.angle       // >= 0
			: angleMin - this.state.angle;      // <= 0

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
}
