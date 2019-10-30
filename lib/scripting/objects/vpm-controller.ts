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

import { WpcEmuWebWorkerApi, gamelist } from 'wpc-emu';

export class VpmController {

  private webworker: WpcEmuWebWorkerApi.WebWorkerApi;

  constructor(optionalWebWorkerInstance?: any) {
    this.webworker = WpcEmuWebWorkerApi.initializeWebworkerAPI(optionalWebWorkerInstance);

    console.log(gamelist.getAllNames());
    const game: gamelist.ClientGameEntry = gamelist.getByName('WPC-95: Medieval Madness');

    const romData: WpcEmuWebWorkerApi.RomData = { u06: new Uint8Array(2048) };
    const gameEntry: WpcEmuWebWorkerApi.GameEntry = {
      name: 'foo',
      rom: {
        u06: 'my.rom',
      },
      skipWpcRomCheck: false,
      fileName: 'fooname',
      features: [ 'wpc95' ],
    };
    this.webworker.initializeEmulator(romData, gameEntry);
  }

}
