import { close, open, read } from 'fs';
import { IBinaryReader } from './ole-doc';

export class NodeBinaryReader implements IBinaryReader {

	private readonly filename: string;
	private fd: number = 0;

	constructor(filename: string) {
		this.filename = filename;
	}

	public read(buffer: Buffer, offset: number, length: number, position: number): Promise<[number, Buffer]> {
		return new Promise((resolve, reject) => {
			read(this.fd, buffer, offset, length, position, (err, bytesRead, data) => {
				/* istanbul ignore if */
				if (err) {
					reject(err);
					return;
				}
				resolve([bytesRead, data]);
			});
		});
	}

	public async close(): Promise<void> {
		if (this.fd) {
			await new Promise((resolve, reject) => {
				close(this.fd, err => {
					if (err) {
						reject(err);
						return;
					}
					resolve();
				});
			});
		}
		this.fd = 0;
	}

	public async open(): Promise<void> {
		this.fd = await new Promise((resolve, reject) => {
			open(this.filename, 'r', 0o666, (err, fd) => {
				if (err) {
					reject(err);
					return;
				}
				resolve(fd);
			});
		});
	}

	public isOpen(): boolean {
		return !!this.fd;
	}
}
