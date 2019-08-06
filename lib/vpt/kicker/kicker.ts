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

import { Storage } from '../..';
import { Table } from '../..';
import { IHittable } from '../../game/ihittable';
import { IRenderable } from '../../game/irenderable';
import { IBallCreationPosition, Player } from '../../game/player';
import { Matrix3D } from '../../math/matrix3d';
import { Vertex3D } from '../../math/vertex3d';
import { HitObject } from '../../physics/hit-object';
import { Meshes } from '../item-data';
import { Texture } from '../texture';
import { KickerData } from './kicker-data';
import { KickerHit } from './kicker-hit';
import { KickerMeshGenerator } from './kicker-mesh-generator';
import { Ball } from '../ball/ball';
import { FLT_MAX } from '../mesh';

/**
 * VPinball's kickers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/kicker.cpp
 */
export class Kicker implements IRenderable, IHittable, IBallCreationPosition {

	public static TypeKickerInvisible = 0;
	public static TypeKickerHole = 1;
	public static TypeKickerCup = 2;
	public static TypeKickerHoleSimple = 3;
	public static TypeKickerWilliams = 4;
	public static TypeKickerGottlieb = 5;
	public static TypeKickerCup2 = 6;

	private readonly data: KickerData;
	private readonly meshGenerator: KickerMeshGenerator;
	private hit?: KickerHit;

	public static async fromStorage(storage: Storage, itemName: string): Promise<Kicker> {
		const data = await KickerData.fromStorage(storage, itemName);
		return new Kicker(data);
	}

	private constructor(data: KickerData) {
		this.data = data;
		this.meshGenerator = new KickerMeshGenerator(data);
	}

	public getName() {
		return this.data.getName();
	}

	public isVisible(): boolean {
		return this.data.kickerType !== Kicker.TypeKickerInvisible;
	}

	public getMeshes(table: Table): Meshes {
		return {
			kicker: {
				mesh: this.meshGenerator.getMesh(table).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.data.szMaterial),
				map: this.getTexture(),
			},
		};
	}

	public getHitShapes(): HitObject[] {
		return [ this.hit! ];
	}

	public setupPlayer(player: Player, table: Table): void {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();
		const radius = this.data.radius * (this.data.legacyMode ? (this.data.fallThrough ? 0.75 : 0.6) : 1); // reduce the hit circle radius because only the inner circle of the kicker should start a hit event
		this.hit = new KickerHit(this.data, table, this.data.vCenter, radius, height, height + this.data.hitHeight); // height of kicker hit cylinder
	}

	public getBallCreationPosition(table: Table): Vertex3D {
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y);
		return new Vertex3D(this.hit!.center.x, this.hit!.center.y, height + 100);
	}

	public getBallCreationVelocity(table: Table): Vertex3D {
		return new Vertex3D(0.1, 0, 0);
	}

	public onBallCreated(player: Player, ball: Ball): void {
		ball.getCollision().hitFlag = true;                        // HACK: avoid capture leaving kicker
		const hitNormal = new Vertex3D(FLT_MAX, FLT_MAX, FLT_MAX); // unused due to newBall being true
		this.hit!.doCollide(player, ball, hitNormal, false, true);
	}

	private getTexture(): Texture {
		switch (this.data.kickerType) {
			case Kicker.TypeKickerCup: return Texture.fromFilesystem('kickerCup.bmp');
			case Kicker.TypeKickerWilliams: return Texture.fromFilesystem('kickerWilliams.bmp');
			case Kicker.TypeKickerGottlieb: return Texture.fromFilesystem('kickerGottlieb.bmp');
			case Kicker.TypeKickerCup2: return Texture.fromFilesystem('kickerT1.bmp');
			case Kicker.TypeKickerHole: return Texture.fromFilesystem('kickerHoleWood.bmp');
			case Kicker.TypeKickerHoleSimple:
			default:
				return Texture.fromFilesystem('kickerHoleWood.bmp');
		}
	}
}
