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
import { IItem } from './iitem';
import { Player } from './player';

/**
 * A table element that can interact with the game. This corresponds roughly
 * to IEditable in VPinball.
 */
export interface IPlayable extends IItem {
	setupPlayer(player: Player, table: Table): void;
}

export function isPlayable(arg: any): arg is IPlayable {
	return arg.setupPlayer !== undefined;
}
