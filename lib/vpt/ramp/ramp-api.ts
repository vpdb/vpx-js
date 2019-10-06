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

export class RampApi extends ItemApi<RampData> {

	private readonly hits: HitObject[];

	constructor(hits: HitObject[], data: RampData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.hits = hits;
	}

	get HeightBottom() { return this.data.heightBottom; }
	set HeightBottom(v) { this.data.heightBottom = v; }
	get HeightTop() { return this.data.heightTop; }
	set HeightTop(v) { this.data.heightTop = v; }
	get WidthBottom() { return this.data.widthBottom; }
	set WidthBottom(v) { this.data.widthBottom = v; }
	get WidthTop() { return this.data.widthTop; }
	set WidthTop(v) { this.data.widthTop = v; }
	get Material() { return this.data.szMaterial; }
	set Material(v) { this.data.szMaterial = v; }
	get Type() { return this.data.rampType; }
	set Type(v) { this.data.rampType = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this._assertNonHdrImage(v); this.data.szImage = v; }
	get ImageAlignment() { return this.data.imageAlignment; }
	set ImageAlignment(v) { this.data.imageAlignment = v; }
	get HasWallImage() { return this.data.imageWalls; }
	set HasWallImage(v) { this.data.imageWalls = v; }
	get LeftWallHeight() { return this.data.leftWallHeight; }
	set LeftWallHeight(v) { this.data.leftWallHeight = v; }
	get RightWallHeight() { return this.data.rightWallHeight; }
	set RightWallHeight(v) { this.data.rightWallHeight = v; }
	get VisibleLeftWallHeight() { return this.data.leftWallHeightVisible; }
	set VisibleLeftWallHeight(v) { this.data.leftWallHeightVisible = v; }
	get VisibleRightWallHeight() { return this.data.rightWallHeightVisible; }
	set VisibleRightWallHeight(v) { this.data.rightWallHeightVisible = v; }
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
	get DepthBias() { return this.data.depthBias; }
	set DepthBias(v) { this.data.depthBias = v; }
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
