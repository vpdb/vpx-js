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

import { EventEmitter } from 'events';
import { EventProxy } from '../game/event-proxy';
import { PlayerPhysics } from '../game/player-physics';
import { Table } from './table/table';
import { Player } from '../game/player';

export abstract class ItemApi extends EventEmitter {

	protected readonly player: Player;
	protected readonly table: Table;

	protected constructor(player: Player, table: Table) {
		super();
		this.player = player;
		this.table = table;
	}

	protected assertNonHdrImage(imageName?: string) {
		const tex = this.table.getTexture(imageName);
		if (!tex) {
			throw new Error(`Texture "${imageName}" not found.`);
		}
		if (tex.isHdr()) {
			throw new Error(`Cannot use a HDR image (.exr/.hdr) here`);
		}
	}

	protected BallCntOver(events: EventProxy): number {
		let cnt = 0;
		for (const ball of this.player.balls) {
			if (ball.hit.isRealBall() && ball.hit.vpVolObjs.indexOf(events) >= 0) {
				++cnt;
				this.player.getPhysics().activeBall = ball; // set active ball for scriptor
			}
		}
		return cnt;
	}
}
