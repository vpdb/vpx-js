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
import { GameData } from '../game-data';
import { FlipperConfig } from './flipper';
import { FlipperData } from './flipper-data';
import { FlipperState } from './flipper-state';

export class FlipperMover implements MoverObject {

	private flipperData: FlipperData;
	private tableData: GameData;

	public hitCircleBase: HitCircle;
	public endRadius: number;
	public readonly flipperRadius: number;

	// kinematic state
	private angularMomentum: number;
	private angularAcceleration: number;
	public angleSpeed: number;
	public angleCur: number;

	private curTorque: number;
	private contactTorque?: number;

	public angleStart: number;
	public angleEnd: number;

	private inertia: number; // moment of inertia

	private zeroAngNorm: Vertex2D = new Vertex2D(); // base norms at zero degrees

	public enableRotateEvent: number; // -1,0,1

	private readonly direction: boolean;

	private solState: boolean; // is solenoid enabled?
	private isInContact: boolean;

	public isEnabled: boolean = false;
	public lastHitFace: boolean;
	private player!: Player;

	constructor(config: FlipperConfig, flipperData: FlipperData, player: Player, tableData: GameData) {

		this.hitCircleBase = new HitCircle(config.center, config.baseRadius, config.zLow, config.zHigh);
		this.flipperData = flipperData;
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
		this.angleCur = config.angleStart;

		this.angularMomentum = 0;
		this.angularAcceleration = 0;
		this.angleSpeed = 0;

		const ratio = (config.baseRadius - config.endRadius) / config.flipperRadius;

		// model inertia of flipper as that of rod of length flipr around its end
		const mass = this.flipperData.overridePhysics || (this.tableData.overridePhysicsFlipper && this.tableData.overridePhysics)
			? this.flipperData.overrideMass!
			: this.flipperData.mass;
		this.inertia = (1.0 / 3.0) * mass * (config.flipperRadius * config.flipperRadius);

		this.lastHitFace = false; // used to optimize hit face search order

		this.zeroAngNorm.x =  Math.sqrt(1.0 - ratio * ratio); // F2 Norm, used in Green's transform, in FPM time search  // =  sinf(faceNormOffset)
		this.zeroAngNorm.y = -ratio;                   // F1 norm, change sign of x component, i.e -zeroAngNorm.x // = -cosf(faceNormOffset)

		this.changeState();
	}

	public updateDisplacements(dtime: number): void {

		const lastAngle = this.angleCur;
		this.angleCur += this.angleSpeed * dtime;          // move flipper angle

		const angleMin = Math.min(this.angleStart, this.angleEnd);
		const angleMax = Math.max(this.angleStart, this.angleEnd);

		if (this.angleCur > angleMax) {
			this.angleCur = angleMax;
		}
		if (this.angleCur < angleMin) {
			this.angleCur = angleMin;
		}

		if (Math.abs(this.angleSpeed) < 0.0005) {          // avoids 'jumping balls' when two or more balls held on flipper (and more other balls are in play) //!! make dependent on physics update rate
			this.changeState(lastAngle);
			return;
		}

		let handleEvent = false;

		if (this.angleCur === angleMax) {                  // hit stop?
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
			this.angularMomentum *= -0.3;                            // make configurable?
			this.angleSpeed = this.angularMomentum / this.inertia;

			if (this.enableRotateEvent > 0) {
				console.log('[%s] Flipper is up', this.flipperData.getName());
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_EOS, anglespd); // send EOS event
				//
				// g_pplayer->this.m_pininput.this.m_leftkey_down_usec_EOS = usec(); // debug only
				// g_pplayer->this.m_pininput.this.m_leftkey_down_frame_EOS = g_pplayer->this.m_overall_frames;

			} else if (this.enableRotateEvent < 0) {
				console.log('[%s] Flipper is down', this.flipperData.getName());
				// this.m_pflipper->FireVoidEventParm(DISPID_LimitEvents_BOS, anglespd); // send Beginning of Stroke/Park event
			}
			this.enableRotateEvent = 0;
		}

		// announce movement
		this.changeState(lastAngle);
	}

	public updateVelocities(): void {

		let desiredTorque = this.getStrength();
		if (!this.solState) {                              // this.solState: true = button pressed, false = released
			desiredTorque *= -this.getReturnRatio();
		}

		// hold coil is weaker
		const eosAngle = degToRad(this.getTorqueDampingAngle());
		if (Math.abs(this.angleCur - this.angleEnd) < eosAngle) {
			// fade in/out damping, depending on angle to end
			const lerp = Math.sqrt(Math.sqrt(Math.abs(this.angleCur - this.angleEnd) / eosAngle));
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

			if (this.angleCur >= angleMax - 1e-2 && torque > 0) {
				this.angleCur = angleMax;
				this.isInContact = true;
				this.contactTorque = torque;
				this.angularMomentum = 0;
				torque = 0;

			} else if (this.angleCur <= angleMin + 1e-2 && torque < 0) {
				this.angleCur = angleMin;
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

	public getMass(): number {
		return 3.0 * this.inertia / (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public setMass(m: number): void {
		this.inertia = (1.0 / 3.0) * m * (this.flipperRadius * this.flipperRadius); //!! also change if wiring of moment of inertia happens (see ctor)
	}

	public getReturnRatio(): number {
		return this.doOverridePhysics()
			? this.flipperData.overrideReturnStrength!
			: this.flipperData.return!;
	}

	public getStrength(): number {
		return this.doOverridePhysics()
			? this.flipperData.overrideStrength!
			: this.flipperData.strength!;
	}

	private getTorqueDampingAngle(): number {
		return this.doOverridePhysics()
			? this.flipperData.overrideTorqueDampingAngle!
			: this.flipperData.torqueDampingAngle!;
	}

	private getTorqueDamping(): number {
		return this.doOverridePhysics()
			? this.flipperData.overrideTorqueDamping!
			: this.flipperData.torqueDamping!;
	}

	private getRampUpSpeed(): number {
		return this.doOverridePhysics()
			? this.flipperData.overrideCoilRampUp!
			: this.flipperData.rampUp!;
	}

	private doOverridePhysics(): boolean {
		return !!this.flipperData.overridePhysics
			|| (this.tableData.overridePhysicsFlipper && !!this.tableData.overridePhysics);
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

		const dist = this.angleSpeed > 0
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

	private changeState(lastAngle?: number) {
		if (typeof lastAngle === 'undefined' || lastAngle !== this.angleCur) {
			this.player.changeState(this.flipperData.getName(), new FlipperState(this.angleCur));
		}
	}

	private static CrossZ(rz: number, v: Vertex3D): Vertex3D {
		return new Vertex3D(-rz * v.y, rz * v.x, 0);
	}
}
