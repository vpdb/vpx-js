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

import { hitTargetT3Mesh } from '../../res/meshes/drop-target-t3-mesh';
import { gateBracketMesh } from '../../res/meshes/gate-bracket-mesh';
import { gateLongPlateMesh } from '../../res/meshes/gate-long-plate-mesh';
import { gatePlateMesh } from '../../res/meshes/gate-plate-mesh';
import { gateWireMesh } from '../../res/meshes/gate-wire-mesh';
import { gateWireRectangleMesh } from '../../res/meshes/gate-wire-rectangle-mesh';
import { IRenderable } from '../game/irenderable';
import { BiffParser } from '../io/biff-parser';
import { Storage } from '../io/ole-doc';
import { degToRad, f4 } from '../math/float';
import { Matrix3D } from '../math/matrix3d';
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { logger } from '../util/logger';
import { ItemData, Meshes } from './item-data';
import { Mesh } from './mesh';
import { Table } from './table';

/**
 * VPinball's gates.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/gate.cpp
 */
export class GateItem extends ItemData implements IRenderable {

	public static TypeGateWireW = 1;
	public static TypeGateWireRectangle = 2;
	public static TypeGatePlate = 3;
	public static TypeGateLongPlate = 4;

	private gateType: number = GateItem.TypeGateWireW;
	private vCenter!: Vertex2D;
	private length: number = 100;
	private height: number = 50;
	private rotation: number = -90;
	private szMaterial?: string;
	private fTimerEnabled?: boolean;
	private fShowBracket: boolean = true;
	private fCollidable: boolean = true;
	private twoWay: boolean = false;
	private fVisible: boolean = true;
	private fReflectionEnabled: boolean = true;
	private TimerInterval?: number;
	private szSurface?: string;
	private wzName!: string;
	private elasticity?: number;
	private angleMax: number = Math.PI / 2.0;
	private angleMin: number = 0;
	private friction?: number;
	private damping?: number;
	private gravityfactor?: number;

	public static async fromStorage(storage: Storage, itemName: string): Promise<GateItem> {
		const gateItem = new GateItem(itemName);
		await storage.streamFiltered(itemName, 4, BiffParser.stream(gateItem.fromTag.bind(gateItem), {}));
		return gateItem;
	}

	private constructor(itemName: string) {
		super(itemName);
	}

	public getName(): string {
		return this.wzName;
	}

	public isVisible(): boolean {
		return this.fVisible;
	}

	public getMeshes(table: Table): Meshes {
		const meshes: Meshes = {};
		const baseHeight = table.getSurfaceHeight(this.szSurface, this.vCenter.x, this.vCenter.y) * table.getScaleZ();

		// wire mesh
		const wireMesh = this.positionMesh(this.getBaseMesh(), table, baseHeight);
		wireMesh.name = `gate.wire-${this.getName()}`;
		meshes.wire = {
			mesh: wireMesh.transform(new Matrix3D().toRightHanded()),
			material: table.getMaterial(this.szMaterial),
		};

		// bracket mesh
		if (this.fShowBracket) {
			const bracketMesh = this.positionMesh(gateBracketMesh.clone(), table, baseHeight);
			bracketMesh.name = `gate.bracket-${this.getName()}`;
			meshes.bracket = {
				mesh: bracketMesh.transform(new Matrix3D().toRightHanded()),
				material: table.getMaterial(this.szMaterial),
			};
		}
		return meshes;
	}

	private getBaseMesh(): Mesh {
		switch (this.gateType) {
			case GateItem.TypeGateWireW: return gateWireMesh.clone();
			case GateItem.TypeGateWireRectangle: return gateWireRectangleMesh.clone();
			case GateItem.TypeGatePlate: return gatePlateMesh.clone();
			case GateItem.TypeGateLongPlate: return gateLongPlateMesh.clone();
			/* istanbul ignore next */
			default:
				logger().warn('[GateItem.getBaseMesh] Unknown gate type "%s".', this.gateType);
				return hitTargetT3Mesh.clone();
		}
	}

	private positionMesh(mesh: Mesh, table: Table, baseHeight: number): Mesh {
		const fullMatrix = new Matrix3D();
		fullMatrix.rotateZMatrix(degToRad(this.rotation));
		for (const vertex of mesh.vertices) {

			let vert = new Vertex3D(vertex.x, vertex.y, vertex.z);
			vert = fullMatrix.multiplyVector(vert);
			vertex.x = f4(vert.x * this.length) + this.vCenter.x;
			vertex.y = f4(vert.y * this.length) + this.vCenter.y;
			vertex.z = f4(f4(f4(vert.z * this.length) * table.getScaleZ()) + f4(this.height * table.getScaleZ())) + baseHeight;

			vert = new Vertex3D(vertex.nx, vertex.ny, vertex.nz);
			vert = fullMatrix.multiplyVectorNoTranslate(vert);
			vertex.nx = vert.x;
			vertex.ny = vert.y;
			vertex.nz = vert.z;
		}
		return mesh;
	}

	private async fromTag(buffer: Buffer, tag: string, offset: number, len: number): Promise<number> {
		switch (tag) {
			case 'GATY':
				this.gateType = this.getInt(buffer);
				/* istanbul ignore if: Legacy format */
				if (this.gateType < GateItem.TypeGateWireW || this.gateType > GateItem.TypeGateLongPlate) {// for tables that were saved in the phase where m_type could've been undefined
					this.gateType = GateItem.TypeGateWireW;
				}
				break;
			case 'VCEN': this.vCenter = Vertex2D.get(buffer); break;
			case 'LGTH': this.length = this.getFloat(buffer); break;
			case 'HGTH': this.height = this.getFloat(buffer); break;
			case 'ROTA': this.rotation = this.getFloat(buffer); break;
			case 'MATR': this.szMaterial = this.getString(buffer, len); break;
			case 'GSUP': this.fShowBracket = this.getBool(buffer); break;
			case 'GCOL': this.fCollidable = this.getBool(buffer); break;
			case 'TWWA': this.twoWay = this.getBool(buffer); break;
			case 'GVSB': this.fVisible = this.getBool(buffer); break;
			case 'REEN': this.fReflectionEnabled = this.getBool(buffer); break;
			case 'SURF': this.szSurface = this.getString(buffer, len); break;
			case 'NAME': this.wzName = this.getWideString(buffer, len); break;
			case 'ELAS': this.elasticity = this.getFloat(buffer); break;
			case 'GAMA': this.angleMax = this.getFloat(buffer); break;
			case 'GAMI': this.angleMin = this.getFloat(buffer); break;
			case 'GFRC': this.friction = this.getFloat(buffer); break;
			case 'AFRC': this.damping = this.getFloat(buffer); break;
			case 'GGFC': this.gravityfactor = this.getFloat(buffer); break;
			default:
				this.getUnknownBlock(buffer, tag);
				break;
		}
		return 0;
	}
}
