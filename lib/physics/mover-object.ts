/**
 * Spinner, Gate, Flipper, Plunger and Ball
 */
import { Player } from '../game/player';

export interface MoverObject {
	updateDisplacements(dtime: number): void;
	updateVelocities(player: Player): void;
}
