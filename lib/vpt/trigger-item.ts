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

import { triggerButtonMesh } from '../../res/meshes/trigger-button-mesh';
import { triggerSimpleMesh } from '../../res/meshes/trigger-simple-mesh';
import { triggerStarMesh } from '../../res/meshes/trigger-star-mesh';
import { triggerDWireMesh } from '../../res/meshes/trigger-wire-d-mesh';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { DragPoint } from '../math/dragpoint';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { logger } from '../util/logger';
import { IRenderable, ItemData, Meshes } from './item-data';
import { Mesh } from './mesh';
import { Table } from './table';

/**
 * VPinball's triggers.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/trigger.cpp
 */
export class TriggerItem extends ItemData implements IRenderable {

	public static ShapeTriggerNone = 0;
	public static ShapeTriggerWireA = 1;
	public static ShapeTriggerStar = 2;
	public static ShapeTriggerWireB = 3;
	public static ShapeTriggerButton = 4;
	public static ShapeTriggerWireC = 5;
	public static ShapeTriggerWireD = 6;

	public dragPoints: DragPoint[] = [];
	private vCenter!: Vertex2D;
	private radius: number = 25;
	private rotation: number = 0;
	private wireThickness: number = 0;
	private scaleX: number = 1;
	private scaleY: number = 1;
	private szMaterial?: string;
	private fTimerEnabled: boolean = false;
	private TimerInterval?: number;
	private szSurface?: string;
	private fEnabled: boolean = true;
	private hitHeight: number = 50;
	private fVisible: boolean = true;
	private fReflectionEnabled: boolean = true;
	private shape: number = TriggerItem.ShapeTriggerWireA;
	private animSpeed: number = 1;
	private wzName!: string;

	public static async fromStorage(storage: Storage, itemName: string): Promise<TriggerItem> {
		const triggerItem = new TriggerItem(itemName);
		await storage.streamFiltered(itemName, 4, TriggerItem.createStreamHandler(triggerItem));
		return triggerItem;
	}

	private static createStreamHandler(triggerItem: TriggerItem) {
		triggerItem.dragPoints = [];
		return BiffParser.stream(triggerItem.fromTag.bind(triggerItem), {
			nestedTags: {
				DPNT: {
					onStart: () => new DragPoint(),
					onTag: dragPoint => dragPoint.fromTag.bind(dragPoint),
					onEnd: dragPoint => triggerItem.dragPoints.push(dragPoint),
				},
			},
		});
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible && this.shape !== TriggerItem.ShapeTriggerNone;
	}

	public getMeshes(table: Table): Meshes {
		return {
			trigger: {
				mesh: this.createMesh(table).transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szMaterial),
			},
		};
	}

	private createMesh(table: Table): Mesh {
		const baseHeight = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();

		let zOffset = (this.shape === TriggerItem.ShapeTriggerButton) ? 5.0 : 0.0;
		if (this.shape === TriggerItem.ShapeTriggerWireC) {
			zOffset = -19.0;
		}

		const fullMatrix = new Matrix3D();
		if (this.shape === TriggerItem.ShapeTriggerWireB) {
			const tempMatrix = new Matrix3D();
			fullMatrix.rotateXMatrix(degToRad(-23.0));
			tempMatrix.rotateZMatrix(degToRad(this.rotation));
			fullMatrix.multiply(tempMatrix);

		} else if (this.shape === TriggerItem.ShapeTriggerWireC) {
			const tempMatrix = new Matrix3D();
			fullMatrix.rotateXMatrix(degToRad(140.0));
			tempMatrix.rotateZMatrix(degToRad(this.rotation));
			fullMatrix.multiply(tempMatrix);

		} else {
			fullMatrix.rotateZMatrix(degToRad(this.rotation));
		}

		const mesh = this.getBaseMesh();
		for (const vertex of mesh.vertices) {

			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = fullMatrix.multiplyVector(vert);

			if (this.shape === TriggerItem.ShapeTriggerButton || this.shape === TriggerItem.ShapeTriggerStar) {
				vertex.x = f4(vert.x * this.radius) + this.vCenter.x;
				vertex.y = f4(vert.y * this.radius) + this.vCenter.y;
				vertex.z = f4(f4(f4(vert.z * this.radius) * table.getScaleZ()) + baseHeight) + zOffset;
			} else {
				vertex.x = f4(vert.x * this.scaleX) + this.vCenter.x;
				vertex.y = f4(vert.y * this.scaleY) + this.vCenter.y;
				vertex.z = f4(f4(vert.z * table.getScaleZ()) + baseHeight) + zOffset;
			}

			vert = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			vert = fullMatrix.multiplyVectorNoTranslate(vert);
			vertex.nx = vert.x;
			vertex.ny = vert.y;
			vertex.nz = vert.z;
		}
		return mesh;
	}

	private getBaseMesh(): Mesh {
		const name = `trigger-${this.getName()}`;
		switch (this.shape) {
			case TriggerItem.ShapeTriggerWireA:
			case TriggerItem.ShapeTriggerWireB:
			case TriggerItem.ShapeTriggerWireC:
				return triggerSimpleMesh.clone(name);
			case TriggerItem.ShapeTriggerWireD:
				return triggerDWireMesh.clone(name);
			case TriggerItem.ShapeTriggerButton:
				return triggerButtonMesh.clone(name);
			case TriggerItem.ShapeTriggerStar:
				return triggerStarMesh.clone(name);
			/* istanbul ignore next */
			default:
				logger().warn('[TriggerItem.getBaseMesh] Unknown shape "%s".', this.shape);
				return triggerSimpleMesh.clone(name);
		}
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'RADI': this.radius = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'WITI': this.wireThickness = this.getFloat(buffer); break;
			case 'SCAX': this.scaleX = this.getFloat(buffer); break;
			case 'SCAY': this.scaleY = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'EBLD': this.fEnabled = this.getBool(buffer); break;
			case 'THOT': this.hitHeight = this.getFloat(buffer); break;
			case 'VSBL': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'SHAP': this.shape = this.getInt(buffer); break;
			case 'ANSP': this.animSpeed = this.getFloat(buffer); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
