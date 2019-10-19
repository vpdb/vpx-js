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

/**
 * Amount of msecs to wait (at least) until same timer can be triggered again
 * (e.g. they can fall behind, if set to > 1, as update cycle is 1000Hz)
 */
export const MAX_TIMER_MSEC_INTERVAL = 1;
/**
 * Amount of msecs that all timers combined can take per frame (e.g. they can
 * fall behind, if set to < somelargevalue)
 */
export const MAX_TIMERS_MSEC_OVERALL = 5;
