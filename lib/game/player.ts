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
import { Pool } from '../util/object-pool';
import { Ball } from '../vpt/ball/ball';
import { ItemState } from '../vpt/item-state';
import { Table } from '../vpt/table/table';
import {
	AssignKey,
	DIK_1,
	DIK_4,
	DIK_5,
	DIK_D,
	DIK_EQUALS,
	DIK_ESCAPE,
	DIK_F10,
	DIK_F11,
	DIK_LALT,
	DIK_LCONTROL,
	DIK_LSHIFT,
	DIK_MINUS,
	DIK_O,
	DIK_Q,
	DIK_RCONTROL,
	DIK_RETURN,
	DIK_RSHIFT,
	DIK_SLASH,
	DIK_SPACE,
	DIK_T,
	DIK_Z,
} from './key-code';
import { PlayerPhysics } from './player-physics';

export class Player extends EventEmitter {

	private readonly table: Table;
	private readonly physics: PlayerPhysics;
	private readonly rgKeys: { [key: number]: number } = {
		[AssignKey.LeftFlipperKey]: DIK_LCONTROL,
		[AssignKey.RightFlipperKey]: DIK_RCONTROL,
		[AssignKey.LeftTiltKey]: DIK_Z,
		[AssignKey.RightTiltKey]: DIK_SLASH,
		[AssignKey.CenterTiltKey]: DIK_SPACE,
		[AssignKey.PlungerKey]: DIK_RETURN,
		[AssignKey.FrameCount]: DIK_F11,
		[AssignKey.DBGBalls]: DIK_O,
		[AssignKey.Debugger]: DIK_D,
		[AssignKey.AddCreditKey]: DIK_5,
		[AssignKey.AddCreditKey2]: DIK_4,
		[AssignKey.StartGameKey]: DIK_1,
		[AssignKey.MechanicalTilt]: DIK_T,
		[AssignKey.RightMagnaSave]: DIK_RSHIFT,
		[AssignKey.LeftMagnaSave]: DIK_LSHIFT,
		[AssignKey.ExitGame]: DIK_Q,
		[AssignKey.VolumeUp]: DIK_EQUALS,
		[AssignKey.VolumeDown]: DIK_MINUS,
		[AssignKey.LockbarKey]: DIK_LALT,
		[AssignKey.Enable3D]: DIK_F10,
		[AssignKey.Escape]: DIK_ESCAPE,
	};

	get balls() { return this.physics.balls; }

	private previousStates: { [key: string]: ItemState } = {};
	private currentStates: { [key: string]: ItemState } = {};

	public width: number = 0;
	public height: number = 0;

	constructor(table: Table) {
		super();
		this.table = table;
		this.physics = new PlayerPhysics(table);
		this.setupTableElements();
		this.setupStates();
	}

	public init(): this {
		this.table.setupCollections();
		this.physics.init();
		this.table.prepareToPlay();
		this.table.runTableScript(this);
		this.table.broadcastInit();
		return this;
	}

	private setupTableElements() {
		for (const playable of this.table.getPlayables()) {
			playable.setupPlayer(this, this.table);
		}
	}

	private setupStates() {
		// save states
		for (const renderable of this.table.getRenderables()) {
			const state = renderable.getState() as ItemState;
			this.currentStates[state.getName()] = state;
			this.previousStates[state.getName()] = state.clone();
		}
	}

	/**
	 * Returns the changed states and clears them.
	 *
	 * Note that the returned object is recycled and should be released after
	 * usage.
	 */
	public popStates(): ChangedStates<ItemState> {
		const changedStates = ChangedStates.claim();
		for (const name of Object.keys(this.currentStates)) {
			const newState = this.currentStates[name];
			const oldState = this.previousStates[name];
			if (!newState.equals(oldState)) {
				changedStates.setState(name, newState.diff(oldState));
				this.previousStates[name].release();
				this.previousStates[name] = newState.clone();
			}
		}
		return changedStates;
	}

	public updatePhysics(dTime?: number): number {
		return this.physics.updatePhysics(dTime);
	}

	public createBall(ballCreator: IBallCreationPosition, radius = 25, mass = 1): Ball {
		const ball = this.physics.createBall(ballCreator, this, radius, mass);
		this.currentStates[ball.getName()] = ball.getState();
		this.previousStates[ball.getName()] = ball.getState().clone();
		this.emit('ballCreated', ball);
		return ball;
	}

	public destroyBall(ball: Ball): void {
		if (!ball) {
			return;
		}
		this.physics.destroyBall(ball);
		this.currentStates[ball.getName()].release();
		this.previousStates[ball.getName()].release();
		delete this.currentStates[ball.getName()];
		delete this.previousStates[ball.getName()];
		this.emit('ballDestroyed', ball);
	}

	public getActiveBall(): Ball | undefined {
		return this.physics.activeBall;
	}

	public getGameTime(): number {
		return this.physics.timeMsec;
	}

	public getBalls(): Ball[] {
		return this.physics.balls;
	}

	public getKey(key: AssignKey): number {
		return this.rgKeys[key];
	}

	public getPhysics(): PlayerPhysics {
		return this.physics;
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.physics.setGravity(slopeDeg, strength);
	}

	/**
	 * Sets the dimensions of the render frame.
	 *
	 * The host app should call this whenever resizing happens. If you're
	 * wondering why we would care about render dimensions in the lib, well,
	 * the script API exposes it!
	 *
	 * @param width Width of the render frame in pixels
	 * @param height Height of the render frame in pixels
	 */
	public setDimensions(width: number, height: number): void {
		this.width = width;
		this.height = height;
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

	public static readonly POOL = new Pool(ChangedStates);

	public changedStates: { [key: string]: STATE } = {};

	get keys() { return Object.keys(this.changedStates); }
	get states() { return Object.values(this.changedStates); }

	public static claim(): ChangedStates {
		return ChangedStates.POOL.get();
	}

	public setState(name: string, state: STATE): void {
		this.changedStates[name] = state;
	}

	public getState<S extends STATE>(name: string): S {
		return this.changedStates[name] as S;
	}

	public release(): void {
		for (const name of this.keys) {
			this.changedStates[name].release();
			delete this.changedStates[name];
		}
		ChangedStates.POOL.release(this);
	}
}
