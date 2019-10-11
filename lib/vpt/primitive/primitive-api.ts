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
import { TimerHit } from '../timer/timer-hit';
import { Primitive } from './primitive';
import { PrimitiveData } from './primitive-data';
import { PrimitiveState } from './primitive-state';

export class PrimitiveApi extends ItemApi<PrimitiveData> {

	private readonly primitive: Primitive;
	private readonly state: PrimitiveState;
	private readonly hits: HitObject[];

	constructor(primitive: Primitive, state: PrimitiveState, data: PrimitiveData, hits: HitObject[], events: EventProxy, player: Player, table: Table) {
		super(data, events, player, table);
		this.primitive = primitive;
		this.state = state;
		this.hits = hits;
	}

	get Image() { return this.state.map; }
	set Image(v) { this._assertNonHdrImage(v); this.state.map = v; }
	get NormalMap() { return this.state.normalMap; }
	set NormalMap(v) { this._assertNonHdrImage(v); this.state.normalMap = v; }
	get Material() { return this.state.material; }
	set Material(v) { this.state.material = v; }
	get MeshFileName() { return this.data.meshFileName; }
	set MeshFileName(v) { this.data.meshFileName = v; }
	get Sides() { return this.data.sides; }
	set Sides(v) { this.primitive.setSides(v); }
	get SideColor() { return this.data.sideColor; }
	set SideColor(v) { this.data.sideColor = v; }
	get Visible() { return this.data.isVisible; }
	set Visible(v) { this.data.isVisible = v; }
	get DrawTexturesInside() { return this.data.drawTexturesInside; } // TODO test
	set DrawTexturesInside(v) { this.data.drawTexturesInside = v; }
	get X() { return this.data.position.x; }
	set X(v) { this.data.position.x = v; }
	get Y() { return this.data.position.y; }
	set Y(v) { this.data.position.y = v; }
	get Z() { return this.data.position.z; }
	set Z(v) { this.data.position.z = v; }
	get Size_X() { return this.state.size.x; } // TODO make sure it doesn't conflict with event callbacks
	set Size_X(v) { this.state.size.x = v; }
	get Size_Y() { return this.state.size.y; }
	set Size_Y(v) { this.state.size.y = v; }
	get Size_Z() { return this.state.size.z; }
	set Size_Z(v) { this.state.size.z = v; }
	get RotAndTra0() { return this.RotX; }
	set RotAndTra0(v) { this.RotX = v; }
	get RotX() { return this.state.rotation.x; }
	set RotX(v) { this.state.rotation.x = v; }
	get RotAndTra1() { return this.RotY; }
	set RotAndTra1(v) { this.RotY = v; }
	get RotY() { return this.state.rotation.y; }
	set RotY(v) { this.state.rotation.y = v; }
	get RotAndTra2() { return this.RotZ; }
	set RotAndTra2(v) { this.RotZ = v; }
	get RotZ() { return this.state.rotation.z; }
	set RotZ(v) { this.state.rotation.z = v; }
	get RotAndTra3() { return this.TransX; }
	set RotAndTra3(v) { this.TransX = v; }
	get TransX() { return this.state.translation.x; }
	set TransX(v) { this.state.translation.x = v; }
	get RotAndTra4() { return this.TransY; }
	set RotAndTra4(v) { this.TransY = v; }
	get TransY() { return this.state.translation.y; }
	set TransY(v) { this.state.translation.y = v; }
	get RotAndTra5() { return this.TransZ; }
	set RotAndTra5(v) { this.TransZ = v; }
	get TransZ() { return this.state.translation.z; }
	set TransZ(v) { this.state.translation.z = v; }
	get RotAndTra6() { return this.ObjRotX; }
	set RotAndTra6(v) { this.ObjRotX = v; }
	get ObjRotX() { return this.state.objectRotation.x; }
	set ObjRotX(v) { this.state.objectRotation.x = v; }
	get RotAndTra7() { return this.ObjRotY; }
	set RotAndTra7(v) { this.ObjRotY = v; }
	get ObjRotY() { return this.state.objectRotation.y; }
	set ObjRotY(v) { this.state.objectRotation.y = v; }
	get RotAndTra8() { return this.ObjRotZ; }
	set RotAndTra8(v) { this.ObjRotZ = v; }
	get ObjRotZ() { return this.state.objectRotation.z; }
	set ObjRotZ(v) { this.state.objectRotation.z = v; }
	get EdgeFactorUI() { return this.data.edgeFactorUI; }
	set EdgeFactorUI(v) { this.data.edgeFactorUI = v; }
	get CollisionReductionFactor() { return this.data.collisionReductionFactor; }
	set CollisionReductionFactor(v) { this.data.collisionReductionFactor = v; }
	get EnableStaticRendering() { return this.data.staticRendering; }
	set EnableStaticRendering(v) { this.data.staticRendering = v; }
	get HasHitEvent() { return this.data.hitEvent; }
	set HasHitEvent(v) { this.data.hitEvent = v; }
	get Threshold() { return this.data.threshold; }
	set Threshold(v) { this.data.threshold = v; }
	get Elasticity() { return this.data.elasticity; }
	set Elasticity(v) { this.data.elasticity = v; }
	get ElasticityFalloff() { return this.data.elasticityFalloff; }
	set ElasticityFalloff(v) { this.data.elasticityFalloff = v; }
	get Friction() { return this.data.friction; }
	set Friction(v) { this.data.friction = v; }
	get Scatter() { return this.data.scatter; }
	set Scatter(v) { this.data.scatter = v; }
	get Collidable() { return this.hits.length === 0 ? this.data.isCollidable : this.hits[0].isEnabled; }
	set Collidable(v) { this.primitive.setCollidable(v); }
	get IsToy() { return this.data.isToy; }
	set IsToy(v) { this.data.isToy = v; }
	get BackfacesEnabled() { return this.data.backfacesEnabled; }
	set BackfacesEnabled(v) { this.data.backfacesEnabled = v; }
	get DisableLighting() { return this.data.disableLightingTop !== 0; }
	set DisableLighting(v) { this.data.disableLightingTop = v ? 1 : 0; }
	get BlendDisableLighting() { return this.data.disableLightingTop; }
	set BlendDisableLighting(v) { this.data.disableLightingTop = v; }
	get BlendDisableLightingFromBelow() { return this.data.disableLightingBelow; }
	set BlendDisableLightingFromBelow(v) { this.data.disableLightingBelow = v; }
	get ReflectionEnabled() { return this.data.isReflectionEnabled; }
	set ReflectionEnabled(v) { this.data.isReflectionEnabled = v; }
	get PhysicsMaterial() { return this.data.szPhysicsMaterial; }
	set PhysicsMaterial(v) { this.data.szPhysicsMaterial = v; }
	get OverwritePhysics() { return this.data.overwritePhysics; }
	set OverwritePhysics(v) { this.data.overwritePhysics = v; }
	get HitThreshold() { return this.events.currentHitThreshold; }
	get DisplayTexture() { return this.data.displayTexture; }
	set DisplayTexture(v) { this.data.displayTexture = v; }
	get DepthBias() { return this.data.depthBias; }
	set DepthBias(v) { this.data.depthBias = v; }

	/* istanbul ignore next: remove ignore when implemented */
	public PlayAnim(startFrame: number, speed: number): void {
		// fixme anim
		// if (this.data.mesh.animationFrames.length > 0) {
		// 	if (startFrame >= this.data.mesh.animationFrames.length) {
		// 		startFrame = 0.0;
		// 	}
		// 	if (startFrame < 0.0) {
		// 		startFrame *= 1.0;
		// 	}
		// 	m_currentFrame = startFrame;
		// 	if (speed < 0.0) {
		// 		speed *= -1.0;
		// 	}
		// 	m_speed = speed;
		// 	m_DoAnimation = true;
		// 	m_Endless = false;
		// 	vertexBufferRegenerate = true;
		// }
	}

	/* istanbul ignore next: remove ignore when implemented */
	public PlayAnimEndless(speed: number): void {
		// fixme anim
		// if (this.data.mesh.animationFrames.length > 0) {
		// 	m_currentFrame = 0.0;
		// 	if (speed < 0.0) {
		// 		speed *= -1.0;
		// 	}
		// 	m_speed = speed;
		// 	m_DoAnimation = true;
		// 	m_Endless = true;
		// 	vertexBufferRegenerate = true;
		// }
	}

	/* istanbul ignore next: remove ignore when implemented */
	public StopAnim(): void {
		// fixme anim
		// m_DoAnimation = false;
		// vertexBufferRegenerate = false;
	}

	/* istanbul ignore next: remove ignore when implemented */
	public ContinueAnim(speed: number): void {
		// fixme anim
		// if (m_currentFrame > 0.0) {
		// 	if (speed < 0.0) {
		// 		speed *= -1.0;
		// 	}
		// 	m_speed = speed;
		// 	m_DoAnimation = true;
		// 	vertexBufferRegenerate = true;
		// }
	}

	/* istanbul ignore next: remove ignore when implemented */
	public ShowFrame(frame: number): void {
		// fixme anim
		// const iFrame = frame;
		// m_DoAnimation = false;
		// if (iFrame >= this.data.mesh.animationFrames.length) {
		// 	frame = this.data.mesh.animationFrames.length - 1;
		// }
		// m_currentFrame = frame;
		// vertexBufferRegenerate = true;
	}

	public _getTimers(): TimerHit[] {
		this._beginPlay();
		return [];
	}
}
