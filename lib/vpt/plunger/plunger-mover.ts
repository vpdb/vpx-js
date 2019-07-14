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

import { Player } from '../../game/player';
import { Vertex2D } from '../../math/vertex2d';
import { HitLineZ } from '../../physics/hit-line-z';
import { LineSeg } from '../../physics/line-seg';
import { MoverObject } from '../../physics/mover-object';
import { GameData } from '../game-data';
import { PlungerData } from './plunger-data';

export class PlungerMover implements MoverObject {

	private plungerData: PlungerData;

	/**
	 * position of the on-screen plunger (left)
	 */
	private x: number = 0;

	/**
	 * position of the on-screen plunger (right)
	 */
	private x2: number = 0;

	/**
	 * position of the on-screen plunger (bottom)
	 */
	private y: number = 0;

	// boundaries for detecting collisions
	private linesegBase!: LineSeg;
	private linesegEnd!: LineSeg;
	private linesegSide: LineSeg[] = [];

	private jointBase: HitLineZ[] = [];
	private jointEnd: HitLineZ[] = [];

	//
	/**
	 * Current rod position, in table distance units.
	 *
	 * This represents the location of the tip of the plunger.
	 */
	private pos: number = 0;

	/**
	 * current rod speed, in table distance units per second(?)
	 */
	private speed: number = 0;

	/**
	 * Forward travel limit.  When we're about to collide with a ball,
	 * we'll temporarily set this so the collision location.  We set
	 * this in HitTest(), and use it (and reset it) in the next call
	 * to UpdateDisplacements().  This is expressed in absolute
	 * position coordinates, so the default value (which allows full
	 * forward travel) is m_frameEnd.
	 *
	 * The purpose of this limit is to fix buggy behavior that can
	 * happen when the ball speed after a collision is slower than the
	 * plunger speed before the collision.  (In past versions, this
	 * scenario wasn't really possible, because the plunger code just
	 * gave the ball the same velocity as the plunger at the time of
	 * collision.  But this was a bit limiting; the physical process
	 * we're modeling is really a transfer of momentum, not velocity.
	 * With the addition of the Momentum Transfer property and the new
	 * accounting for the relative mass ofthe ball, the ball can now
	 * come out of the collision with a slower speed than the plunger
	 * had going in.)
	 *
	 * The bug that this can trigger is that the fast-moving plunger
	 * can overtake and shoot past the slow-moving ball.  Left to their
	 * own devices, the two objects would just keep moving at their
	 * programmed velocities.  If the plunger velocity is faster than
	 * the ball after the collision, the plunger can shoot past the
	 * ball as though it's not there.  The best way I've found to fix
	 * this is to add this extra limit on the travel distance.  This
	 * lets us figure where the ball is at the point of collision and
	 * explicitly prevent the plunger from going past that until the
	 * next displacement update, when the ball will have been moved
	 * as well.
	 */
	private travelLimit: number = 0;

	/**
	 * Mass of the moving parts.  This is in arbitrary units, and serves
	 * as a scaling factor in some of the plunger speed calculations.
	 *
	 * This was probably originally conceived with good intentions of
	 * doing a more thorough Physics model, but the way it's actually
	 * implemented, it's just a constant scaling factor that probably
	 * should have been absorbed into the other arbitrary-units factors
	 * to simplify the calculations.  As it is it just makes some of
	 * the calculations look more complicated than they really are.
	 *
	 * It was probably also originally conceived as a user-writable
	 * property that table authors could use to fine-tune the physics
	 * of an individual plunger object, but it has never been exposed
	 * to scripting in any past release.  At this point, assumptions
	 * about the scale of this value are pretty well entangled into
	 * the plunger physics code, so it would take some analysis of the
	 * side effects before we could let table author tweak this.  To
	 * emphasize this, the value is now explicitly a constant.  If
	 * you want to change the value or make it writable, be aware that
	 * you might throw off the balance of the mech vs keyboard plunger
	 * strengths - make sure you understand all of the speed and
	 * force calculations in hitplunger.cpp before proceeding.
	 */
	private mass: number = 0;

	/**
	 * Pull force.  This models the force being applied by the player
	 * when pulling back the plunger via the keyboard interface.  When
	 * this is non-zero, we ignore the mechanical plunger position and
	 * instead move under this force.
	 */
	private pullForce: number = 0;

	/**
	 * Reverse impulse.  This models the little bit of force applied
	 * to the plunger when a moving ball hits it.  Most of our
	 * collisions involve a moving plunger hitting a stationary ball,
	 * so we transfer momentum from the plunger to the ball.  But
	 * this works both ways; if a stationary plunger is hit by a
	 * moving ball, it gets a little bump.  This isn't a huge effect
	 * but it's a nice bit of added realism.
	 */
	private reverseImpulse: number = 0;

	/**
	 * Firing mode timer.  When this is non-zero, we're in a Fire
	 * event.
	 *
	 * A Fire event is initiated in one of two ways:
	 *
	 *  1. The keyboard/script interface calls the Fire method
	 *  2. The mechanical plunger moves forware rapidly
	 *
	 * In either case, we calculate the firing speed based on how
	 * far the plunger is pulled back.  Since the plunger is basically
	 * a spring, pulling it back and letting it go converts the
	 * potential energy in the spring to kinetic energy in the
	 * plunger rod; the bottom line is that the final speed of
	 * the plunger is proportional to the spring displacement (how
	 * far back the plunger was pulled).  So we calculate the speed
	 * at the start of the release and allow the rod to move freely
	 * at this speed until it strikes the ball.
	 *
	 * Durina a Fire event, the simulated plunger is completely
	 * disconnected from the mechanical plunger and moves under its
	 * own power.  In principle, if we have a mechanical plunger,
	 * we *should* be able to track the actual physical motion of
	 * the real plunger in real time and just have the software
	 * plunger do exactly the same thing.  But this doesn't work
	 * in practice because real plungers move much too quickly
	 * for our simulation and USB input to keep up with.  Our
	 * nominal simulation time base is 10ms, and the USB input
	 * updates at 10-30ms cycles.  (USB isn't synchronized with
	 * our physics cycle, either, so even if the USB updates were
	 * 10ms or faster, we still wouldn't get USB updates on every
	 * physics cycle just because the timing wouldn't always align.)
	 * In 20ms, a real physical plunger can shoot all the way
	 * forward, bounce part way back, and move forward again.  The
	 * result is aliasing.
	 *
	 * To deal with this, we use heuristics to try to guess when the
	 * physical plunger has been released.  When we detect that it
	 * has, we simply disconnect the simulated plunger from the
	 * physical plunger and let the simulated version move freely
	 * under its own spring forces.  We ignore inputs from the analog
	 * plunger during this interval.  The real plunger can be expected
	 * to come to rest after a full release in about 200ms, so we
	 * only leave this mode in effect for a limited time, at which
	 * point we start tracking the real plunger position again.
	 */
	private fireTimer: number = 0;

	/**
	 * Firing speed.  When a Fire event is initiated, we calculate
	 * the speed and store it here.  UpdateVelocities() applies this
	 * as long as we're in fire mode.
	 */
	private fireSpeed: number = 0;

	/**
	 * Auto Fire mode timer.  When we're acting as an Auto Plunger,
	 * we'll initiate a synthetic Fire event, which consists of a
	 * KeyDown(Return) message to the script, followed a short
	 * time later by a corresponding KeyUp(Return) message.  This
	 * lets the player use the natural pull-and-release gesture with
	 * a mechanical plunger to trigger the Launch Ball event on a
	 * table that has a pushbutton launcher instead of a regular
	 * plunger.  This timer handles the interval between the KeyDown
	 * and KeyUp events.
	 */
	private autoFireTimer: number = 0;

	/**
	 * Fire event bounce position.  When we reach this position,
	 * we'll reverse course, simulating the bounce off the barrel
	 * spring (or, if already in the bounce, the next reversal).
	 */
	private fireBounce: number = 0;

	/**
	 * Relative rest position, as a fraction of the full range.  For
	 * historical reasons, this is the park position if "mech enabled"
	 * is true in the plunger's properties, or the maximum forward
	 * position if not.
	 */
	private restPos: number = 0;

	/**
	 * maximum retracted position, in absolute table coordinates
	 */
	private frameStart: number = 0;

	/**
	 * maximum forward position, in absolute table coordinates
	 */
	private frameEnd: number = 0;

	/**
	 * frame length
	 */
	private frameLen: number = 0;

	/**
	 * Stroke Events are armed.  We use this for a hysteresis system
	 * for the End-of-stroke and Beginning-of-stroke events.  Any time
	 * plunger is away from the extremes of its range of motion, we
	 * set this flat to true.  This arms the events for the next time
	 * we approach one of the extremes.  If we're close to one of the
	 * ends, if this flag is true, we'll fire the corresponding event
	 * and clear this flag.  This lets us fire the events when we're
	 * *close* to one of the ends without having to actually reach the
	 * exact end, and ensures that we don't fire the event repeatedly
	 * if we stop at one of the ends for a while.
	 */
	private fStrokeEventsArmed: boolean = false;

	/**
	 * Recent history of mechanical plunger readings.  We keep the
	 * last few distinct readings so that we can make a better guess
	 * at the true starting point of a release motion when we detect
	 * that the analog plunger is moving rapidly forward.  We
	 * usually detect a release motion by seeing a rapid forward
	 * position change between two consecutive USB samples.  However,
	 * the real plunger moves so quickly that the first of these
	 * two samples is usually already somewhat forward of the point
	 * where the release actually started.  The history lets us go
	 * back to the position where the plunger was hovering before
	 * being released.  In most cases, the user moves the plunger
	 * slowly enough for our USB samples to keep up and give us an
	 * accurate position reading; it's only on release that it starts
	 * moving too fast.
	 */
	private mech0: number = 0;
	private mech1: number = 0;
	private mech2: number = 0;

	/**
	 * scatter velocity (degree of randomness in the impulse when
	 * the plunger strikes the ball, to simulate the mechanical
	 * randomness in a real plunger)
	 */
	private scatterVelocity: number = 0;

	constructor(plungerData: PlungerData, player: Player, tableData: GameData) {
		this.plungerData = plungerData;
	}

	public updateDisplacements(dtime: number): void {
		// figure the travel distance
		const dx = dtime * this.speed;

		// figure the position change
		this.pos += dx;

		// apply the travel limit
		if (this.pos < this.travelLimit) {
			this.pos = this.travelLimit;
		}

		// if we're in firing mode and we've crossed the bounce position, reverse course
		const relPos = (this.pos - this.frameEnd) / this.frameLen;
		const bouncePos = this.restPos + this.fireBounce;
		if (this.fireTimer !== 0 && dtime !== 0.0 && ((this.fireSpeed < 0.0 ? relPos <= bouncePos : relPos >= bouncePos))) {
			// stop at the bounce position
			this.pos = this.frameEnd + bouncePos * this.frameLen;

			// reverse course at reduced speed
			this.fireSpeed = -this.fireSpeed * 0.4;

			// figure the new bounce as a fraction of the previous bounce
			this.fireBounce *= -0.4;
		}

		// apply the travel limit (again)
		if (this.pos < this.travelLimit) {
			this.pos = this.travelLimit;
		}

		// limit motion to the valid range
		if (dtime !== 0.0) {
			if (this.pos < this.frameEnd) {
				this.speed = 0.0;
				this.pos = this.frameEnd;

			} else if (this.pos > this.frameStart) {
				this.speed = 0.0;
				this.pos = this.frameStart;
			}

			// apply the travel limit (yet again)
			if (this.pos < this.travelLimit) {
				this.pos = this.travelLimit;
			}
		}

		// the travel limit applies to one displacement update only - reset it
		this.travelLimit = this.frameEnd;

		// fire an Start/End of Stroke events, as appropriate
		const strokeEventLimit = this.frameLen / 50.0;
		const strokeEventHysteresis = strokeEventLimit * 2.0;
		if (this.fStrokeEventsArmed && this.pos + dx > this.frameStart - strokeEventLimit) {
			//this.plunger->FireVoidEventParm(DISPID_LimitEvents_BOS, fabsf(this.speed));
			this.fStrokeEventsArmed = false;

		} else if (this.fStrokeEventsArmed && this.pos + dx < this.frameEnd + strokeEventLimit) {
			//this.plunger->FireVoidEventParm(DISPID_LimitEvents_EOS, fabsf(this.speed));
			this.fStrokeEventsArmed = false;

		} else if (this.pos > this.frameEnd + strokeEventHysteresis && this.pos < this.frameStart - strokeEventHysteresis) {
			// away from the limits - arm the stroke events
			this.fStrokeEventsArmed = true;
		}

		// update the display
		this.setObjects(this.pos);
	}

	// tslint:disable-next-line:no-empty
	public updateVelocities(): void {
	}

	/**
	 * Returns mechanical plunger position 0 at rest, +1 pulled (fully extended)
	 */
	// public mechPlunger(): number {
	//
	// }

	// public pullBack(speed: number): void {
	//
	// }

	public fire(startPos: number): void {
		if (!startPos) {
			startPos = (this.pos - this.frameEnd) / (this.frameStart - this.frameEnd);
		}
	}

	private setObjects(len: number): void {
		this.linesegBase = new LineSeg(new Vertex2D(this.x, this.y), new Vertex2D(this.x2, this.y));
		this.jointBase = [
			new HitLineZ(new Vertex2D(this.x, this.y)),
			new HitLineZ(new Vertex2D(this.x2, this.y)),
		];
		this.linesegSide = [
			new LineSeg(new Vertex2D(this.x + 0.0001, len), new Vertex2D(this.x, this.y)),
			new LineSeg(new Vertex2D(this.x2, this.y), new Vertex2D(this.x2 + 0.000, len)),
		];
		this.linesegEnd = new LineSeg(new Vertex2D(this.x2, len), new Vertex2D(this.x, len));
		this.jointEnd = [
			new HitLineZ(new Vertex2D(this.x, len)),
			new HitLineZ(new Vertex2D(this.x2, len)),
		];
	}
}
