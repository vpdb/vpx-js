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
import { Ball } from '../lib/vpt/ball/ball';
import { Table } from '../lib';
import { Vertex3D } from '../lib/math/vertex3d';

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

/**
 * Creates a ball at the given position
 * @param player
 * @param x Position at x
 * @param y Position at y
 * @param z Position at z
 * @param vx Velocity for x
 * @param vy Velocity for y
 * @param vz Velocity for z
 * @returns Created ball
 */
export function createBall(player: Player, x: number, y: number, z: number, vx = 0, vy = 0, vz = 0): Ball {
	return player.createBall({
		getBallCreationPosition(t: Table): Vertex3D {
			return new Vertex3D(x, y, z);
		},
		getBallCreationVelocity(t: Table): Vertex3D {
			return new Vertex3D(vx, vy, vz);
		},
		onBallCreated(p: Player, b: Ball): void {
			// do nothing
		},
	});
}

/**
 * Let time pass while logging the ball position.
 * @param player
 * @param ball
 * @param numCycles How many cycles to run
 * @param cycleLength Duration of each cycle
 */
export function debugBall(player: Player, ball: Ball, numCycles = 300, cycleLength = 5) {

	for (let i = 0; i <= numCycles; i++) {
		player.updatePhysics(i * cycleLength);
		console.log('[%sms] (%s, %s, %s)', i * cycleLength, ball.getState().pos.x, ball.getState().pos.y, ball.getState().pos.z);
	}
}
