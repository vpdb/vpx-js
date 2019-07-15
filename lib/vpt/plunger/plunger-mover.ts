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
import { logger } from '../../util/logger';
import { GameData } from '../game-data';
import { Plunger, PlungerConfig } from './plunger';
import { PlungerData } from './plunger-data';
import { PlungerState } from './plunger-state';

export class PlungerMover implements MoverObject {

	private readonly plungerData: PlungerData;
	private readonly player: Player;
	private readonly tableData: GameData;

	/**
	 * position of the on-screen plunger (left)
	 */
	private readonly x: number;

	/**
	 * position of the on-screen plunger (right)
	 */
	private readonly x2: number;

	/**
	 * position of the on-screen plunger (bottom)
	 */
	private y: number = 0;

	// boundaries for detecting collisions
	private readonly lineSegBase = new LineSeg(new Vertex2D(0, 0), new Vertex2D(0, 0), 0, 0);
	private readonly lineSegEnd = new LineSeg(new Vertex2D(0, 0), new Vertex2D(0, 0), 0, 0);
	private readonly lineSegSide: LineSeg[] = [
		new LineSeg(new Vertex2D(0, 0), new Vertex2D(0, 0), 0, 0),
		new LineSeg(new Vertex2D(0, 0), new Vertex2D(0, 0), 0, 0),
	];
	private readonly jointBase: HitLineZ[] = [
		new HitLineZ(new Vertex2D(0, 0)),
		new HitLineZ(new Vertex2D(0, 0)),
	];
	private readonly jointEnd: HitLineZ[] = [
		new HitLineZ(new Vertex2D(0, 0)),
		new HitLineZ(new Vertex2D(0, 0)),
	];

	/**
	 * Current rod position, in table distance units.
	 *
	 * This represents the location of the tip of the plunger.
	 */
	// tslint:disable-next-line:variable-name
	private _pos: number = 0;
	get pos() { return this._pos; }
	set pos(pos) {
		const lastPos = this._pos;
		this._pos = pos;
		this.changeState(lastPos);
	}

	/**
	 * current rod speed, in table distance units per second(?)
	 */
	private speed: number = 0.0;

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
	private mass: number = 30.0;

	/**
	 * Pull force.  This models the force being applied by the player
	 * when pulling back the plunger via the keyboard interface.  When
	 * this is non-zero, we ignore the mechanical plunger position and
	 * instead move under this force.
	 */
	private pullForce: number = 0.0;

	/**
	 * Reverse impulse.  This models the little bit of force applied
	 * to the plunger when a moving ball hits it.  Most of our
	 * collisions involve a moving plunger hitting a stationary ball,
	 * so we transfer momentum from the plunger to the ball.  But
	 * this works both ways; if a stationary plunger is hit by a
	 * moving ball, it gets a little bump.  This isn't a huge effect
	 * but it's a nice bit of added realism.
	 */
	private reverseImpulse: number = 0.0;

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
	 * During a Fire event, the simulated plunger is completely
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
	private readonly restPos: number;

	/**
	 * maximum retracted position, in absolute table coordinates
	 */
	private readonly frameStart: number;

	/**
	 * maximum forward position, in absolute table coordinates
	 */
	private readonly frameEnd: number;

	/**
	 * frame length
	 */
	private readonly frameLen: number;

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

	constructor(plungerConfig: PlungerConfig, plungerData: PlungerData, player: Player, tableData: GameData) {

		this.plungerData = plungerData;
		this.player = player;
		this.tableData = tableData;

		this.x = plungerConfig.x;
		this.x2 = plungerConfig.x2;
		this.frameEnd = plungerConfig.frameTop;
		this.frameStart = plungerConfig.frameBottom;
		this.frameLen = plungerConfig.frameBottom - plungerConfig.frameTop;
		this.travelLimit = plungerConfig.frameTop;
		this.scatterVelocity = plungerData.scatterVelocity;

		// The rest position is taken from the "park position" property
		const restPos = plungerData.parkPosition;

		// start at the rest position
		this.restPos = restPos;
		this.pos = plungerConfig.frameTop + (restPos * this.frameLen);

		this.lineSegBase.setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.lineSegSide[0].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.lineSegSide[1].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.lineSegEnd.setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);

		this.jointBase[0].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.jointBase[1].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.jointEnd[0].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);
		this.jointEnd[1].setZ(plungerConfig.zHeight, plungerConfig.zHeight + Plunger.PLUNGER_HEIGHT);

		this.setObjects(this.pos);
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
			logger().info('[%s] Pulled back.', this.plungerData.getName());
			//this.plunger->FireVoidEventParm(DISPID_LimitEvents_BOS, fabsf(this.speed));
			this.fStrokeEventsArmed = false;

		} else if (this.fStrokeEventsArmed && this.pos + dx < this.frameEnd + strokeEventLimit) {
			logger().info('[%s] Fired.', this.plungerData.getName());
			//this.plunger->FireVoidEventParm(DISPID_LimitEvents_EOS, fabsf(this.speed));
			this.fStrokeEventsArmed = false;

		} else if (this.pos > this.frameEnd + strokeEventHysteresis && this.pos < this.frameStart - strokeEventHysteresis) {
			// away from the limits - arm the stroke events
			this.fStrokeEventsArmed = true;
		}

		// update the display
		this.setObjects(this.pos);
	}

	public updateVelocities(): void {

		// figure our current position in relative coordinates (0.0-1.0,
		// where 0.0 is the maximum forward position and 1.0 is the
		// maximum retracted position)
		const pos = (this.pos - this.frameEnd) / this.frameLen;

		// If "mech plunger" is enabled, read the mechanical plunger
		// position; otherwise treat it as fixed at 0.
		const mech = 0.0;

		// calculate the delta from the last reading
		const dMech = this.mech0 - mech;

		// Frame-to-frame mech movement threshold for detecting a release
		// motion.  1.0 is the full range of travel, which corresponds
		// to about 3" on a standard pinball plunger.  We want to choose
		// the value here so that it's faster than the player is likely
		// to move the plunger manually, but slower than the plunger
		// typically moves under spring power when released.  It appears
		// from observation that a real plunger moves at something on the
		// order of 3 m/s.  Figure the fastest USB update interval will
		// be 10ms, typical is probably 25ms, and slowest is maybe 40ms;
		// and figure the bracket speed range down to about 1 m/s.  This
		// gives us a distance per USB interval of from 25mm to 100mm.
		// 25mm translates to .32 of our distance units (0.0-1.0 scale).
		// The lower we make this, the more sensitive we'll be at
		// detecting releases, but if we make it too low we might mistake
		// manual movements for releases.  In practice, it seems safe to
		// lower it to about 0.2 - this doesn't seem to cause false
		// positives and seems reliable at identifying actual releases.
		const ReleaseThreshold = 0.2;

		// note if we're acting as an auto plunger
		const autoPlunger = this.plungerData.autoPlunger;

		// check which forces are acting on us
		if (this.fireTimer > 0) {

			// Fire mode.  In this mode, we're moving freely under the spring
			// forces at the speed we calculated when we initiated the release.
			// Simply leave the speed unchanged.
			//
			// Decrement the release mode timer.  The mode ends after the
			// timeout elapses, even if the mech plunger hasn't actually
			// come to rest.  This ensures that we don't get stuck in this
			// mode, and also allows us to sync up again with the real
			// plunger after a respectable pause if the user is just
			// moving it around a lot.
			this.speed = this.fireSpeed;
			--this.fireTimer;

		} else if (this.autoFireTimer > 0) {
			// The Auto Fire timer is running.  We start this timer when we
			// send a synthetic KeyDown(Return) event to the script to simulate
			// a Launch Ball event when the user pulls back and releases the
			// mechanical plunger and we're operating as an auto plunger.
			// When the timer reaches zero, we'll send the corresponding
			// KeyUp event and cancel the timer.
			if (--this.autoFireTimer === 0) {
				if (this.player) {
					//g_pplayer->this.ptable->FireKeyEvent(DISPID_GameEvents_KeyUp, g_pplayer->this.rgKeys[ePlungerKey]);
				}
			}

		} else if (autoPlunger && dMech > ReleaseThreshold) {
			// Release motion detected in Auto Plunger mode.
			//
			// If we're acting as an auto plunger, and the player performs
			// a pull-and-release motion on the mechanical plunger, simulate
			// a Launch Ball event.
			//
			// An Auto Plunger simulates a solenoid-driven ball launcher
			// on a table like Medieval Madness.  On this type of game,
			// the original machine doesn't have a spring-loaded plunger.
			// for the user to operate manually.  The user-operated control
			// is instead a button of some kind (the physical form varies
			// quite a bit, from big round pushbuttons to gun triggers to
			// levers to rotating knobs, but they all amount to momentary
			// on/off switches in different guises).  But on virtual
			// cabinets, the mechanical plunger doesn't just magically
			// disappear when you load Medieval Madness!  So the idea here
			// is that we can use a mech plunger to simulate a button.
			// It's pretty simple and natural: you just perform the normal
			// action that you're accustomed to doing with a plunger,
			// namely pulling it back and letting it go.  The software
			// observes this gesture, and rather than trying to simulate
			// the motion directly on the software plunger, we simply
			// turn it into a synthetic Launch Ball keyboard event.  This
			// amounts to sending a KeyDown(Return) message to the script,
			// followed a short time later by a KeyUp(Return).  The script
			// will then act exactly like it would if the user had actually
			// pressed the Return key (or, equivalently on a cabinet, the
			// Launch Ball button).

			// Send a KeyDown(Return) to the table script.  This
			// will allow the script to set ROM switch levels or
			// perform any other tasks it normally does when the
			// actual Launch Ball button is pressed.
			if (this.player) {
				//g_pplayer->this.ptable->FireKeyEvent(DISPID_GameEvents_KeyDown, g_pplayer->this.rgKeys[ePlungerKey]);
			}

			// start the timer to send the corresponding KeyUp in 100ms
			this.autoFireTimer = 101;

		} else if (this.pullForce !== 0.0) {
			// A "pull" force is in effect.  This is a *simulated* pull, so
			// it overrides the real physical plunger position.
			//
			// Simply update the model speed by applying the accleration
			// due to the pull force.
			//
			// Force = mass*acceleration -> a = F/m.  Increase the speed
			// by the acceleration.  Technically we're calculating dv = a dt,
			// but we can elide the elapsed time factor because it's
			// effectively a constant that's implicitly folded into the
			// pull force value.
			this.speed += this.pullForce / this.mass;

			// if we're already at the maximum retracted position, stop
			if (this.pos >= this.frameStart) {
				this.speed = 0.0;
			}

		} else if (dMech > ReleaseThreshold) {
			// Normal mode, fast forward motion detected.  Consider this
			// to be a release event.
			//
			// The release motion of a physical plunger is much faster
			// than our sampling rate can keep up with, so we can't just
			// use the joystick readings directly.  The problem is that a
			// real plunger can shoot all the way forward, bounce all the
			// way back, and shoot forward again in the time between two
			// consecutive samples.  A real plunger moves at around 3-5m/s,
			// which translates to 3-5mm/ms, or 30-50mm per 10ms sampling
			// period.  The whole plunger travel distance is ~65mm.
			// So in one reading, we can travel almost the whole range!
			// This means that samples are effectively random during a
			// release motion.  We might happen to get lucky and have
			// our sample timing align perfectly with a release, so that
			// we get one reading at the retracted position just before
			// a release and the very next reading at the full forward
			// position.  Or we might get unlikely and catch one reading
			// halfway down the initial initial lunge and the next reading
			// at the very apex of the bounce back - and if we took those
			// two readings at face value, we'd be fooled into thinking
			// the plunger was stationary at the halfway point!
			//
			// But there's hope.  A real plunger's barrel spring is pretty
			// inelastic, so the rebounds after a release damp out quickly.
			// Observationally, each bounce bounces back to less than half
			// of the previous one.  So even with the worst-case aliasing,
			// we can be confident that we'll see a declining trend in the
			// samples during a release-bounce-bounce-bounce sequence.
			//
			// Our detection strategy is simply to consider any rapid
			// forward motion to be a release.  If we see the plunger move
			// forward by more than the threshold distance, we'll consider
			// it a release.  See the comments above for how we chose the
			// threshold value.

			// Go back through the recent history to find the apex of the
			// release.  Our "threshold" calculation is basically attempting
			// to measure the instantaneous speed of the plunger as the
			// difference in position divided by the time interval.  But
			// the time interval is extremely imprecise, because joystick
			// reports aren't synchronized to our clock.  In practice the
			// time between USB reports is in the 10-30ms range, which gives
			// us a considerable range of error in calculating an instantaneous
			// speed.
			//
			// So instead of relying on the instantaneous speed alone, now
			// that we're pretty sure a release motion is under way, go back
			// through our recent history to find out where it really
			// started.  Scan the history for monotonically ascending values,
			// and take the highest one we find.  That's probably where the
			// user actually released the plunger.
			let apex = this.mech0;
			if (this.mech1 > apex) {
				apex = this.mech1;
				if (this.mech2 > apex) {
					apex = this.mech2;
				}
			}

			// trigger a release from the apex position
			this.fire(apex);

		} else {
			// Normal mode, and NOT firing the plunger.  In this mode, we
			// simply want to make the on-screen plunger sync up with the
			// position of the physical plunger.
			//
			// This isn't as simple as just setting the software plunger's
			// position to magically match that of the physical plunger.  If
			// we did that, we'd break the simulation by making the software
			// plunger move at infinite speed.  This wouldn't rip the fabric
			// of space-time or anything that dire, but it *would* prevent
			// the collision detection code from working properly.
			//
			// So instead, sync up the positions by setting the software
			// plunger in motion on a course for syncing up with the
			// physical plunger, as fast as we can while maintaining a
			// realistic speed in the simulation.

			// for a normal plunger, sync to the mech plunger; otherwise
			// just go to the rest position
			const target = autoPlunger ? this.restPos : mech;

			// figure the current difference in positions
			const error = target - pos;

			// Model the software plunger as though it were connected to the
			// mechanical plunger by a spring with spring constant 'mech
			// strength'.  The force from a stretched spring is -kx (spring
			// constant times displacement); in this case, the displacement
			// is the distance between the physical and virtual plunger tip
			// positions ('error').  The force from an acceleration is ma,
			// so the acceleration from the spring force is -kx/m.  Apply
			// this acceleration to the current plunger speed.  While we're
			// at it, apply some damping to the current speed to simulate
			// friction.
			//
			// The 'normalize' factor is the table's normalization constant
			// divided by 1300, for historical reasons.  Old versions applied
			// a 1/13 adjustment factor, which appears to have been empirically
			// chosen to get the speed in the right range.  The this.plungerNormalize
			// factor has default value 100 in this version, so we need to
			// divide it by 100 to get a multipler value.
			//
			// The 'dt' factor represents the amount of time that we're applying
			// this acceleration.  This is in "VP 9 physics frame" units, where
			// 1.0 equals the amount of real time in one VP 9 physics frame.
			// The other normalization factors were originally chosen for VP 9
			// timing, so we need to adjust for the new VP 10 time base.  VP 10
			// runs physics frames at roughly 10x the rate of VP 9, so the time
			// per frame is about 1/10 the VP 9 time.
			const plungerFriction = 0.9;
			const normalize = this.tableData.plungerNormalize / 13.0 / 100.0;
			const dt = 0.1;
			this.speed *= plungerFriction;
			this.speed += error * this.frameLen * this.plungerData.mechStrength / this.mass * normalize * dt;

			// add any reverse impulse to the result
			this.speed += this.reverseImpulse;
		}

		// cancel any reverse impulse
		this.reverseImpulse = 0.0;

		// Shift the current mech reading into the history list, if it's
		// different from the last reading.  Only keep distinct readings;
		// the physics loop tends to run faster than the USB reporting
		// rate, so we might see the same USB report several times here.
		if (mech !== this.mech0) {
			this.mech2 = this.mech1;
			this.mech1 = this.mech0;
			this.mech0 = mech;
		}
	}

	public pullBack(speed: number): void {
		// start the pull by applying the artificial "pull force"
		this.speed = 0.0;
		this.pullForce = speed;
	}

	public fire(startPos: number = 0): void {
		if (!startPos) {
			startPos = (this.pos - this.frameEnd) / (this.frameStart - this.frameEnd);
		}

		// cancel any pull force
		this.pullForce = 0.0;

		// make sure the starting point is behind the park positionDirty God 1080p
		if (startPos < this.restPos) {
			startPos = this.restPos;
		}

		// move immediately to the starting position
		this.pos = this.frameEnd + (startPos * this.frameLen);

		// Figure the release speed as a fraction of the
		// fire speed property, linearly proportional to the
		// starting distance.  Note that the release motion
		// is upwards, so the speed is negative.
		const dx = startPos - this.restPos;
		const normalize = this.tableData.plungerNormalize / 13.0 / 100.0;
		this.fireSpeed = -this.plungerData.speedFire * dx * this.frameLen / this.mass * normalize;

		// Figure the target stopping position for the
		// bounce off of the barrel spring.  Treat this
		// as proportional to the pull distance, but max
		// out (i.e., go all the way to the forward travel
		// limit, position 0.0) if the pull position is
		// more than about halfway.
		const maxPull = .5;
		const bounceDist = (dx < maxPull ? dx / maxPull : 1.0);

		// the initial bounce will be negative, since we're moving upwards,
		// and we calculated it as a fraction of the forward travel distance
		// (which is the part between 0 and the rest position)
		this.fireBounce = -bounceDist * this.restPos;

		// enter Fire mode for long enough for the process to complete
		this.fireTimer = 200;
	}

	private setObjects(len: number): void {
		this.lineSegBase.setSeg(this.x, this.y, this.x2, this.y);
		this.jointBase[0].set(this.x, this.y);
		this.jointBase[1].set(this.x2, this.y);
		this.lineSegSide[0].setSeg(this.x + 0.0001, len, this.x, this.y);
		this.lineSegSide[1].setSeg(this.x2, this.y, this.x2 + 0.0001, len);
		this.lineSegEnd.setSeg(this.x2, len, this.x, len);
		this.jointEnd[0].set(this.x, len);
		this.jointEnd[1].set(this.x2, len);
	}

	private changeState(lastPos?: number) {
		if (!isNaN(this.pos) && (typeof lastPos === 'undefined' || lastPos !== this.pos)) {

			this.player.changeState(this.plungerData.getName(), this.getState());
		}
	}

	public getState(): PlungerState {
		return new PlungerState(this.pos - this.frameStart);
	}
}
