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
import { PlayerPhysics } from '../../game/player-physics';
import { clamp } from '../../math/functions';
import { HitObject } from '../../physics/hit-object';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { HitTarget } from './hit-target';
import { HitTargetAnimation } from './hit-target-animation';
import { HitTargetData } from './hit-target-data';
import { HitTargetState } from './hit-target-state';

export class HitTargetApi extends ItemApi<HitTargetData> {

	private readonly state: HitTargetState;
	private readonly hits: HitObject[];
	private readonly animation: HitTargetAnimation;

	constructor(state: HitTargetState, data: HitTargetData, hits: HitObject[], animation: HitTargetAnimation, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.state = state;
		this.hits = hits;
		this.animation = animation;
	}

	get Image() { return this.state.texture; }
	set Image(v) { this._assertNonHdrImage(v); this.state.texture = v; }
	get Material() { return this.state.material; }
	set Material(v) { this.state.material = v; }
	get Visible() { return this.state.isVisible; }
	set Visible(v) { this.state.isVisible = v; }
	get X() { return this.data.vPosition.x; }
	set X(v) { this.data.vPosition.x = v; }
	get Y() { return this.data.vPosition.y; }
	set Y(v) { this.data.vPosition.y = v; }
	get Z() { return this.data.vPosition.z; }
	set Z(v) { this.data.vPosition.z = v; }
	get ScaleX() { return this.data.vSize.x; }
	set ScaleX(v) { this.data.vSize.x = v; }
	get ScaleY() { return this.data.vSize.y; }
	set ScaleY(v) { this.data.vSize.y = v; }
	get ScaleZ() { return this.data.vSize.z; }
	set ScaleZ(v) { this.data.vSize.z = v; }
	get Orientation() { return this.data.rotZ; }
	set Orientation(v) { this.data.rotZ = v; }
	get HasHitEvent() { return this.data.useHitEvent; }
	set HasHitEvent(v) { this.data.useHitEvent = v; }
	get Threshold() { return this.data.threshold; }
	set Threshold(v) { this.data.threshold = v; }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get ElasticityFalloff() { return this.data.elasticityFalloff; }
	set ElasticityFalloff(v) { this.data.elasticityFalloff = v; }
	get Friction() { return this.data.friction; }
	set Friction(v) { this.data.friction = clamp(v, 0, 1); }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get Collidable() { return this.data.isCollidable; }
	set Collidable(v) { this._setCollidable(v); }
	get DisableLighting() { return !!this.data.disableLightingTop; }
	set DisableLighting(v) { this.data.disableLightingTop = v ? 1 : 0; }
	get BlendDisableLighting() { return this.data.disableLightingTop; }
	set BlendDisableLighting(v) { this.data.disableLightingTop = v; }
	get BlendDisableLightingFromBelow() { return this.data.disableLightingBelow; }
	set BlendDisableLightingFromBelow(v) { this.data.disableLightingBelow = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get DropSpeed() { return this.data.dropSpeed; }
	set DropSpeed(v) { this.data.dropSpeed = v; }
	get IsDropped() { return this.data.isDropped; }
	set IsDropped(v) { this._setDropped(v, this.table, this.player.getPhysics()); }
	get LegacyMode() { return this.data.legacy; }
	set LegacyMode(v) { this.data.legacy = v; }
	get DrawStyle() { return this.data.targetType; }
	set DrawStyle(v) { this.data.targetType = v; }
	get PhysicsMaterial() { return this.data.szPhysicsMaterial; }
	set PhysicsMaterial(v) { this.data.szPhysicsMaterial = v; }
	get OverwritePhysics() { return this.data.overwritePhysics; }
	set OverwritePhysics(v) { this.data.overwritePhysics = v; }
	get DepthBias() { return this.data.depthBias; }
	set DepthBias(v) { this.data.depthBias = v; }
	get HitThreshold() { return this.events.currentHitThreshold; }
	get RaiseDelay() { return this.data.raiseDelay; }
	set RaiseDelay(v) { this.data.raiseDelay = v; }

	private _setCollidable(isCollidable: boolean) {
		if (this.hits && this.hits.length > 0 && this.hits[0].isEnabled !== isCollidable) {
			for (const hit of this.hits) {     // !! costly
				hit.isEnabled = isCollidable;  // copy to hit checking on enities composing the object
			}
		}
		this.data.isCollidable = isCollidable;
	}

	private _setDropped(val: boolean, table: Table, physics: PlayerPhysics) {
		if (this.data.isDropped !== val && this.animation) {
			if (val) {
				this.animation.moveAnimation = true;
				this.state.zOffset = 0.0;
				this.animation.moveDown = true;

			} else {
				this.animation.moveAnimation = true;
				this.state.zOffset = -HitTarget.DROP_TARGET_LIMIT * table.getScaleZ();
				this.animation.moveDown = false;
				this.animation.timeStamp = physics.timeMsec;
			}
		} else {
			this.data.isDropped = val;
		}
	}
}
