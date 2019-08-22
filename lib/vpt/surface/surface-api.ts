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

import { Table } from '../..';
import { Player } from '../../game/player';
import { FireEvents } from '../../physics/fire-events';
import { ItemApi } from '../item-api';
import { Surface } from './surface';
import { SurfaceData } from './surface-data';
import { SurfaceHitGenerator } from './surface-hit-generator';

export class SurfaceApi extends ItemApi {

	private readonly surface: Surface;
	private readonly data: SurfaceData;
	private readonly hitGenerator: SurfaceHitGenerator;
	private readonly events: FireEvents;

	constructor(surface: Surface, data: SurfaceData, hitGenerator: SurfaceHitGenerator, events: FireEvents, player: Player, table: Table) {
		super(player, table);
		this.surface = surface;
		this.data = data;
		this.hitGenerator = hitGenerator;
		this.events = events;
	}

	// from IEditable
	get Name() { return this.data.wzName; }
	set Name(v) { this.data.wzName = v; }
	get TimerInterval() { return this.data.timer.interval; }
	set TimerInterval(v) { this.data.timer.interval = v; }
	get TimerEnabled() { return this.data.timer.enabled; }
	set TimerEnabled(v) { this.data.timer.enabled = v; }
	public UserValue: any;

	// from Surface
	get HasHitEvent() { return this.data.hitEvent; }
	set HasHitEvent(v) { this.data.hitEvent = v; }
	get Threshold() { return this.data.threshold; }
	set Threshold(v) { this.data.threshold = v; }
	get Image() { return this.data.szImage; }
	set Image(v) { this.data.szImage = v; }
	get SideMaterial() { return this.data.szSideMaterial; }
	set SideMaterial(v) { this.data.szSideMaterial = v; }
	get SlingshotMaterial() { return this.data.szSlingShotMaterial; }
	set SlingshotMaterial(v) { this.data.szSlingShotMaterial = v; }
	/** @deprecated */
	public ImageAlignment: any = null;
	get HeightBottom() { return this.data.heightBottom; }
	set HeightBottom(v) { this.data.heightBottom = v; }
	get HeightTop() { return this.data.heightTop; }
	set HeightTop(v) { this.data.heightTop = v; }
	get TopMaterial() { return this.data.szTopMaterial; }
	set TopMaterial(v) { this.data.szTopMaterial = v; }
	get PhysicsMaterial() { return this.data.szPhysicsMaterial; }
	set PhysicsMaterial(v) { this.data.szPhysicsMaterial = v; }
	get OverwritePhysics() { return this.data.overwritePhysics; }
	set OverwritePhysics(v) { this.data.overwritePhysics = v; }
	get CanDrop() { return this.data.isDroppable; }
	set CanDrop(v) { this.data.isDroppable = v; }
	get FlipbookAnimation() { return this.data.isFlipbook; }
	set FlipbookAnimation(v) { this.data.isFlipbook = v; }
	get IsBottomSolid() { return this.data.isBottomSolid; }
	set IsBottomSolid(v) { this.data.isBottomSolid = v; }
	get IsDropped() { return this.surface.isDropped; }
	set IsDropped(v) { this.surface.setDropped(v); }
	get DisplayTexture() { return this.data.displayTexture; }
	set DisplayTexture(v) { this.data.displayTexture = v; }
	get SlingshotStrength() { return this.data.slingshotForce; }
	set SlingshotStrength(v) { this.data.slingshotForce = v; }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get Friction() { return this.data.friction; }
	set Friction(v) { this.data.friction = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get Visible() { return this.data.isTopBottomVisible; }
	set Visible(v) { this.data.isTopBottomVisible = v; }
	get SideImage() { return this.data.szSideImage; }
	set SideImage(v) { this.assertNonHdrImage(v); this.data.szSideImage = v; }
	get Disabled() { return this.surface.isDisabled; }
	set Disabled(v) { this.surface.isDisabled = v; }
	get SideVisible() { return this.data.isSideVisible; }
	set SideVisible(v) { this.data.isSideVisible = v; }
	get Collidable() { return this.data.isCollidable; }
	set Collidable(v) { this.surface.setCollidable(v); }
	get SlingshotThreshold() { return this.data.slingshotThreshold; }
	set SlingshotThreshold(v) { this.data.slingshotThreshold = v; }
	get SlingshotAnimation() { return this.data.slingshotAnimation; }
	set SlingshotAnimation(v) { this.data.slingshotAnimation = v; }
	get DisableLighting() { return !!this.data.disableLightingTop; }
	set DisableLighting(v) { this.data.disableLightingTop = v ? 1 : 0; }
	get BlendDisableLighting() { return this.data.disableLightingTop; }
	set BlendDisableLighting(v) { this.data.disableLightingTop = v; }
	get BlendDisableLightingFromBelow() { return this.data.disableLightingBelow; }
	set BlendDisableLightingFromBelow(v) { this.data.disableLightingBelow = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }

	public PlaySlingshotHit() {
		for (const slingLine of this.hitGenerator.lineSling) {
			slingLine.doHitEvent = true;
		}
	}
}
