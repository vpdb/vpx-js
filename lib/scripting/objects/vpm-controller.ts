
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

import { Player } from '../../game/player';
import { logger } from '../../util/logger';
import { getGameEntry, LoadedGameEntry } from './pinball-backend/rom-fetcher';
import { Emulator } from './pinball-backend/wpc-emu';

/**
 * Implementation of the VISUAL PINMAME COM OBJECT PROPERTY/METHOD
 *
 * converted VBS will call this functions using bracket notation, like `Controller.Dip[0]` or `Controller.GameName`
 */

export class VpmController {

	private readonly player: Player;
	private emulator: Emulator;
	private gameName: string;
	private splashInfoLine: string;
	private paused: boolean;
	public Dip: { [index: number]: number };

	//private gameRomInfoPromise: Promise<Response>;

	constructor(player: Player) {
		logger().debug('HELLO FROM VPM CONTROLLER');
		this.player = player;
		this.gameName = '';
		this.splashInfoLine = '';
		this.paused = false;
		this.emulator = new Emulator();
		this.Dip = createIndexGetter();

//		this.gameRomInfoPromise = Promise.reject();
	}

	// Control
	get GameName(): string {
		return this.gameName;
	}
	set GameName(gameName: string) {
		this.gameName = gameName;
		logger().debug('GAMENAME:', gameName);
		getGameEntry(gameName)
			.then((answer: LoadedGameEntry) => {
				logger().info('LOADED', answer.wpcDbEntry);
				return this.emulator.loadGame(answer.wpcDbEntry, answer.romFile);
			})
			.then(() => {
				setInterval(() => {
					this.emulator.executeCycleForTime(200);
				}, 200);
			})
			.catch((error) => {
				logger().error('ERROR FAILED', error.messages);
			})
	}
	get Running(): boolean {
		return this.emulator && !this.paused;
	}
	get Pause(): boolean {
		return this.paused;
	}
	set Pause(paused: boolean) {
		this.paused = paused;
	}
	get Version(): string {
		return this.emulator.getVersion();
	}
	//TODO return value
	public Run(parentWindow: any, minVersion: number) {
		logger().debug('RUN', parentWindow, minVersion);
		if (this.gameName) {
			// TODO: fetch rom from vpdb.io here
			//return this.emulator.loadGame(this.gameName);
		}
	}
	public Stop(): void {
		logger().debug('STOP');
		//TODO unclear what to do
	}

	// GameSetting
	// NOTE: Dip - implemented using Proxy
	get HandleMechanics(): number {
		return 0;
	}
	set HandleMechanics(mechanicNr: number) {
		logger().debug('HandleMechanics');
	}
	get WPCNumbering(): number {
		return 0;
	}
	get SampleRate(): number {
		return 22050;
	}

	//Customization
	get SplashInfoLine(): string {
		return this.splashInfoLine;
	}
	set SplashInfoLine(gameCredits) {
		this.splashInfoLine = gameCredits;
	}
	get ShowFrame(): boolean {
		return false;
	}
	set ShowFrame(showFrame: boolean) {
		logger().debug('ShowFrame', showFrame);
	}
	get DoubleSize(): boolean {
		return false;
	}
	set DoubleSize(doubleSize: boolean) {
		logger().debug('DoubleSize', doubleSize);
	}
	get Antialias(): boolean {
		return false;
	}
	set Antialias(enabled: boolean) {
		logger().debug('Antialias', enabled);
	}
	get BorderSizeX(): number {
		return 0;
	}
	set BorderSizeX(size: number) {
		logger().debug('BorderSizeX', size);
	}
	get BorderSizeY(): number {
		return 0;
	}
	set BorderSizeY(size: number) {
		logger().debug('BorderSizeY', size);
	}
	get WindowPosX(): number {
		return 0;
	}
	set WindowPosX(position: number) {
		logger().debug('WindowPosX', position);
	}
	get WindowPosY(): number {
		return 0;
	}
	set WindowPosY(position: number) {
		logger().debug('WindowPosY', position);
	}
	get LockDisplay(): boolean {
		return false;
	}
	set LockDisplay(locked: boolean) {
		logger().debug('LockDisplay', locked);
	}
	get Hidden(): boolean {
		return false;
	}
	set Hidden(hidden: boolean) {
		logger().debug('Hidden', hidden);
	}
	public SetDisplayPosition(x: number, y: number, hWnd: any): void {
		logger().debug('SetDisplayPosition', { x, y, hWnd });
	}
	public ShowOptsDialog(hWnd: any): void {
		logger().debug('ShowOptsDialog', hWnd);
	}
	public ShowPathesDialog(hWnd: any): void {
		logger().debug('ShowPathesDialog', hWnd);
	}
	public ShowAboutDialog(hWnd: any): void {
		logger().debug('ShowAboutDialog', hWnd);
	}
	public CheckROMS(nShowOptions: number, hWnd: any): void {
		logger().debug('CheckROMS', nShowOptions, hWnd);
	}

	// AggregatePollingFunctions
	get ChangedLamps() {
		return [ 0 ];
	}
	get ChangedSolenoids() {
		return [ 0 ];
	}
	get ChangedGI() {
		return [ 0 ];
	}
	get ChangedLEDs() {
		return [ 0 ];
	}

	// GameInputOutput TODO need a proxy handle
	get Lamp() {
		return 0;
	}
	get Solenoid() {
		return 0;
	}
	get GIString() {
		return 0;
	}
	get Switch() {
		return 0;
	}

	// Debugging
	get ShowDMDOnly(): boolean {
		return false;
	}
	set ShowDMDOnly(show: boolean) {
		logger().debug('ShowDMDOnly', show);
	}
	get HandleKeyboard(): boolean {
		return false;
	}
	set HandleKeyboard(handle: boolean) {
		logger().debug('HandleKeyboard', handle);
	}
	get ShowTitle(): boolean {
		return false;
	}
	set ShowTitle(show: boolean) {
		logger().debug('ShowTitle', show);
	}
}

function createIndexGetter(): { [index: number]: number } {
	const handler = {
		get: (target: {[ index: number ]: number}, prop: number): number => {
			logger().debug('GET', {target, prop});
			return prop in target ? target[prop] : 0;
		},

		set: (target: {[ index: number ]: number}, prop: number, value: number): boolean => {
			target[prop] = value;
			logger().debug('SET', {target, prop, value});
			return true;
		},
	};
	return new Proxy<{ [index: number ]: number; }>({}, handler);
}
