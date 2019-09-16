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

import { EventProxy } from '../../game/event-proxy';
import { IBallCreationPosition, Player } from '../../game/player';
import { Vertex3D } from '../../math/vertex3d';
import { logger } from '../../util/logger';
import { Ball } from '../ball/ball';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { KickerData } from './kicker-data';
import { KickerHit } from './kicker-hit';

export class KickerApi extends ItemApi<KickerData> {

	private readonly hit: KickerHit;
	private readonly ballCreator: IBallCreationPosition;

	constructor(data: KickerData, hit: KickerHit, events: EventProxy, ballCreator: IBallCreationPosition, player: Player, table: Table) {
		super(data, events, player, table);
		this.hit = hit;
		this.ballCreator = ballCreator;
	}

	get X() { return this.data.vCenter.x; }
	set X(v) { this.data.vCenter.x = v; }
	get Y() { return this.data.vCenter.y; }
	set Y(v) { this.data.vCenter.y = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get Enabled() { return this.data.isEnabled; }
	set Enabled(v) { this.data.isEnabled = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get HitAccuracy() { return this.data.hitAccuracy; }
	set HitAccuracy(v) { this.data.hitAccuracy = v; }
	get HitHeight() { return this.data.hitHeight; }
	set HitHeight(v) { this.data.hitHeight = v; }
	get Orientation() { return this.data.orientation; }
	set Orientation(v) { this.data.orientation = v; }
	get Radius() { return this.data.radius; }
	set Radius(v) { this.data.radius = v; }
	get FallThrough() { return this.data.fallThrough; }
	set FallThrough(v) { this.data.fallThrough = v; }
	get Legacy() { return this.data.legacyMode; }
	set Legacy(v) { this.data.legacyMode = v; }
	get DrawStyle() { return this.data.kickerType; }
	set DrawStyle(v) { this.data.kickerType = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }

	get LastCapturedBall(): Ball | null {

		if (!this.hit.lastCapturedBall) {
			logger().error('LastCapturedBall was called but no ball was captured!');
			return null;
		}

		let ballFound = false;
		for (const ball of this.player.balls) {
			if (ball === this.hit.lastCapturedBall) {
				ballFound = true;
				break;
			}
		}

		if (!ballFound) {
			logger().error('LastCapturedBall was called but ball is already destroyed!');
			return null;
		}

		return this.hit.lastCapturedBall; // todo need to return the *api* of the ball (currently non-existent)
	}

	public CreateSizedBallWithMass(radius: number, mass: number): Ball {
		return this.player.createBall(this.ballCreator, radius, mass);
	}

	public CreateSizedBall(radius: number): Ball {
		return this.player.createBall(this.ballCreator, radius);
	}

	public CreateBall(): Ball {
		return this.player.createBall(this.ballCreator);
	}

	public DestroyBall(): number {
		let cnt = 0;

		if (this.hit.ball) {
			++cnt;
			const b = this.hit.ball;
			this.hit.ball = undefined;
			this.player.destroyBall(b);
		}
		return cnt;
	}

	public KickXYZ(angle: number, speed: number, inclination: number, x: number, y: number, z: number) {
		this.hit.kickXyz(this.table, this.player.getPhysics(), angle, speed, inclination, new Vertex3D(x, y, z));
	}

	public KickZ(angle: number, speed: number, inclination: number, heightZ: number) {
		this.hit.kickXyz(this.table, this.player.getPhysics(), angle, speed, inclination, new Vertex3D(0, 0, heightZ));
	}

	public Kick(angle: number, speed: number, inclination: number = 0): void {
		this.hit.kickXyz(this.table, this.player.getPhysics(), angle, speed, inclination, new Vertex3D(0, 0, 0));
	}

	public _ballCountOver(): number {
		return super._ballCountOver(this.events);
	}
}
