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

/* tslint:disable:no-bitwise */

import { EventEmitter } from 'events';
import { BinaryReader } from '../refs.node';
import { readableStream } from './event-stream';

export class Header {

	/** Size of sectors */
	public secSize!: number;

	/** Number of sectors used for the Sector Allocation Table */
	public SATSize!: number;

	/** Number of sectors used for the Master Sector Allocation Table */
	public MSATSize!: number;

	/** Starting Sec ID of the Master Sector Allocation Table */
	public MSATSecId!: number;

	/** Size of short sectors */
	public shortSecSize!: number;

	/** Maximum size of a short stream */
	public shortStreamMax!: number;

	/** Number of sectors used for the Short Sector Allocation Table */
	public SSATSize!: number;

	/** Starting Sec ID of the Short Sector Allocation Table */
	public SSATSecId!: number;

	/** Starting Sec ID of the directory stream */
	public dirSecId!: number;

	public partialMSAT: number[] = [];

	private readonly oleId: Buffer;

	private constructor() {
		this.oleId = Buffer.from('D0CF11E0A1B11AE1', 'hex');
	}

	public static load(buffer: Buffer): Header {
		const header = new Header();
		for (let i = 0; i < 8; i++) {
			/* istanbul ignore if */
			if (header.oleId[i] !== buffer[i]) {
				throw new Error(`Doesn't look like a valid compound document (wrong ID, 0x${header.oleId[i].toString(16)} must be equal to 0x${buffer[i].toString(16)}).`);
			}
		}
		header.secSize = 1 << buffer.readInt16LE(30);
		header.shortSecSize = 1 << buffer.readInt16LE(32);
		header.SATSize = buffer.readInt32LE(44);
		header.dirSecId = buffer.readInt32LE(48);
		header.shortStreamMax = buffer.readInt32LE(56);
		header.SSATSecId = buffer.readInt32LE(60);
		header.SSATSize = buffer.readInt32LE(64);
		header.MSATSecId = buffer.readInt32LE(68);
		header.MSATSize = buffer.readInt32LE(72);

		// The first 109 sectors of the MSAT
		header.partialMSAT = new Array(109);
		for (let i = 0; i < 109; i++) {
			header.partialMSAT[i] = buffer.readInt32LE(76 + i * 4);
		}
		return header;
	}
}

export class AllocationTable {

	private static SecIdFree = -1;
	private static SecIdEndOfChain = -2;
	private static SecIdSAT = -3;
	private static SecIdMSAT = -4;

	private readonly doc: OleCompoundDoc;
	private readonly table: number[] = [];

	private constructor(doc: OleCompoundDoc, table: number[]) {
		this.doc = doc;
		this.table = table;
	}

	public static async load(doc: OleCompoundDoc, secIds: number[]): Promise<AllocationTable> {
		const header = doc.header;
		const table = new Array(secIds.length * (header.secSize / 4));
		const buffer = await doc.readSectors(secIds);
		for (let i = 0; i < buffer.length / 4; i++) {
			table[i] = buffer.readInt32LE(i * 4);
		}
		return new AllocationTable(doc, table);
	}

	public getSecIdChain(startSecId: number): number[] {
		let secId = startSecId;
		const secIds: number[] = [];
		while (secId !== AllocationTable.SecIdEndOfChain) {
			secIds.push(secId);
			secId = this.table[secId];
			if (!secId) {
				throw new Error('Possibly corrupt file (cannot find secId ' + secIds[secIds.length - 1] + ' in allocation table).');
			}
		}
		return secIds;
	}
}

export interface StorageEntry {
	name: string;
	type: number;
	nodeColor: number;
	left: number;
	right: number;
	storageDirId: number;
	secId: number;
	size: number;
	storages: { [key: string]: StorageEntry };
	streams: { [key: string]: StorageEntry };
}

export class DirectoryTree {

	private static EntryTypeEmpty = 0;
	private static EntryTypeStorage = 1;
	private static EntryTypeStream = 2;
	private static EntryTypeRoot = 5;

	private static NodeColorRed = 0;
	private static NodeColorBlack = 1;

	private static Leaf = -1;

	public readonly root: StorageEntry;
	private readonly doc: OleCompoundDoc;
	private readonly entries: StorageEntry[];

	public static async load(doc: OleCompoundDoc, secIds: number[]): Promise<DirectoryTree> {
		const buffer = await doc.readSectors(secIds);
		const count = buffer.length / 128;
		const entries = new Array(count);
		for (let i = 0; i < count; i++) {
			const offset = i * 128;
			const nameLength = Math.max(buffer.readInt16LE(64 + offset) - 1, 0);
			entries[i] = {
				name: buffer.toString('utf16le', offset, nameLength + offset),
				type: buffer.readInt8(66 + offset),
				nodeColor: buffer.readInt8(67 + offset),
				left: buffer.readInt32LE(68 + offset),
				right: buffer.readInt32LE(72 + offset),
				storageDirId: buffer.readInt32LE(76 + offset),
				secId: buffer.readInt32LE(116 + offset),
				size: buffer.readInt32LE(120 + offset),
			};
		}
		const root = entries.find(entry => entry.type === DirectoryTree.EntryTypeRoot);
		return new DirectoryTree(doc, root, entries);
	}

	private constructor(doc: OleCompoundDoc, rootEntry: StorageEntry, entries: StorageEntry[]) {
		this.doc = doc;
		this.root = rootEntry;
		this.entries = entries;
		this.buildHierarchy(this.root);
	}

	private buildHierarchy(storageEntry: StorageEntry) {
		const childIds = this.getChildIds(storageEntry);

		storageEntry.storages = {};
		storageEntry.streams = {};

		for (const childId of childIds) {
			const childEntry = this.entries[childId];
			const name = childEntry.name;
			if (childEntry.type === DirectoryTree.EntryTypeStorage) {
				storageEntry.storages[name] = childEntry;
			}
			if (childEntry.type === DirectoryTree.EntryTypeStream) {
				storageEntry.streams[name] = childEntry;
			}
		}

		for (const childStorageEntry of Object.values(storageEntry.storages)) {
			this.buildHierarchy(childStorageEntry);
		}
	}

	private getChildIds(storageEntry: StorageEntry) {
		const childIds = [];
		if (storageEntry.storageDirId > -1) {
			childIds.push(storageEntry.storageDirId);
			const rootChildEntry = this.entries[storageEntry.storageDirId];
			return this.visit(rootChildEntry, childIds);
		}
		return [];
	}

	private visit(visitEntry: StorageEntry, childIds: number[] = []): number[] {
		if (visitEntry.left !== DirectoryTree.Leaf) {
			childIds.push(visitEntry.left);
			childIds = this.visit(this.entries[visitEntry.left], childIds);
		}
		if (visitEntry.right !== DirectoryTree.Leaf) {
			childIds.push(visitEntry.right);
			childIds = this.visit(this.entries[visitEntry.right], childIds);
		}
		return childIds;
	}
}

export class Storage {

	private readonly doc: OleCompoundDoc;
	private dirEntry: StorageEntry;

	constructor(doc: OleCompoundDoc, dirEntry: StorageEntry) {
		this.doc = doc;
		this.dirEntry = dirEntry;
	}

	public storage(storageName: string): Storage {
		/* istanbul ignore if */
		if (!this.dirEntry.storages[storageName]) {
			throw new Error(`No such storage "${storageName}".`);
		}
		return new Storage(this.doc, this.dirEntry.storages[storageName]);
	}

	public getStreams(): string[] {
		return Object.keys(this.dirEntry.streams);
	}

	public stream(streamName: string, offset: number = 0, bytesToRead: number = 0) {
		const streamEntry = this.dirEntry.streams[streamName];
		if (!streamEntry) {
			return null;
		}

		bytesToRead = bytesToRead || streamEntry.size - offset;
		const shortStream = streamEntry.size < this.doc.header.shortStreamMax;
		const secSize = shortStream ? this.doc.header.shortSecSize : this.doc.header.secSize;
		const allocationTable = shortStream ? this.doc.SSAT : this.doc.SAT;
		const secIds = allocationTable.getSecIdChain(streamEntry.secId);
		const secOffset = Math.floor(offset / secSize);
		offset -= secOffset * secSize;

		return readableStream(async (stream, i): Promise<Buffer | null> => {
			try {
				if (bytesToRead <= 0) {
					stream.emit('end');
					return Promise.resolve(null);
				}

				const currentSec = i + secOffset;
				const currentBytesToRead = Math.min(bytesToRead, secSize - offset);

				let buffer: Buffer;
				if (shortStream) {
					buffer = await this.doc.readShortSector(secIds[currentSec], offset, currentBytesToRead);
				} else {
					buffer = await this.doc.readSector(secIds[currentSec], offset, currentBytesToRead);
				}
				bytesToRead -= currentBytesToRead;
				offset = 0;
				return buffer;

			/* istanbul ignore next */
			} catch (err) {
				stream.emit('error', err);
				stream.emit('end');
				return null;
			}
		});
	}

	/**
	 * This streams a storage blob to a callback function but skips bytes
	 * depending on the function's result.
	 *
	 * The goal is not to read large streams but only get the position of the
	 * data.
	 *
	 * It works like this: The callback function returns the number of bytes to
	 * skip. There is a sliding buffer that contains two consequent sectors.
	 * As soon as the skipped bytes go into the second sector, the sliding
	 * buffer is shifted, i.e. the next sector is read and the first sector is
	 * discarded. If the number of skipped bytes is greater than what's
	 * currently in the sliding buffer, the sliding buffer is discarded and
	 * re-read from the position of the skipped bytes.
	 *
	 * That means:
	 *
	 *   - Disk reads are only done when necessary
	 *   - Read data is cached for further chunks
	 *   - Disk reads are quite efficient in size, usually 4k which is usually
	 *     a disk sector
	 *
	 * @param streamName Name to stream
	 * @param offset Where to start reading in the stream
	 * @param next Callback taking in the data and returning the next position
	 */
	public async streamFiltered<T>(streamName: string, offset: number, next: (data: ReadResult) => Promise<number | null>): Promise<void> {
		const streamEntry = this.dirEntry.streams[streamName];
		/* istanbul ignore if */
		if (!streamEntry) {
			throw new Error('No such stream "' + streamName + '" in document.');
		}

		const bytes = streamEntry.size;
		const shortStream = bytes < this.doc.header.shortStreamMax;
		const secSize = shortStream ? this.doc.header.shortSecSize : this.doc.header.secSize;
		const allocationTable = shortStream ? this.doc.SSAT : this.doc.SAT;
		const secIds = allocationTable.getSecIdChain(streamEntry.secId);

		let storageOffset = offset;
		let secOffset = Math.floor(offset / secSize);
		let slidingBuffer: Buffer;
		offset -= secOffset * secSize;

		const str = readableStream<ReadResult>(async (stream): Promise<ReadResult | null> => {

			const nextSec = Math.floor(offset / secSize);

			if (!slidingBuffer || nextSec > 1) { // if no buffer can be reused, fetch both
				secOffset += nextSec;
				if (shortStream) {
					slidingBuffer = await this.doc.readShortSectors(secIds.slice(secOffset, secOffset + 2));
				} else {
					slidingBuffer = await this.doc.readSectors(secIds.slice(secOffset, secOffset + 2));
				}

			} else if (nextSec === 1) { // if last buffer can be reused as first buffer, fetch second and shift
				secOffset++;
				if (shortStream) {
					slidingBuffer = Buffer.concat([slidingBuffer.slice(slidingBuffer.length - secSize), await this.doc.readShortSectors(secIds.slice(secOffset + 1, secOffset + 2))], secSize * 2);
				} else {
					slidingBuffer = Buffer.concat([slidingBuffer.slice(slidingBuffer.length - secSize), await this.doc.readSectors(secIds.slice(secOffset + 1, secOffset + 2))], secSize * 2);
				}
			}
			offset -= nextSec * secSize;
			const resultBuffer = slidingBuffer.slice(offset);
			const result = {
				data: resultBuffer,
				storageOffset,
			};
			let len = await next(result);

			// if len is negative, we need to read more!
			if (len !== null && len < 0) {
				// read missing sectors
				const remainingLen = -len - resultBuffer.length;
				const numSecs = Math.ceil(remainingLen / secSize);
				/* istanbul ignore if */
				if (remainingLen > bytes - storageOffset) {
					throw new Error(`Cannot read ${remainingLen} bytes when only ${bytes - storageOffset} remain in stream.`);
				}
				//console.log('need %s bytes, reading remaining %s in %s sectors...', -len, remainingLen, numSecs);
				let missingBuffer: Buffer;
				if (shortStream) {
					missingBuffer = await this.doc.readShortSectors(secIds.slice(secOffset + 2, secOffset + 2 + numSecs));
				} else {
					missingBuffer = await this.doc.readSectors(secIds.slice(secOffset + 2, secOffset + 2 + numSecs));
				}
				result.data = Buffer.concat([result.data, missingBuffer]);
				len = await next(result);
			}
			if (len === null) {
				stream.emit('end');
				return Promise.resolve(null);
			}
			offset += len;
			storageOffset += len;

			return Promise.resolve(result);
		});

		await new Promise((resolve, reject) => {
			str.on('end', resolve);
			str.on('error', reject);
		});
	}

	/**
	 * Reads a given stream from a given storage.
	 *
	 * @param key Key within the storage
	 * @param offset Offset within the storage
	 * @param bytesToRead Number of bytes to read, 0 for entire storage
	 * @return {Promise<Buffer>} Read data
	 */
	public async read(key: string, offset: number = 0, bytesToRead: number = 0): Promise<Buffer> {
		return new Promise<Buffer>((resolve, reject) => {
			const strm = this.stream(key, offset, bytesToRead);
			const bufs: Buffer[] = [];
			/* istanbul ignore if */
			if (!strm) {
				return reject(new Error('No such stream "' + key + '".'));
			}
			strm.on('error', reject);
			strm.on('data', (buf: Buffer) => bufs.push(buf));
			strm.on('end', () => resolve(Buffer.concat(bufs)));
		});
	}
}

export class OleCompoundDoc extends EventEmitter {

	public header!: Header;
	public SAT!: AllocationTable;
	public SSAT!: AllocationTable;

	private readonly reader: IBinaryReader;
	private skipBytes: number;
	private rootStorage!: Storage;
	private MSAT: number[] = [];
	private shortStreamSecIds: number[] = [];
	private directoryTree: DirectoryTree | undefined;

	private constructor(reader: IBinaryReader) {
		super();
		this.reader = reader;
		this.skipBytes = 0;
	}

	public static async load(reader: IBinaryReader): Promise<OleCompoundDoc> {

		const doc = new OleCompoundDoc(reader);
		try {
			await doc.openFile();
			await doc.readHeader();
			await doc.readMSAT();
			await doc.readSAT();
			await doc.readSSAT();
			await doc.readDirectoryTree();

		} catch (err) {
			await doc.close();
			throw err;
		}
		return doc;
	}

	/* istanbul ignore next: Don't currently need this (at all) */
	public async readWithCustomHeader(size: number): Promise<Buffer> {
		this.skipBytes = size;
		await this.openFile();
		const buffer = await this.readCustomHeader();
		await this.readHeader();
		await this.readMSAT();
		await this.readSAT();
		await this.readSSAT();
		await this.readDirectoryTree();

		return buffer;
	}

	public async reopen(): Promise<void> {
		await this.openFile();
	}

	public storage(storageName: string): Storage {
		this.assertLoaded();
		return this.rootStorage.storage(storageName);
	}

	// public stream(streamName: string, offset: number = 0, len: number = -1) {
	// 	this.assertLoaded();
	// 	return this.rootStorage.stream(streamName, offset, len);
	// }

	public async readSector(secId: number, offset: number = 0, bytesToRead: number = 0) {
		this.assertLoaded();
		return this.readSectors([secId], offset, bytesToRead);
	}

	public async readSectors(secIds: number[], offset: number = 0, bytesToRead: number = 0): Promise<Buffer> {
		bytesToRead = Math.min(secIds.length * this.header.secSize, bytesToRead || secIds.length * this.header.secSize);
		this.assertLoaded();
		const buffer = Buffer.alloc(bytesToRead);
		let i = 0;
		let bufferOffset = 0;
		while (i < secIds.length && bytesToRead > 0) {
			if (offset >= this.header.secSize) {
				offset -= this.header.secSize;
				i++;
				continue;
			}
			const fileLen = Math.min(this.header.secSize - offset, bytesToRead);
			const fileOffset = offset + this.getFileOffsetForSec(secIds[i]);
			await this.reader.read(buffer, bufferOffset, fileLen, fileOffset);
			bytesToRead -= fileLen;
			bufferOffset += fileLen;
			offset = 0;
			i++;
		}
		return buffer;
	}

	public async readShortSector(secId: number, offset: number = 0, bytesToRead: number = 0): Promise<Buffer> {
		this.assertLoaded();
		return this.readShortSectors([secId], offset, bytesToRead);
	}

	public async readShortSectors(secIds: number[], offset: number = 0, bytesToRead: number = 0): Promise<Buffer> {
		bytesToRead = Math.min(secIds.length * this.header.shortSecSize, bytesToRead || secIds.length * this.header.shortSecSize);
		const buffer = Buffer.alloc(bytesToRead);
		let i = 0;
		let bufferOffset = 0;
		while (i < secIds.length && bytesToRead > 0) {
			if (offset >= this.header.shortSecSize) {
				offset -= this.header.shortSecSize;
				i++;
				continue;
			}
			const fileOffset = offset + this.getFileOffsetForShortSec(secIds[i]);
			const fileLen = Math.min(this.header.shortSecSize - offset, bytesToRead);
			await this.reader.read(buffer, bufferOffset, fileLen, fileOffset);
			bytesToRead -= fileLen;
			bufferOffset += fileLen;
			offset = 0;
			i++;
		}
		return buffer;
	}

	public async close(): Promise<void> {
		await this.reader.close();
	}

	private assertLoaded() {
		/* istanbul ignore if */
		if (!this.reader.isOpen()) {
			throw new Error('Document must be loaded first.');
		}
	}

	private async openFile(): Promise<void> {
		await this.reader.open();
	}

	private async readCustomHeader(): Promise<Buffer> {
		const buffer = Buffer.alloc(this.skipBytes);
		const [bytesRead, data] = await this.reader.read(buffer, 0, this.skipBytes, 0);
		return data;
	}

	private async readHeader(): Promise<void> {
		const buffer = Buffer.alloc(512);
		const [bytesRead, data] = await this.reader.read(buffer, 0, 512, this.skipBytes);
		this.header = Header.load(data);
	}

	private async readMSAT(): Promise<void> {

		this.MSAT = this.header.partialMSAT.slice(0);
		this.MSAT.length = this.header.SATSize;

		if (this.header.SATSize <= 109 || this.header.MSATSize === 0) {
			return;
		}

		let secId = this.header.MSATSecId;
		let currMSATIndex = 109;
		let i = 0;
		while (i < this.header.MSATSize) {
			const sectorBuffer = await this.readSector(secId);
			for (let s = 0; s < this.header.secSize - 4; s += 4) {
				if (currMSATIndex >= this.header.SATSize) {
					break;
				} else {
					this.MSAT[currMSATIndex] = sectorBuffer.readInt32LE(s);
				}
				currMSATIndex++;
			}
			secId = sectorBuffer.readInt32LE(this.header.secSize - 4);
			i++;
		}
	}

	private async readSAT(): Promise<void> {
		this.SAT = await AllocationTable.load(this, this.MSAT);
	}

	private async readSSAT(): Promise<void> {
		const secIds = this.SAT.getSecIdChain(this.header.SSATSecId);
		/* istanbul ignore if */
		if (secIds.length !== this.header.SSATSize) {
			throw new Error('Invalid Short Sector Allocation Table');
		}
		this.SSAT = await AllocationTable.load(this, secIds);
	}

	private async readDirectoryTree(): Promise<void> {

		const secIds = this.SAT.getSecIdChain(this.header.dirSecId);
		this.directoryTree = await DirectoryTree.load(this, secIds);

		const rootEntry = this.directoryTree.root;
		this.rootStorage = new Storage(this, rootEntry);
		this.shortStreamSecIds = this.SAT.getSecIdChain(rootEntry.secId);
	}

	private getFileOffsetForSec(secId: number): number {
		const secSize = this.header.secSize;
		return this.skipBytes + (secId + 1) * secSize;  // Skip past the header sector
	}

	private getFileOffsetForShortSec(shortSecId: number): number {
		const shortSecSize = this.header.shortSecSize;
		const shortStreamOffset = shortSecId * shortSecSize;
		const secSize = this.header.secSize;
		const secIdIndex = Math.floor(shortStreamOffset / secSize);
		const secOffset = shortStreamOffset % secSize;
		const secId = this.shortStreamSecIds[secIdIndex];
		return this.getFileOffsetForSec(secId) + secOffset;
	}
}

export interface ReadResult {
	data: Buffer;
	storageOffset: number;
}

export interface IBinaryReader {

	/**
	 * Reads data into a buffer.
	 *
	 * @param buffer Buffer to write to
	 * @param offset Offset in the buffer to write to
	 * @param length How many bytes to read
	 * @param position At which offset to start reading
	 * @returns [ number of bytes read, data read ]
	 */
	read(buffer: Buffer, offset: number, length: number, position: number): Promise<[ number, Buffer ]>;

	/**
	 * Opens the data source.
	 */
	open(): Promise<void>;

	/**
	 * Closes the data source.
	 */
	close(): Promise<void>;

	/**
	 * Returns whether the data source is opened.
	 */
	isOpen(): boolean;
}

/* tslint:enable:no-bitwise */
