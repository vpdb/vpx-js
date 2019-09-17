import { Stream } from 'stream';
import { Binary } from '../vpt/binary';
import { IImage } from './image';

export class BrowserImage implements IImage {
	public width: number = 0;
	public height: number = 0;
	public src: string = '';

	public containsTransparency(): boolean {
		return false;
	}

	public flipY(): this {
		return this;
	}

	public getFormat(): string {
		return '';
	}

	public getImage(optimize: boolean, quality?: number): Promise<Buffer> {
		return Promise.resolve(Buffer.alloc(0));
	}

	public getMimeType(): string {
		return '';
	}

	public hasTransparency(): boolean {
		return false;
	}

	public resize(width: number, height: number): this {
		return this;
	}
}

export async function loadImage(src: string, data: Buffer, width: number, height: number): Promise<IImage | HTMLImageElement> {

	const blob = new Blob([data.buffer], {type: 'image/png'});
	const url = URL.createObjectURL(blob);
	const img = new Image();

	return new Promise((resolve, reject) => {
		img.onload = () => {
			const ctx = document.createElement('canvas').getContext('2d')!;
			ctx.canvas.width = width;
			ctx.canvas.height = height;
			ctx.drawImage(img, 0, 0);
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.src = url;
	});
}

export function getRawImage(data: Buffer, width: number, height: number)  {
	return null;
}

export async function streamImage(storage: Storage, storageName?: string, binary?: Binary, localPath?: string): Promise<Buffer> {
	let strm: Stream;
	if (localPath) {
		return Promise.resolve(Buffer.alloc(0));
	} else {
		strm = storage.stream(storageName!, binary!.pos, binary!.len);
	}
	return new Promise<Buffer>((resolve, reject) => {
		const bufs: Buffer[] = [];
		/* istanbul ignore if */
		if (!strm) {
			return reject(new Error('No such stream "' + storageName + '".'));
		}
		strm.on('error', reject);
		strm.on('data', (buf: Buffer) => bufs.push(buf));
		strm.on('end', () => resolve(Buffer.concat(bufs)));
	});
}
