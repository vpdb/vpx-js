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

import { Table } from '../vpt/table/table';
import { IPlayable } from './iplayable';
import { PlayerPhysics } from './player-physics';

/**
 * Animatables are like movables but their position is only updated
 * once per frame, whereas movables get updated every tick (usually
 * at 1000fps).
 *
 * Classes that implement this interface usually take their code from
 * Visual Pinball's `RenderDynamic()` method.
 */
export interface IAnimatable extends IPlayable {

	getAnimation(): IAnimation;
}

export interface IAnimation {

	init(physics: PlayerPhysics): void;

	updateAnimation(physics: PlayerPhysics, table: Table): void;
}

export function isAnimatable(arg: any): arg is IAnimatable {
	return arg.getAnimation !== undefined;
}
