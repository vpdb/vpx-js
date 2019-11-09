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

import { GamelistDB } from 'wpc-emu';
import { logger } from '../util/logger';

/**
 * Functions to fetch a WPC ROM file from VPDB.io
 */
export async function downloadGameEntry(pinmameGameName: string): Promise<LoadedGameEntry> {
	const gameEntry = GamelistDB.getByPinmameName(pinmameGameName);
	if (!gameEntry) {
		throw new Error('GAME_ENTRY_NOT_FOUND_' + pinmameGameName);
	}
	const url = buildVpdbGameEntryUrl(gameEntry.pinmame.vpdbId || gameEntry.pinmame.id);
	const jsonData = await downloadFileAsJson(url);
	if (!Array.isArray(jsonData)) {
		logger().error('VPDB Fetch failed for url', url);
		throw new Error('VPDB_INVALID_ANSWER_FOR_' + pinmameGameName);
	}
	const result = jsonData.find((vpdbEntry: VpdbGameEntry) => vpdbEntry.id === pinmameGameName);
	if (!result) {
		throw new Error('VPDB_GAME_ENTRY_NOT_FOUND_' + pinmameGameName);
	}
	logger().debug(pinmameGameName, 'VPDB RESULT:', jsonData);

	const romSet = findRomSet(jsonData, pinmameGameName);
	if (!romSet) {
		throw new Error('VPDB_ROMSET_ENTRY_NOT_FOUND_' + pinmameGameName);
	}
	logger().debug(pinmameGameName, 'VPDB romSet:', romSet);

	const romName = findMainRomFilename(romSet);
	if (!romName) {
		throw new Error('VPDB_ROM_TYPE_NOT_FOUND_' + pinmameGameName);
	}
	logger().debug(pinmameGameName, 'VPDB romName:', romName);

	const romUrl = buildVpdbGameRomUrl(romSet.file.url, romName);
	logger().debug('load rom from', romUrl, ', # downloads', romSet.file.counter.downloads);
	const romFile = await downloadFileAsUint8Array(romUrl);
	return {
		wpcDbEntry: gameEntry,
		romFile,
	};
}

function findMainRomFilename(romSet: VpdbGameEntry): string {
	const vpdbGameRomEntry: VpdbGameRomEntry | undefined = romSet.rom_files.find((entry: VpdbGameRomEntry) => entry.type === 'main');
	if (!vpdbGameRomEntry) {
		return '';
	}
	return vpdbGameRomEntry.filename;
}

function findRomSet(availableRomSets: VpdbGameEntry[], pinmameGameName: string): VpdbGameEntry | undefined {
	return availableRomSets.find((entry: VpdbGameEntry) => entry.id === pinmameGameName);
}

function buildVpdbGameRomUrl(parentFileUrl: string, romFilename: string): string {
	return `${parentFileUrl}/${romFilename}`;
}

function buildVpdbGameEntryUrl(id: string): string {
	return `https://api.vpdb.io/v1/games/${id}/roms/`;
}

async function downloadFileAsJson(url: string): Promise<VpdbGameEntry[]> {
	const response: Response = await fetch(url);
	if (!response.ok) {
		logger().error('VPDB Fetch JSON failed for url', url);
		throw new Error('VPDB_FETCH_FAILED_WITH_ERROR_' + response.status);
	}
	return response.json();
}

async function downloadFileAsUint8Array(url: string): Promise<Uint8Array> {
	const response: Response = await fetch(url);
	if (!response.ok) {
		logger().error('VPDB Fetch ROM failed for url', url);
		throw new Error('VPDB_FETCH_FAILED_WITH_ERROR_' + response.status);
	}
	const arrayBuffer = await response.arrayBuffer();
	return new Uint8Array(arrayBuffer);
}

export interface LoadedGameEntry {
	wpcDbEntry: GamelistDB.ClientGameEntry;
	romFile: Uint8Array;
}

interface VpdbGameEntry {
	id: string;
	version: string;
	notes?: string;
	file: VpdbFileEntry;
	rom_files: VpdbGameRomEntry[];
}

interface VpdbFileEntry {
	id: string;
	bytes: number;
	counter: VpdbCounter;
	is_protected: boolean;
	mime_type: string;
	name: string;
	url: string;
}

interface VpdbGameRomEntry {
	bytes: number;
	crc: number;
	filename: string;
	system: string;
	type: string;
}

interface VpdbCounter {
	downloads: number;
}
