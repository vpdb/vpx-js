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
import { Player } from '../../game/player';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { Ball } from './ball';
import { BallData } from './ball-data';
import { BallHit } from './ball-hit';
import { BallState } from './ball-state';

export class BallApi extends ItemApi<BallData> {

	private readonly ball: Ball;
	private readonly state: BallState;
	private readonly hit: BallHit;

	constructor(ball: Ball, state: BallState, hit: BallHit, data: BallData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.ball = ball;
		this.state = state;
		this.hit = hit;
	}

	get X() { return this.state.pos.x; }
	set X(v) { this.state.pos.x = v; }
	get Y() { return this.state.pos.y; }
	set Y(v) { this.state.pos.y = v; }
	get Z() { return this.state.pos.z; }
	set Z(v) { this.state.pos.z = v; }
	get VelX() { return this.hit.vel.x; }
	set VelX(v) { this.hit.vel.x = v; this.hit.calcHitBBox(); }
	get VelY() { return this.hit.vel.y; }
	set VelY(v) { this.hit.vel.y = v; this.hit.calcHitBBox(); }
	get VelZ() { return this.hit.vel.z; }
	set VelZ(v) { this.hit.vel.z = v; this.hit.calcHitBBox(); }
	get AngVelX() { return this.hit.angularVelocity.x; }
	set AngVelX(v) { this.hit.angularVelocity.x = v; this.hit.calcHitBBox(); }
	get AngVelY() { return this.hit.angularVelocity.y; }
	set AngVelY(v) { this.hit.angularVelocity.y = v; this.hit.calcHitBBox(); }
	get AngVelZ() { return this.hit.angularVelocity.z; }
	set AngVelZ(v) { this.hit.angularVelocity.z = v; this.hit.calcHitBBox(); }
	get AngMomX() { return this.hit.angularMomentum.x; }
	set AngMomX(v) { this.hit.angularMomentum.x = v; this.hit.calcHitBBox(); }
	get AngMomY() { return this.hit.angularMomentum.y; }
	set AngMomY(v) { this.hit.angularMomentum.y = v; this.hit.calcHitBBox(); }
	get AngMomZ() { return this.hit.angularMomentum.z; }
	set AngMomZ(v) { this.hit.angularMomentum.z = v; this.hit.calcHitBBox(); }
	get Color() { return this.data.color; }
	set Color(v) { this.data.color = v; }
	get Image() { return this.data.environmentMap; }
	set Image(v) { this.data.environmentMap = v; }
	get FrontDecal() { return this.data.frontDecal; }
	set FrontDecal(v) { this._assertNonHdrImage(v); this.data.frontDecal = v; }
	get DecalMode() { return this.data.decalMode; }
	set DecalMode(v) { this.data.decalMode = v; }
	get Mass() { return this.data.mass; }
	set Mass(v) { this.hit.setMass(v); }
	get ID() { return this.ball.id; }
	set ID(v) { this.ball.id = v; }
	get Radius() { return this.data.radius; }
	set Radius(v) { this.hit.setRadius(v); }
	get BulbIntensityScale() { return this.data.bulbIntensityScale; }
	set BulbIntensityScale(v) { this.data.bulbIntensityScale = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get PlayfieldReflectionScale() { return this.data.playfieldReflectionStrength; }
	set PlayfieldReflectionScale(v) { this.data.playfieldReflectionStrength = v; }
	get ForceReflection() { return this.data.forceReflection; }
	set ForceReflection(v) { this.data.forceReflection = v; }
	get Visible() { return this.hit.isVisible; }
	set Visible(v) { this.hit.isVisible = v; }

	public DestroyBall(): number {
		this.player.destroyBall(this.ball);
		return 1;
	}
}
