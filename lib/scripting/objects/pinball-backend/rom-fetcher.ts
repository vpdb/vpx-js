import { GamelistDB } from 'wpc-emu';
import { logger } from '../../../util/logger';

/**
 * Functions to fetch a WPC ROM file from VPDB.io
 */

export function downloadGameEntry(pinmameGameName: string): Promise<LoadedGameEntry> {
	const gameEntry = GamelistDB.getByPinmameName(pinmameGameName);
	if (!gameEntry) {
		return Promise.reject(new Error('GAME_ENTRY_NOT_FOUND_' + pinmameGameName));
	}
	const url: string = buildVpdbGameEntryUrl(gameEntry.pinmame.vpdbId || gameEntry.pinmame.id);
	return downloadFileAsJson(url)
		.then((jsonData: VpdbGameEntry[]) => {
			if (!Array.isArray(jsonData)) {
				return Promise.reject(new Error('VPDB_INVALID_ANSWER'));
			}
			const result = jsonData.find((vpdbEntry: VpdbGameEntry) => vpdbEntry.id === pinmameGameName);
			if (!result) {
				return Promise.reject(new Error('VPDB_GAME_ENTRY_NOT_FOUND'));
			}
			logger().debug(pinmameGameName, 'VPDB RESULT:', jsonData);

			const romSet = findRomSet(jsonData, pinmameGameName);
			if (!romSet) {
				return Promise.reject(new Error('VPDB_ROMSET_ENTRY_NOT_FOUND'));
			}
			logger().debug(pinmameGameName, 'VPDB romSet:', romSet);

			const romName = findMainRomFilename(romSet);
			if (!romName) {
				return Promise.reject(new Error('VPDB_ROM_TYPE_NOT_FOUND'));
			}
			logger().debug(pinmameGameName, 'VPDB romName:', romName);

			const romUrl = buildVpdbGameRomUrl(romSet.file.url, romName);
			logger().debug('load rom from', romUrl, ', # downloads', romSet.file.counter.downloads);
			return downloadFileAsUint8Array(romUrl);
		})
		.then((romFile: Uint8Array) => {
			return {
				wpcDbEntry: gameEntry,
				romFile,
			};
		});
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

function downloadFileAsJson(url: string): Promise<VpdbGameEntry[]> {
	return fetch(url).then((response: Response) => {
		if (!response.ok) {
			return Promise.reject(new Error('HTTP error, status = ' + response.status));
		}
		return response.json();
	});
}

function downloadFileAsUint8Array(url: string): Promise<Uint8Array> {
	return fetch(url).then((response: Response) => {
		if (!response.ok) {
			return Promise.reject(new Error('HTTP error, status = ' + response.status));
		}
		return response.arrayBuffer();
	}).then((arrayBuffer) => {
		return new Uint8Array(arrayBuffer);
	});
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
