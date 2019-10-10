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
import { RubberData } from './rubber-data';
import { RubberState } from './rubber-state';

export class RubberApi extends ItemApi<RubberData> {

	private readonly state: RubberState;
	private readonly hits: HitObject[];

	constructor(state: RubberState, hits: HitObject[], data: RubberData, events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.state = state;
		this.hits = hits;
	}

	get Height() { return this.state.height; }
	set Height(v) { this.state.height = v; }
	get HitHeight() { return this.data.hitHeight; }
	set HitHeight(v) { this.data.hitHeight = v; }
	get Thickness() { return this.data.thickness; }
	set Thickness(v) { this.data.thickness = v; }
	get Material() { return this.state.material; }
	set Material(v) { this.state.material = v; }
	get Image() { return this.state.texture; }
	set Image(v) { this._assertNonHdrImage(v); this.state.texture = v; }
	get HasHitEvent() { return this.data.hitEvent; }
	set HasHitEvent(v) { this.data.hitEvent = v; }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get ElasticityFalloff() { return this.data.elasticityFalloff; }
	set ElasticityFalloff(v) { this.data.elasticityFalloff = v; }
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
	get Visible() { return this.state.isVisible; }
	set Visible(v) {
		if (this.data.staticRendering) {
			throw new Error('Rubber is static! Visible property not supported!');
		}
		this.state.isVisible = v;
	}
	get EnableStaticRendering() { return this.data.staticRendering; }
	set EnableStaticRendering(v) { this.data.staticRendering = v; }
	get EnableShowInEditor() { return this.data.showInEditor; }
	set EnableShowInEditor(v) { this.data.showInEditor = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get RotX() { return this.state.rotX; }
	set RotX(v) { this.state.rotX = v; }
	get RotY() { return this.state.rotY; }
	set RotY(v) { this.state.rotY = v; }
	get RotZ() { return this.state.rotZ; }
	set RotZ(v) { this.state.rotZ = v; }
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
