import { GamelistDB } from 'wpc-emu';
import { logger } from '../../../util/logger';

export function getGameEntry(pinmameGameName: string): Promise<void | Response> {
	const entry: undefined | GamelistDB.ClientGameEntry = GamelistDB.getByPinmameName(pinmameGameName);
	if (!entry) {
		return Promise.reject(new Error('GAME_ENTRY_NOT_FOUND_' + pinmameGameName));
	}
	const url: string = buildVpdbUrl(entry.pinmame.vpdbId || entry.pinmame.id);
	return downloadFileAsJson(url)
		.then((jsonData) => {
			logger().debug(pinmameGameName, 'FETCHED', jsonData);
			const result = jsonData.find((vpdbEntry: VpdbGameEntry) => vpdbEntry.id === pinmameGameName);
			logger().debug('FETCHED', result.file);
			//TODO get result.file.url
		});
}

function buildVpdbUrl(id: string): string {
	return `https://api.vpdb.io/v1/games/${id}/roms/`;
}

function downloadFileAsJson(url: string): Promise<void | Response> {
	return fetch(url).then((response) => {
		if (!response.ok) {
			return Promise.reject(new Error('HTTP error, status = ' + response.status));
		}
		return response.json();
	});
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
