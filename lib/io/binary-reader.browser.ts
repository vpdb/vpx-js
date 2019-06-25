import * as toBuffer from 'blob-to-buffer';

import { IBinaryReader } from './ole-doc';

export class BrowserBinaryReader implements IBinaryReader {

	private readonly blob: Blob;

	constructor(blob: Blob) {
		this.blob = blob;
	}

	public read(buffer: Buffer, offset: number, length: number, position: number): Promise<[number, Buffer]> {
		return Promise.resolve([1, Buffer.alloc(0)]);
	}

	public close(): Promise<void> {
		return Promise.resolve(); // do nothing
	}

	public isOpen(): boolean {
		return true;
	}

	public open(): Promise<void> {
		return Promise.resolve(); // do nothing
	}

	private async toBuffer(blob: Blob): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			toBuffer(blob, (err, buffer) => {
				if (err) {
					return reject(err);
				}
				resolve(buffer);
			});
		});
	}
}
