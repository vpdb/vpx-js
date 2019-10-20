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
import { SurfaceData } from './surface-data';
import { SurfaceHitGenerator } from './surface-hit-generator';
import { SurfaceState } from './surface-state';

export class SurfaceApi extends ItemApi<SurfaceData> {

	private readonly hitGenerator: SurfaceHitGenerator;
	private readonly state: SurfaceState;
	private readonly hits: HitObject[];

	constructor(state: SurfaceState, data: SurfaceData, hits: HitObject[], hitGenerator: SurfaceHitGenerator, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.state = state;
		this.hits = hits;
		this.hitGenerator = hitGenerator;
	}

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
	get IsDropped() { return this.state.isDropped; }
	set IsDropped(v) { this._setDropped(v); }
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
	set SideImage(v) { this._assertNonHdrImage(v); this.data.szSideImage = v; }
	get Disabled() { return this.data.isDisabled; }
	set Disabled(v) { this.data.isDisabled = v; }
	get SideVisible() { return this.state.isSideVisible; }
	set SideVisible(v) { this.data.isSideVisible = v; }
	get Collidable() { return this.data.isCollidable; }
	set Collidable(v) { this._setCollidable(v); }
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

	private _setDropped(isDropped: boolean): void {
		if (!this.data.isDroppable) {
			throw new Error(`Surface "${this.Name}" is not droppable.`);
		}
		if (this.state.isDropped !== isDropped) {
			this.state.isDropped = isDropped;
			const b = !this.state.isDropped && this.data.isCollidable;
			if (this.hits.length > 0 && this.hits[0].isEnabled !== b) {
				for (const drop of this.hits) { // !! costly
					drop.setEnabled(b); // disable hit on entities composing the object
				}
			}
		}
	}

	private _setCollidable(isCollidable: boolean) {
		const b = this.data.isDroppable ? (isCollidable && !this.state.isDropped) : isCollidable;
		if (this.hits.length > 0 && this.hits[0].isEnabled !== b) {
			for (const hit of this.hits) { // !! costly
				hit.isEnabled = b; // copy to hit checking on enities composing the object
			}
		}
	}
}
