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
const MAX_CODES = 4095;
const CODE_MASK = [
	0,
	0x0001, 0x0003,
	0x0007, 0x000F,
	0x001F, 0x003F,
	0x007F, 0x00FF,
	0x01FF, 0x03FF,
	0x07FF, 0x0FFF,
];

/**
 * This is a 1:1 port of VPinball's lzwreader which is used to decompress
 * bitmaps.
 *
 * @see https://github.com/vpinball/vpinball/blob/master/media/lzwreader.cpp
 */
export class LzwReader {

	private pstm: BufferPtr;

	/* output */
	private readonly pbBitsOutCur: BufferPtr;
	private readonly cbStride: number;
	private badCodeCount: number;

	/* Static variables */
	private currSize: number = 0;                 /* The current code size */
	private clear: number = 0;                    /* Value for a clear code */
	private ending: number = 0;                   /* Value for a ending code */
	private newCodes: number = 0;                 /* First available code */
	private topSlot: number = 0;                  /* Highest code for current size */
	private slot: number = 0;                     /* Last read code */

	/* The following static variables are used
	 * for separating out codes
	 */
	private numAvailBytes: number = 0;              /* # bytes left in block */
	private numBitsLeft: number = 0;                /* # bits left in current byte */
	private b1: number = 0;                         /* Current byte */
	private byteBuff = Buffer.alloc(257);      /* Current block */
	private pBytes!: BufferPtr;                     /* points to byte_buff - Pointer to next byte in block */

	private stack = Buffer.alloc(MAX_CODES + 1);     /* Stack for storing pixels */
	private suffix = Buffer.alloc(MAX_CODES + 1);    /* Suffix table */
	private prefix: number[] = [];                        /* Prefix linked list */

	private readonly width: number;
	private readonly height: number;
	private linesLeft: number;

	constructor(pstm: Buffer, width: number, height: number, pitch: number) {
		for (let i = 0; i < MAX_CODES + 1; i++) {
			this.prefix[i] = 0;
		}
		this.cbStride = pitch;
		this.pbBitsOutCur = new BufferPtr(Buffer.alloc(pitch * height));

		this.badCodeCount = 0;

		this.pstm = new BufferPtr(pstm);

		this.width = width; // 32-bit picture
		this.height = height;
		this.linesLeft = height + 1; // +1 because 1 gets taken o
	}

	public decompress(): [ Buffer, number ] {

		let sp: BufferPtr; // points to this.stack
		let bufPtr: BufferPtr; // points to this.buf
		let buf: BufferPtr;
		let bufCnt: number;

		let c: number;
		let oc: number;
		let fc: number;
		let code: number;
		let size: number;

		/* Initialize for decoding a new image...
		 */
		size = 8;
		this.initExp(size);

		/* Initialize in case they forgot to put in a clear code.
		 * (This shouldn't happen, but we'll try and decode it anyway...)
		 */
		oc = fc = 0;

		/* Allocate space for the decode buffer
		 */
		buf = this.NextLine();

		/* Set up the stack pointer and decode buffer pointer
		 */
		sp = new BufferPtr(this.stack);
		bufPtr = BufferPtr.fromPtr(buf);
		bufCnt = this.width;

		/* This is the main loop.  For each code we get we pass through the
		 * linked list of prefix codes, pushing the corresponding "character" for
		 * each code onto the stack.  When the list reaches a single "character"
		 * we push that on the stack too, and then start unstacking each
		 * character for output in the correct order.  Special handling is
		 * included for the clear code, and the whole thing ends when we get
		 * an ending code.
		 */
		c = this.getNextCode();
		while (c !== this.ending) {

			/* If we had a file error, return without completing the decode
			 */
			if (c < 0) {
				break;
			}

			/* If the code is a clear code, reinitialize all necessary items.
			 */
			if (c === this.clear) {
				this.currSize = size + 1;
				this.slot = this.newCodes;
				this.topSlot = 1 << this.currSize;

				/* Continue reading codes until we get a non-clear code
				 * (Another unlikely, but possible case...)
				 */
				c = this.getNextCode();
				while (c === this.clear) {
					c = this.getNextCode();
				}

				/* If we get an ending code immediately after a clear code
				 * (Yet another unlikely case), then break out of the loop.
				 */
				if (c === this.ending) {
					break;
				}

				/* Finally, if the code is beyond the range of already set codes,
				 * (This one had better NOT happen...  I have no idea what will
				 * result from this, but I doubt it will look good...) then set it
				 * to color zero.
				 */
				if (c >= this.slot) {
					c = 0;
				}

				oc = fc = c;

				/* And let us not forget to put the char into the buffer... And
				 * if, on the off chance, we were exactly one pixel from the end
				 * of the line, we have to send the buffer to the out_line()
				 * routine...
				 */
				bufPtr.set(c);
				bufPtr.incr();

				if (--bufCnt === 0) {
					buf = this.NextLine();
					bufPtr = BufferPtr.fromPtr(buf);
					bufCnt = this.width;
				}

			} else {

				/* In this case, it's not a clear code or an ending code, so
				 * it must be a code code...  So we can now decode the code into
				 * a stack of character codes. (Clear as mud, right?)
				 */
				code = c;

				/* Here we go again with one of those off chances...  If, on the
				 * off chance, the code we got is beyond the range of those already
				 * set up (Another thing which had better NOT happen...) we trick
				 * the decoder into thinking it actually got the last code read.
				 * (Hmmn... I'm not sure why this works...  But it does...)
				 */
				if (code >= this.slot) {
					if (code > this.slot) {
						++this.badCodeCount;
					}
					code = oc;
					sp.set(fc);
					sp.incr();
				}

				/* Here we scan back along the linked list of prefixes, pushing
				 * helpless characters (ie. suffixes) onto the stack as we do so.
				 */
				while (code >= this.newCodes) {
					sp.set(this.suffix[code]);
					sp.incr();
					code = this.prefix[code];
				}

				/* Push the last character on the stack, and set up the new
				 * prefix and suffix, and if the required slot number is greater
				 * than that allowed by the current bit size, increase the bit
				 * size.  (NOTE - If we are all full, we *don't* save the new
				 * suffix and prefix...  I'm not certain if this is correct...
				 * it might be more proper to overwrite the last code...
				 */
				sp.set(code);
				sp.incr();
				if (this.slot < this.topSlot) {
					fc = code;
					this.suffix[this.slot] = fc;	// = code;
					this.prefix[this.slot++] = oc;
					oc = c;
				}
				if (this.slot >= this.topSlot) {
					if (this.currSize < 12) {
						this.topSlot <<= 1;
						++this.currSize;
					}
				}

				/* Now that we've pushed the decoded string (in reverse order)
				 * onto the stack, lets pop it off and put it into our decode
				 * buffer...  And when the decode buffer is full, write another
				 * line...
				 */
				while (sp.getPos() > 0) {

					sp.decr();
					bufPtr.set(sp.get());
					bufPtr.incr();
					if (--bufCnt === 0) {
						buf = this.NextLine();
						bufPtr = buf;
						bufCnt = this.width;
					}
				}
			}
			c = this.getNextCode();
		}
		return [ this.pbBitsOutCur.getBuffer(), this.pstm.getPos() ];
	}

	private initExp(size: number): void {
		this.currSize = size + 1;
		this.topSlot = 1 << this.currSize;
		this.clear = 1 << size;
		this.ending = this.clear + 1;
		this.slot = this.newCodes = this.ending + 1;
		this.numAvailBytes = this.numBitsLeft = 0;
	}

	private NextLine(): BufferPtr {
		const pbRet = BufferPtr.fromPtr(this.pbBitsOutCur);
		this.pbBitsOutCur.incr(this.cbStride);	// fucking upside down dibs!
		this.linesLeft--;
		return pbRet;
	}

	private getNextCode(): number {
		let ret: number;
		if (this.numBitsLeft === 0) {
			if (this.numAvailBytes <= 0) {

				/* Out of bytes in current block, so read next block
				 */
				this.pBytes = new BufferPtr(this.byteBuff);
				this.numAvailBytes = this.getByte();
				if (this.numAvailBytes < 0) {
					return (this.numAvailBytes);

				} else if (this.numAvailBytes) {
					for (let i = 0; i < this.numAvailBytes; ++i) {
						const x = this.getByte();
						if (x < 0) {
							return x;
						}
						this.byteBuff[i] = x;
					}
				}
			}
			this.b1 = this.pBytes.get();
			this.pBytes.incr();
			this.numBitsLeft = 8;
			--this.numAvailBytes;
		}

		ret = this.b1 >> (8 - this.numBitsLeft);
		while (this.currSize > this.numBitsLeft) {
			if (this.numAvailBytes <= 0) {

				/* Out of bytes in current block, so read next block
				 */
				this.pBytes = new BufferPtr(this.byteBuff);
				this.numAvailBytes = this.getByte();
				if (this.numAvailBytes < 0) {
					return this.numAvailBytes;

				} else if (this.numAvailBytes) {
					for (let i = 0; i < this.numAvailBytes; ++i) {
						const x = this.getByte();
						if (x < 0) {
							return x;
						}
						this.byteBuff[i] = x;
					}
				}
			}
			this.b1 = this.pBytes.get();
			this.pBytes.incr();
			ret |= this.b1 << this.numBitsLeft;
			this.numBitsLeft += 8;
			--this.numAvailBytes;
		}
		this.numBitsLeft -= this.currSize;
		ret &= CODE_MASK[this.currSize];
		return ret;
	}

	private getByte(): number {
		return this.pstm.next();
	}
}

/**
 * Simulates a C pointer to some data. Data is never copied,
 * only the pointer is updated.
 */
class BufferPtr {
	private readonly buf: Buffer;
	private pos: number;

	constructor(buf: Buffer, pos: number = 0) {
		this.buf = buf;
		this.pos = pos;
	}

	public static fromPtr(ptr: BufferPtr) {
		return new BufferPtr(ptr.buf, ptr.pos);
	}

	public incr(offset: number = 1) {
		this.pos += offset;
	}

	public decr(offset: number = 1) {
		this.pos -= offset;
	}

	public get(offset: number = -1): number {
		return this.buf[offset > -1 ? offset : this.pos];
	}

	public next(): number {
		return this.buf[this.pos++];
	}

	public set(value: number) {
		this.buf[this.pos] = value;
	}

	public getPos(): number {
		return this.pos;
	}

	public getBuffer(): Buffer {
		return this.buf;
	}

	public toString() {
		return `${this.pos}:[ ${this.buf.slice(this.pos).join(', ')} ]`;
	}
}
