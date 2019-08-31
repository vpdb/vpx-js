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
import { Ball } from '../vpt/ball/ball';
import { ItemState } from '../vpt/item-state';
import { Table } from '../vpt/table/table';
import { ChangedStates, IBallCreationPosition, PlayerPhysics } from './player-physics';

export class Player extends EventEmitter {

	private readonly table: Table;
	private readonly physics: PlayerPhysics;

	get balls() { return this.physics.balls; }

	private previousStates: { [key: string]: ItemState } = {};
	private currentStates: { [key: string]: ItemState } = {};

	constructor(table: Table) {
		super();
		this.table = table;
		this.physics = new PlayerPhysics(table);
		this.setupTableElements();
		this.setupStates();
		this.physics.setup();
	}

	private setupTableElements() {
		for (const playable of this.table.getPlayables()) {
			playable.setupPlayer(this, this.table);
		}
	}

	private setupStates() {

		// save mover states
		for (const movable of this.table.getMovables()) {
			const state = movable.getState();
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}

		// save animation states
		for (const animatable of this.table.getAnimatables()) {
			const state = animatable.getState();
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}
	}

	/**
	 * Returns the changed states and clears them.
	 */
	public popStates(): ChangedStates<ItemState> {
		const changedStates: ChangedStates<ItemState> = {};
		for (const name of Object.keys(this.currentStates)) {
			const newState = this.currentStates[name];
			const oldState = this.previousStates[name];
			if (!newState.equals(oldState)) {
				changedStates[name] = { oldState, newState };
				this.previousStates[name] = newState.clone();
			}
		}
		return changedStates;
	}

	public updatePhysics(dTime?: number): number {
		return this.physics.updatePhysics(dTime);
	}

	public createBall(ballCreator: IBallCreationPosition, radius = 25, mass = 1): Ball {
		const ball = this.physics.createBall(ballCreator, radius, mass);
		this.currentStates[ball.getName()] = ball.getState();
		this.previousStates[ball.getName()] = ball.getState().clone();
		this.emit('ballCreated', ball.getName());
		return ball;
	}

	public destroyBall(ball: Ball): void {
		if (!ball) {
			return;
		}
		this.physics.destroyBall(ball);
		delete this.currentStates[ball.getName()];
		delete this.previousStates[ball.getName()];
		this.emit('ballDestroyed', ball.getName());
	}

	// public setGravity(slopeDeg: number, strength: number): void {
	// 	this.gravity.x = 0;
	// 	this.gravity.y = Math.sin(degToRad(slopeDeg)) * strength;
	// 	this.gravity.z = -Math.cos(degToRad(slopeDeg)) * strength;
	// }

	/**
	 * @deprecated
	 */
	public updateVelocities() {
		this.physics.updateVelocities();
	}

	/**
	 * @deprecated
	 */
	public physicsSimulateCycle(tickDuration: number) {
		this.physics.physicsSimulateCycle(tickDuration);
	}

	public getPhysics(): PlayerPhysics {
		return this.physics;
	}

}
