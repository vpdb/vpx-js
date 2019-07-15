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

import { Player } from '../lib/game/player';

/**
 * Simulates a given number of milliseconds.
 *
 * @param player Player object
 * @param duration Duration in milliseconds
 * @param tickDuration How many ticks to simulate (default 1ms per tick)
 */
export function simulateCycles(player: Player, duration: number, tickDuration = 1) {
	const numTicks = Math.floor(duration / tickDuration);
	for (let i = 0; i < numTicks; i++) {
		player.updateVelocities();
		player.physicsSimulateCycle(tickDuration);
	}
}
