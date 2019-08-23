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

import { Object3D } from 'three';
import { Table } from '../..';
import { Player } from '../../game/player';
import { degToRad } from '../../math/float';
import { Matrix3D } from '../../math/matrix3d';
import { BumperData } from './bumper-data';
import { BumperMeshGenerator } from './bumper-mesh-generator';
import { BumperState } from './bumper-state';

export class BumperMeshUpdater {

	private readonly data: BumperData;
	private readonly state: BumperState;
	private readonly meshGenerator: BumperMeshGenerator;

	constructor(data: BumperData, state: BumperState, meshGenerator: BumperMeshGenerator) {
		this.data = data;
		this.state = state;
		this.meshGenerator = meshGenerator;
	}

	public applyState(obj: Object3D, table: Table, player: Player, oldState: BumperState): void {

		if (this.data.isRingVisible && this.state.ringOffset !== oldState.ringOffset) {
			this.applyRingState(obj, table);
		}
	}

	private applyRingState(obj: Object3D, table: Table) {
		const matrix = new Matrix3D().toRightHanded();
		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();

		const ringMesh = this.meshGenerator.generateRingMesh(table, height + this.state.ringOffset);
		const ringObj = obj.children.find(o => o.name === `bumper-ring-${this.data.getName()}`) as any;
		if (ringObj) {
			ringMesh.transform(matrix).applyToObject(ringObj);
		}
	}

	private applySkirtState(obj: Object3D, table: Table, player: Player) {

		const doCalculation = true;
		const SKIRT_TILT = 5.0;
		const scalexy = this.data.radius;
		let rotx = 0.0;
		let roty = 0.0;

		if (doCalculation) {
			const hitx = this.state.ballHitPosition.x;
			const hity = this.state.ballHitPosition.y;
			let dy = Math.abs(hity - this.data.vCenter.y);
			if (dy === 0.0) {
				dy = 0.000001;
			}
			const dx = Math.abs(hitx - this.data.vCenter.x);
			const skirtA = Math.tan(dx / dy);
			rotx = Math.cos(skirtA) * SKIRT_TILT;
			roty = Math.sin(skirtA) * SKIRT_TILT;
			if (this.data.vCenter.y < hity) {
				rotx = -rotx;
			}
			if (this.data.vCenter.x > hitx) {
				roty = -roty;
			}
		}

		const height = table.getSurfaceHeight(this.data.szSurface, this.data.vCenter.x, this.data.vCenter.y) * table.getScaleZ();

		// const matToOrigin = new Matrix3D().setTranslation(-this.data.center.x, -this.data.center.y, -height);
		// const matFromOrigin = new Matrix3D().setTranslation(this.data.center.x, this.data.center.y, height);

		const tempMatrix = new Matrix3D();
		const rMatrix = new Matrix3D();

		// tempMatrix.rotateZMatrix(degToRad(this.data.orientation));
		// rMatrix.multiply(tempMatrix);

		tempMatrix.rotateYMatrix(degToRad(roty));
		rMatrix.multiply(tempMatrix);
		tempMatrix.rotateXMatrix(degToRad(rotx));
		rMatrix.multiply(tempMatrix);

		obj.matrix = rMatrix.toThreeMatrix4();
		obj.matrixWorldNeedsUpdate = true;
	}
}
