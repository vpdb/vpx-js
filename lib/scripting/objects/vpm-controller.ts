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

import { downloadGameEntry } from '../../emu/rom-fetcher';
import { Emulator } from '../../emu/wpc-emu';
import { Player } from '../../game/player';
import { logger } from '../../util/logger';

/**
 * Implementation of the VISUAL PINMAME COM OBJECT PROPERTY/METHOD
 *
 * converted VBS will call this functions using bracket notation, like `Controller.Dip[0]` or `Controller.GameName`
 */
export class VpmController {

	private emulator: Emulator;
	private gameName: string = '';
	private splashInfoLine: string = '';
	private readonly player: Player;
	public readonly Dip: { [index: number]: number };
	public readonly Switch: { [index: number]: number };
	public readonly Lamp: { [index: number]: number };
	public readonly Solenoid: { [index: number]: number };
	public readonly GIString: { [index: number]: number };

	constructor(player: Player) {
		this.player = player;
		this.emulator = new Emulator();

		this.Switch = this.createGetSetBooleanProxy('SWITCH',
			(index) => this.emulator.getSwitchInput(index),
			(switchNr: number, value?: boolean) => {
				if (switchNr < 89) {
					return this.emulator.setSwitchInput(switchNr, value);
				}
				switch (switchNr) {
					case 112:
						this.emulator.setFliptronicsInput('F2', value);
						return true;
					case 114:
						this.emulator.setFliptronicsInput('F4', value);
						return true;
					case 116:
						this.emulator.setFliptronicsInput('F6', value);
						return true;
					case 118:
						this.emulator.setFliptronicsInput('F8', value);
						return true;
				}
				logger().error('INVALID_SWITCH_ID:', switchNr);
				return false;
			},
		);

		this.Dip = this.createGetSetNumberProxy('DIP',
			() => this.emulator.getDipSwitchByte(),
			(unusedDipIndex: number, value: number) => {
				this.emulator.setDipSwitchByte(value);
				return true;
			},
		);
		this.Lamp = this.createGetSetNumberProxy('LAMP',
			(index) => this.emulator.getLampState(index), SET_NOP);
		this.Solenoid = this.createGetSetNumberProxy('SOLENOID',
			(index) => this.emulator.getSolenoidState(index), SET_NOP);
		this.GIString = this.createGetSetNumberProxy('GI',
			(index) => this.emulator.getGIState(index), SET_NOP);

		// those function get called by the vbs-helper.ts script (getOrCall). To make sure
		// their scope is correct, we bind them here!
		this.Run = this.Run.bind(this);
		this.Stop = this.Stop.bind(this);
	}

	// Control
	get GameName(): string {
		return this.gameName;
	}
	set GameName(gameName: string) {
		logger().debug('SET GAMENAME:', gameName);
		this.gameName = gameName;
		// the VPX interface is sync while this call is async - download the game
		this._loadGame(this.gameName)
			.catch((error) => {
				logger().error('DOWNLOAD_FAILED:', error.messages);
			});
	}

	private async _loadGame(gameName: string) {
		const answer = await downloadGameEntry(gameName);
		logger().info('LOADED', answer.wpcDbEntry);
		await this.emulator.loadGame(answer.wpcDbEntry, answer.romFile);
		this.player.setEmulator(this.emulator);
	}

	get Running(): boolean {
		return this.emulator.getPaused() && this.emulator.isInitialized();
	}
	get Pause(): boolean {
		return this.emulator.getPaused();
	}
	set Pause(paused: boolean) {
		this.emulator.setPaused(paused);
	}
	/**
	 * Returns the version number of Visual PinMAME as an 8-digit string "vvmmbbrr":
	 * Example: A result of "00990201" signifies "Version 0.99 Beta 2 Rev A
	 *
	 */
	get Version(): string {
		return '00990201';
	}
	public Run() {
		logger().debug('RUN', this.gameName);
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
		logger().debug('TODO HandleMechanics', mechanicNr);
	}
	/**
	 * Determine if game uses WPC Numbering of Switches and Lamps
	 * WPCNumbering = Column*10 + Row (11,12,13,14,15,16,17,18,21,22...)
	 * non WPCnumbering = 1,2,3,4,...
	 */
	get WPCNumbering(): number {
		logger().debug('WPCNumbering');
		return 1;
	}
	get SampleRate(): number {
		logger().debug('SampleRate');
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
	/**
	 * Checks the rom set for the current game and displays the results.
	 * @param nShowOptions: 0 = Always displays the results, 1 = Only displays the results if there are errors found, 2 = Never displays the results
	 * @returns true if the roms are good.
	 */
	public CheckROMS(nShowOptions: number): boolean {
		logger().debug('CheckROMS', nShowOptions);
		return true;
	}

	// AggregatePollingFunctions
	get ChangedLamps(): number[][] {
		const changedLamps: number[][] = this.emulator.emulatorState.getChangedLamps();
		return changedLamps;
	}
	get ChangedSolenoids(): number[][] {
		return this.emulator.emulatorState.getChangedSolenoids();
	}
	get ChangedGI(): number[][] {
		return this.emulator.emulatorState.getChangedGI();
	}
	get ChangedLEDs(): number[][] {
		return this.emulator.emulatorState.getChangedLEDs();
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

	private createGetSetNumberProxy(name: string,
			getFunction: (prop: number) => number,
			setFunction: (prop: number, value: number) => boolean,
		): { [index: number]: number } {
		const handler = {
			get: (target: {[ index: number ]: number}, prop: number | string): number => {
				logger().debug('GET', name, {target, prop});
				return getFunction(parseInt(prop.toString(), 10));
			},

			set: (target: {[ index: number ]: number}, prop: number | string, value: number): boolean => {
				logger().debug('SET', name, {target, prop, value});
				return setFunction(parseInt(prop.toString(), 10), value);
			},
		};
		return new Proxy<{ [index: number ]: number; }>({}, handler);
	}

	private createGetSetBooleanProxy(name: string,
		getFunction: (switchNr: number) => number,
		setFunction: (switchNr: number, value?: boolean) => boolean,
	): { [index: number]: number } {
		const handler = {
			get: (target: {[ index: number ]: number}, switchNr: number): number => {
				logger().debug('GET', name, {target, switchNr});
				return getFunction(switchNr);
			},

			set: (target: {[ index: number ]: number}, switchNr: number | string, value?: number | boolean): boolean => {
				logger().debug('SET', name, {target, switchNr, value});
				if (value === 1 || value === true) {
					return setFunction(parseInt(switchNr.toString(), 10), true);
				}
				if (value === 0 || value === false) {
					return setFunction(parseInt(switchNr.toString(), 10), false);
				}
				return setFunction(parseInt(switchNr.toString(), 10));
			},
		};
		return new Proxy<{ [index: number ]: number; }>({}, handler);
		}
}

function SET_NOP(index: number, value: number): boolean {
	logger().warn('UNEXPECTED SET CALL', {index, value});
	return true;
}
