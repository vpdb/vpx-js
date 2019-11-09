import { GamelistDB } from 'wpc-emu';
import { logger } from '../../../util/logger';

/**
 * Functions to fetch a WPC ROM file from VPDB.io
 */

export async function downloadGameEntry(pinmameGameName: string): Promise<LoadedGameEntry> {
	const gameEntry = GamelistDB.getByPinmameName(pinmameGameName);
	if (!gameEntry) {
		throw(new Error('GAME_ENTRY_NOT_FOUND_' + pinmameGameName));
	}
	const url: string = buildVpdbGameEntryUrl(gameEntry.pinmame.vpdbId || gameEntry.pinmame.id);

	const jsonData = await downloadFileAsJson(url);
	if (!Array.isArray(jsonData)) {
		throw(new Error('VPDB_INVALID_ANSWER'));
	}
	const result = jsonData.find((vpdbEntry: VpdbGameEntry) => vpdbEntry.id === pinmameGameName);
	if (!result) {
		throw(new Error('VPDB_GAME_ENTRY_NOT_FOUND'));
	}
	logger().debug(pinmameGameName, 'VPDB RESULT:', jsonData);

	const romSet = findRomSet(jsonData, pinmameGameName);
	if (!romSet) {
		throw(new Error('VPDB_ROMSET_ENTRY_NOT_FOUND'));
	}
	logger().debug(pinmameGameName, 'VPDB romSet:', romSet);

	const romName = findMainRomFilename(romSet);
	if (!romName) {
		throw(new Error('VPDB_ROM_TYPE_NOT_FOUND'));
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
		throw(new Error('HTTP error, status = ' + response.status));
	}
	return response.json();
}

async function downloadFileAsUint8Array(url: string): Promise<Uint8Array> {
	const response: Response = await fetch(url);
	if (!response.ok) {
		throw(new Error('HTTP error, status = ' + response.status));
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
