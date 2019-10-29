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

import { AssignKey } from '../game/key-code';
import { Player } from '../game/player';
import { now, storage } from '../refs.node';
import { textFiles } from '../scripting/textfiles';
import { VbsApi } from '../scripting/vbs-api';
import { BallApi } from './ball/ball-api';
import { Item } from './item';
import { ItemData } from './item-data';
import { Table } from './table/table';

export class GlobalApi extends VbsApi {

	private readonly table: Table;
	private readonly player: Player;

	constructor(table: Table, player: Player) {
		super();
		this.table = table;
		this.player = player;
	}

	get Name() { return 'Global'; }
	get LeftFlipperKey() { return this.player.getKey(AssignKey.LeftFlipperKey); }
	get RightFlipperKey() { return this.player.getKey(AssignKey.RightFlipperKey); }
	get LeftTiltKey() { return this.player.getKey(AssignKey.LeftTiltKey); }
	get RightTiltKey() { return this.player.getKey(AssignKey.RightTiltKey); }
	get CenterTiltKey() { return this.player.getKey(AssignKey.CenterTiltKey); }
	get PlungerKey() { return this.player.getKey(AssignKey.PlungerKey); }
	get StartGameKey() { return this.player.getKey(AssignKey.StartGameKey); }
	get AddCreditKey() { return this.player.getKey(AssignKey.AddCreditKey); }
	get AddCreditKey2() { return this.player.getKey(AssignKey.AddCreditKey2); }
	get MechanicalTilt() { return this.player.getKey(AssignKey.MechanicalTilt); }
	get LeftMagnaSave() { return this.player.getKey(AssignKey.LeftMagnaSave); }
	get RightMagnaSave() { return this.player.getKey(AssignKey.RightMagnaSave); }
	get ExitGame() { return this.player.getKey(AssignKey.ExitGame); }
	get LockbarKey() { return this.player.getKey(AssignKey.LockbarKey); }
	set MusicVolume(v: number) { /* TODO implement */ }
	get UserDirectory() { return '.'; } // TODO implement
	get GetPlayerHWnd() { return null; }
	get ActiveBall() { return this.player.getActiveBall(); }
	get GameTime() { return this.player.getGameTime(); }
	get SystemTime() { return now(); }
	get NightDay() { return this.table.getApi().NightDay; }
	get ShowDT() { return this.table.getApi().ShowDT; }
	get ShowFSS() { return this.table.getApi().ShowFSS; }
	get WindowWidth() { return this.player.width; }
	get WindowHeight() { return this.player.height; }
	set DMDWidth(v: number) { /* TODO implement */ }
	get DMDWidth() { return 0; } // TODO implement
	set DMDHeight(v: number) { /* TODO implement */ }
	get DMDHeight() { return 0; } // TODO implement
	get Version() { return this.table.getApi().Version; }
	get VPBuildVersion() { return this.table.getApi().VPBuildVersion; }
	get VersionMajor() { return this.table.getApi().VersionMajor; }
	get VersionMinor() { return this.table.getApi().VersionMinor; }
	get VersionRevision() { return this.table.getApi().VersionRevision; }

	public GetTextFile(fileName: string): string {
		if (textFiles[fileName.toLowerCase()]) {
			return textFiles[fileName.toLowerCase()];
		}
		throw new Error(`Cannot find text file ${fileName}`);
	}

	public PlaySound(sampleName: string, loopCount: number, volume: number, pan: number, randomPitch: number, pitch: number, useSame: boolean, restart: boolean, frontRearFade: number) {
		// TODO implement sound
	}

	public StopSound(sampleName: string) {
		// TODO implement sound
	}

	public PlayMusic(music: string, volume: number) {
		// TODO implement sound
	}

	public EndMusic(music: string) {
		// TODO implement sound
	}

	public FireKnocker(count: number) {
		// TODO implement
	}

	public QuitPlayer(closeType: number) {
		// TODO implement
	}

	public GetBalls(): BallApi[] {
		return this.player.getBalls().map(b => b.getApi());
	}

	public GetElements(): Array<Item<ItemData>> {
		return this.table.getItems();
	}

	public GetElementByName(name: string): Item<ItemData> | undefined {
		return this.table.items[name];
	}

	public MaterialColor(name: string, color: number): void {
		const material = this.table.getMaterial(name);
		if (material) {
			// TODO probably gotta apply this to the render realm as well
			material.baseColor = color;
		}
	}

	public Nudge(angle: number, force: number): void {
		// TODO implement nudge
	}

	public NudgeGetCalibration() {
		// TODO implement nudge (or not, probably)
	}

	public NudgeSetCalibration() {
		// not doing that for the browser
	}

	public NudgeSensorStatus() {
		// TODO implement nudge (or not, probably)
	}

	public NudgeTiltStatus() {
		// TODO implement nudge (or not, probably)
	}

	public GetCustomParam(): string {
		// these are command line args when launching vp, so none here!
		return '';
	}

	public AddObject(name: string, pdisp: any): void {
		// TODO implement
	}

	public SaveValue(tableName: string, valueName: string, value: any): void {
		const key = `${tableName}:${valueName}`;
		storage.setItem(key, value);
	}

	public LoadValue(tableName: string, valueName: string): void {
		const key = `${tableName}:${valueName}`;
		return storage.getItem(key);
	}

	public BeginModal(): void {
		// no idea what this is
	}

	public EndModal(): void {
		// still no idea
	}

	protected _getPropertyNames(): string[] {
		return Object.getOwnPropertyNames(GlobalApi.prototype);
	}
}
