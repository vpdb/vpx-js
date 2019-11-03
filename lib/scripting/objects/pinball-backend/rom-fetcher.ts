import { GamelistDB } from 'wpc-emu';
import { logger } from '../../../util/logger';

export function getGameEntry(pinmameGameName: string): Promise<LoadedGameEntry> {
	const gameEntry: undefined | GamelistDB.ClientGameEntry = GamelistDB.getByPinmameName(pinmameGameName);
	if (!gameEntry) {
		return Promise.reject(new Error('GAME_ENTRY_NOT_FOUND_' + pinmameGameName));
	}
	const url: string = buildVpdbGameEntryUrl(gameEntry.pinmame.vpdbId || gameEntry.pinmame.id);
	return downloadFileAsJson(url)
		.then((jsonData: VpdbGameEntry[]) => {
			const result: VpdbGameEntry | void = jsonData.find((vpdbEntry: VpdbGameEntry) => vpdbEntry.id === pinmameGameName);
			if (!result) {
				return Promise.reject(new Error('GAME_ENTRY_NOT_FOUND'));
			}
			logger().debug(pinmameGameName, 'VPDB RESULT:', jsonData);
			// TODO get main ROM from VPDB response
			const romUrl: string = 'https://storage.vpdb.io/files/p2b9gpvd1.zip/mm_1_09c.bin';
			logger().debug('load rom from', romUrl);
			return downloadFileAsUint8Array(romUrl);
		})
		.then((romFile: Uint8Array) => {
			return {
				wpcDbEntry: gameEntry,
				romFile,
			};
		});
}

function buildVpdbGameEntryUrl(id: string): string {
	return `https://api.vpdb.io/v1/games/${id}/roms/`;
}

function downloadFileAsJson(url: string): Promise<VpdbGameEntry[]> {
	return fetch(url).then((response) => {
		if (!response.ok) {
			return Promise.reject(new Error('HTTP error, status = ' + response.status));
		}
		return response.json();
	});
}

function downloadFileAsUint8Array(url: string): Promise<Uint8Array> {
	return fetch(url).then((response) => {
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
}

interface VpdbFileEntry {
	id: string;
	bytes: number;
	is_protected: boolean;
	mime_type: string;
	name: string;
	url: string;
}
