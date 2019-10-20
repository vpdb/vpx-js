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
import { HitObject } from '../../physics/hit-object';
import { ItemApi } from '../item-api';
import { Table } from '../table/table';
import { RampData } from './ramp-data';
import { RampState } from './ramp-state';

export class RampApi extends ItemApi<RampData> {

	private readonly hits: HitObject[];
	private readonly state: RampState;

	constructor(state: RampState, hits: HitObject[], data: RampData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.hits = hits;
		this.state = state;
	}

	get HeightBottom() { return this.state.heightBottom; }
	set HeightBottom(v) { this.state.heightBottom = v; }
	get HeightTop() { return this.state.heightTop; }
	set HeightTop(v) { this.state.heightTop = v; }
	get WidthBottom() { return this.state.widthBottom; }
	set WidthBottom(v) { this.state.widthBottom = v; }
	get WidthTop() { return this.state.widthTop; }
	set WidthTop(v) { this.state.widthTop = v; }
	get Material() { return this.state.material; }
	set Material(v) { this.state.material = v; }
	get Type() { return this.state.type; }
	set Type(v) { this.state.type = v; }
	get Image() { return this.state.texture; }
	set Image(v) { this._assertNonHdrImage(v); this.state.texture = v; }
	get ImageAlignment() { return this.state.textureAlignment; }
	set ImageAlignment(v) { this.state.textureAlignment = v; }
	get HasWallImage() { return this.state.hasWallImage; }
	set HasWallImage(v) { this.state.hasWallImage = v; }
	get LeftWallHeight() { return this.state.leftWallHeight; }
	set LeftWallHeight(v) { this.state.leftWallHeight = v; }
	get RightWallHeight() { return this.state.rightWallHeight; }
	set RightWallHeight(v) { this.state.rightWallHeight = v; }
	get VisibleLeftWallHeight() { return this.state.leftWallHeightVisible; }
	set VisibleLeftWallHeight(v) { this.state.leftWallHeightVisible = v; }
	get VisibleRightWallHeight() { return this.state.rightWallHeightVisible; }
	set VisibleRightWallHeight(v) { this.state.rightWallHeightVisible = v; }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get Friction() { return this.data.friction; }
	set Friction(v) { this.data.friction = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get Collidable() { return this.hits[0].isEnabled; }
	set Collidable(v) {
		if (v !== this.Collidable) {
			for (const hit of this.hits) {
				hit.isEnabled = v;
			}
		}
	}
	get HasHitEvent() { return this.data.hitEvent; }
	set HasHitEvent(v) { this.data.hitEvent = v; }
	get Threshold() { return this.data.threshold; }
	set Threshold(v) { this.data.threshold = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get DepthBias() { return this.state.depthBias; }
	set DepthBias(v) { this.state.depthBias = v; }
	get WireDiameter() { return this.data.wireDiameter; }
	set WireDiameter(v) { this.data.wireDiameter = v; }
	get WireDistanceX() { return this.data.wireDistanceX; }
	set WireDistanceX(v) { this.data.wireDistanceX = v; }
	get WireDistanceY() { return this.data.wireDistanceY; }
	set WireDistanceY(v) { this.data.wireDistanceY = v; }
	get PhysicsMaterial() { return this.data.szPhysicsMaterial; }
	set PhysicsMaterial(v) { this.data.szPhysicsMaterial = v; }
	get OverwritePhysics() { return this.data.overwritePhysics; }
	set OverwritePhysics(v) { this.data.overwritePhysics = v; }

	/**
	 * No idea wtf this is supposed to do.
	 */
	public InterfaceSupportsErrorInfo(riid: any): boolean {
		return false;
	}
}
