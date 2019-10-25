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
import { BumperAnimation } from './bumper-animation';
import { BumperData } from './bumper-data';
import { BumperState } from './bumper-state';

export class BumperApi extends ItemApi<BumperData> {

	private readonly state: BumperState;
	private readonly animation: BumperAnimation;
	private readonly isBaseDynamic: boolean;
	private readonly isCapDynamic: boolean;
	private readonly isRingDynamic: boolean;
	private readonly isSkirtDynamic: boolean;

	constructor(state: BumperState, animation: BumperAnimation, data: BumperData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.state = state;
		this.animation = animation;
		const baseMaterial = table.getMaterial(data.szBaseMaterial);
		const capMaterial = table.getMaterial(data.szCapMaterial);
		const ringMaterial = table.getMaterial(data.szRingMaterial);
		const skirtMaterial = table.getMaterial(data.szSkirtMaterial);
		this.isBaseDynamic = !!baseMaterial && baseMaterial.isOpacityActive;
		this.isCapDynamic = !!capMaterial && capMaterial.isOpacityActive;
		this.isRingDynamic = !!ringMaterial && ringMaterial.isOpacityActive;
		this.isSkirtDynamic = !!skirtMaterial && skirtMaterial.isOpacityActive;
	}

	get Radius() { return this.data.radius; }
	set Radius(v) { this.data.radius = v; }
	get Force() { return this.data.force; }
	set Force(v) { this.data.force = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get HeightScale() { return this.data.heightScale; }
	set HeightScale(v) { this.data.heightScale = v; }
	get RingSpeed() { return this.data.ringSpeed; }
	set RingSpeed(v) { this.data.ringSpeed = v; }
	get RingDropOffset() { return this.data.ringDropOffset; }
	set RingDropOffset(v) { this.data.ringDropOffset = v; }
	get Orientation() { return this.data.orientation; }
	set Orientation(v) { this.data.orientation = v; }
	get Threshold() { return this.data.threshold; }
	set Threshold(v) { this.data.threshold = v; }
	get CapMaterial() { return this.data.szCapMaterial; }
	set CapMaterial(v) {
		if (this.isCapDynamic) {
			this.state.capMaterial = v;
		}
		this.data.szCapMaterial = v;
	}
	get RingMaterial() { return this.data.szRingMaterial; }
	set RingMaterial(v) {
		if (this.isRingDynamic) {
			this.state.ringMaterial = v;
		}
		this.data.szRingMaterial = v;
	}
	get BaseMaterial() { return this.data.szBaseMaterial; }
	set BaseMaterial(v) {
		if (this.isBaseDynamic) {
			this.state.baseMaterial = v;
		}
		this.data.szBaseMaterial = v;
	}
	get SkirtMaterial() { return this.data.szSkirtMaterial; }
	set SkirtMaterial(v) {
		if (this.isSkirtDynamic) {
			this.state.skirtMaterial = v;
		}
		this.data.szSkirtMaterial = v;
	}
	get X() { return this.data.center.x; }
	set X(v) { this.data.center.x = v; }
	get Y() { return this.data.center.y; }
	set Y(v) { this.data.center.y = v; }
	get Surface() { return this.data.szSurface; }
	set Surface(v) { this.data.szSurface = v; }
	get HasHitEvent() { return this.data.hitEvent; }
	set HasHitEvent(v) { this.data.hitEvent = v; }
	get Collidable() { return this.data.isCollidable; }
	set Collidable(v) { this.data.isCollidable = v; }
	get CapVisible() { return this.data.isCapVisible; }
	set CapVisible(v) {
		if (this.isCapDynamic) {
			this.state.isCapVisible = v;
		}
		this.data.isCapVisible = v;
	}
	get BaseVisible() { return this.data.isBaseVisible; }
	set BaseVisible(v) {
		if (this.isBaseDynamic) {
			this.state.isBaseVisible = v;
		}
		this.data.isBaseVisible = v;
	}
	get RingVisible() { return this.data.isRingVisible; }
	set RingVisible(v) {
		if (this.isRingDynamic) {
			this.state.isRingVisible = v;
		}
		this.data.isRingVisible = v;
	}
	get SkirtVisible() { return this.data.isSkirtVisible; }
	set SkirtVisible(v) {
		if (this.isSkirtDynamic) {
			this.state.isSkirtVisible = v;
		}
		this.data.isSkirtVisible = v;
	}
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get EnableSkirtAnimation() { return this.animation.enableSkirtAnimation; }
	set EnableSkirtAnimation(v) { this.animation.enableSkirtAnimation = v; }

	public PlayHit() {
		this.animation.hitEvent = true;
	}

	/**
	 * No idea wtf this is supposed to do.
	 */
	public InterfaceSupportsErrorInfo(riid: any): boolean {
		return false;
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(BumperApi.prototype);
	}
}
