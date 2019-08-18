/**
 * Spinner, Gate, Flipper, Plunger and Ball
 */
import { Player } from '../game/player';

export interface MoverObject {

	updateDisplacements(dTime: number): void;

	updateVelocities(player: Player): void;
}
