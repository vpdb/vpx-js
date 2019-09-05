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
import { Vertex3D } from '../math/vertex3d';
import { Ball } from '../vpt/ball/ball';
import { ItemState } from '../vpt/item-state';
import { Table } from '../vpt/table/table';
import { PlayerPhysics } from './player-physics';

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
	}

	public init(): this {
		this.physics.init();
		this.table.prepareToPlay();
		this.table.runTableScript();
		this.table.broadcastInit();
		return this;
	}

	private setupTableElements() {
		for (const playable of this.table.getPlayables()) {
			playable.setupPlayer(this, this.table);
		}
	}

	private setupStates() {

		// save mover states
		for (const movable of this.table.getMovables()) {
			const state = movable.getState() as ItemState;
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}

		// save animation states
		for (const animatable of this.table.getAnimatables()) {
			const state = animatable.getState() as ItemState;
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}
	}

	/**
	 * Returns the changed states and clears them.
	 */
	public popStates(): ChangedStates<ItemState> {
		const changedStates: ChangedStates = new ChangedStates<ItemState>();
		for (const name of Object.keys(this.currentStates)) {
			const newState = this.currentStates[name];
			const oldState = this.previousStates[name];
			if (!newState.equals(oldState)) {
				changedStates.setState(name,  oldState, newState);
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
		//this.previousStates[ball.getName()] = ball.getState().clone();
		this.emit('ballCreated', ball);
		return ball;
	}

	public destroyBall(ball: Ball): void {
		if (!ball) {
			return;
		}
		this.physics.destroyBall(ball);
		delete this.currentStates[ball.getName()];
		delete this.previousStates[ball.getName()];
		this.emit('ballDestroyed', ball);
	}

	public getPhysics(): PlayerPhysics {
		return this.physics;
	}

	/**
	 * @deprecated use updatePhysics()
	 */
	public updateVelocities() {
		this.physics.updateVelocities();
	}

	/**
	 * @deprecated use updatePhysics()
	 */
	public physicsSimulateCycle(tickDuration: number) {
		this.physics.physicsSimulateCycle(tickDuration);
	}
}

export interface IBallCreationPosition {

	getBallCreationPosition(table: Table): Vertex3D;

	getBallCreationVelocity(table: Table): Vertex3D;

	onBallCreated(physics: PlayerPhysics, ball: Ball): void;
}

export class ChangedStates<STATE extends ItemState = ItemState> {

	public readonly changedStates: { [key: string]: ChangedState<STATE> } = {};

	get keys() { return Object.keys(this.changedStates); }
	get states() { return Object.values(this.changedStates); }

	public setState(name: string, oldState: STATE, newState: STATE): void {
		this.changedStates[name] = new ChangedState<STATE>(oldState, newState);
	}

	public getState<S extends STATE>(name: string): ChangedState<S> {
		return this.changedStates[name] as ChangedState<S>;
	}

	public release(): void {
		for (const name of this.keys) {
			this.changedStates[name].release();
		}
	}
}

export class ChangedState<STATE extends ItemState> {
	public readonly oldState: STATE;
	public readonly newState: STATE;

	constructor(oldState: STATE, newState: STATE) {
		this.oldState = oldState;
		this.newState = newState;
	}

	public release(): void {
		if (this.oldState) {
			this.oldState.release();
		}
	}
}
