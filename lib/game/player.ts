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
import { Vertex2D } from '../math/vertex2d';
import { Vertex3D } from '../math/vertex3d';
import { Pool } from '../util/object-pool';
import { Ball } from '../vpt/ball/ball';
import { ItemState } from '../vpt/item-state';
import { Table } from '../vpt/table/table';
import { IEmulator } from './iemulator';
import { AssignKey, keyEventToDirectInputKey } from './key-code';
import { PinInput } from './pin-input';
import { PlayerPhysics } from './player-physics';

export class Player extends EventEmitter {

	private readonly table: Table;
	private readonly pinInput: PinInput;
	private readonly physics: PlayerPhysics;

	get balls() { return this.physics.balls; }

	private previousStates: { [key: string]: ItemState } = {};
	private currentStates: { [key: string]: ItemState } = {};

	private simulatedTimeMs = 0;

	public width: number = 0;
	public height: number = 0;

	constructor(table: Table) {
		super();
		this.table = table;
		this.pinInput = new PinInput(table, this);
		this.physics = new PlayerPhysics(table, this.pinInput);
		this.setupTableElements();
		this.setupStates();
	}

	public init(scope = {}): this {
		this.table.setupCollections();
		this.physics.init();
		this.table.prepareToPlay();
		this.table.runTableScript(this, scope);
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
	 * This is only used for tests, and simulates time by running the physics
	 * loop as well as the animations every frame.
	 * @param dTime Time to simulate in ms
	 */
	public simulateTime(dTime: number) {
		const FPS = 60;
		const timePerFrameMs = 1000 / FPS;
		while (this.simulatedTimeMs <= dTime) {
			this.updatePhysics(this.simulatedTimeMs);
			this.updateAnimations(this.simulatedTimeMs);
			this.simulatedTimeMs += timePerFrameMs;
		}
	}

	/**
	 * Runs the physics calculation since last time called.
	 *
	 * This is the method the host app should run in its physics loop.
	 *
	 * @param dTime Optionally override current time
	 */
	public updatePhysics(dTime?: number): number {
		return this.physics.updatePhysics(dTime);
	}

	/**
	 * Updates animations and returns the changed state since last frame.
	 *
	 * This is the method the host app should be calling on each frame before
	 * updating the scene.
	 */
	public onFrame(): ChangedStates<ItemState> {

		// first, animate. we do this here to make sure no frames are skipped.
		this.updateAnimations(this.physics.timeMsec);

		// now, get the states
		return this.popStates();
	}

	/**
	 * Runs one animation cycle for the given time. If more than one cycle has
	 * to be run over a longer period, this method needs to be called multiple
	 * times.
	 *
	 * @param timeMs Absolute current time
	 */
	public updateAnimations(timeMs: number) {
		for (const animatable of this.table.getAnimatables()) {
			animatable.getAnimation().updateAnimation(timeMs, this.table);
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

	public onKeyUp(event: { code: string, key: string, ts: number }) {
		const dkCode = keyEventToDirectInputKey(event);
		this.pinInput.onKeyUp(dkCode, event.ts);
	}

	public onKeyDown(event: { code: string, key: string, ts: number }) {
		const dkCode = keyEventToDirectInputKey(event);
		this.pinInput.onKeyDown(dkCode, event.ts);
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
		return this.pinInput.rgKeys[key];
	}

	public getPhysics(): PlayerPhysics {
		return this.physics;
	}

	public setGravity(slopeDeg: number, strength: number): void {
		this.physics.setGravity(slopeDeg, strength);
	}

	public setEmulator(emu: IEmulator) {
		this.physics.emu = emu;
		this.emit('emuStarted');
	}

	public hasDmd(): boolean {
		return !!this.physics.emu && !!this.physics.emu.getDmdDimensions();
	}

	public getDmdDimensions(): Vertex2D {
		return this.physics.emu!.getDmdDimensions();
	}

	public getDmdFrame(): Uint8Array {
		return this.physics.emu!.getDmdFrame();
	}

	public setCabinetInput(keyNr: number) {
		if (this.physics.emu) {
			this.physics.emu.setCabinetInput(keyNr);
		}
	}

	public setSwitchInput(switchNr: number, optionalEnableSwitch?: boolean) {
		if (this.physics.emu) {
			this.physics.emu.setSwitchInput(switchNr, optionalEnableSwitch);
		}
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

	public pause(): void {
		this.physics.isPaused = true;
	}

	public resume(): void {
		this.physics.isPaused = false;
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
