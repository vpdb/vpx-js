import { Stream } from 'stream';
import { Binary } from '../vpt/binary';
import { BmpDecoder } from './bmp/decoder';
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

export async function loadImage(src: string, data: Buffer): Promise<HTMLImageElement> {
	const img = new Image();
	const header = data.readUInt16BE(0);
	let mimeType: string;
	switch (header) {
		case 0x8950: mimeType = 'image/png'; break;
		case 0x4749: mimeType = 'image/gif'; break;
		case 0x424d: mimeType = 'image/bmp'; break;
		case 0xffd8: mimeType = 'image/jpg'; break;
		default: mimeType = 'image/unknown'; break;
	}
	const blob = new Blob([data.buffer], {type: mimeType});
	img.src = URL.createObjectURL(blob);
	return Promise.resolve(img);
}

export async function getRawImage(data: Buffer, width: number, height: number): Promise<ArrayBufferLike> {
	const decoder = bmpDecode(data, {toRGBA: false});
	return Promise.resolve(decoder.data);
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

const bmpDecode = (bmpData: Buffer, options?: IDecoderOptions) => new BmpDecoder(bmpData, options);
