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

import { MoverObject } from '../../physics/mover-object';
import { SpinnerData } from './spinner-data';

export class SpinnerMover implements MoverObject {

	private readonly data: SpinnerData;

	public anglespeed: number = 0;
	public angle: number = 0;
	public angleMax: number = 0;
	public angleMin: number = 0;
	public elasticity: number = 0;
	public damping: number = 0;
	public isVisible: boolean = false;

	constructor(data: SpinnerData) {
		this.data = data;
	}

	public updateDisplacements(dtime: number): void {
		// todo
	}

	public updateVelocities(): void {
		// todo
	}
}