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

export async function loadImage(src: string, data: Buffer): Promise<IImage> {
	return Promise.resolve(new BrowserImage());
}

export function getRawImage(data: Buffer, width: number, height: number)  {
	return null;
}

export async function streamImage(storage: Storage, storageName?: string, binary?: Binary, localPath?: string): Promise<Buffer> {
	return Promise.resolve(Buffer.alloc(0));
}
