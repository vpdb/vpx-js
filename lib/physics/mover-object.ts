/**
 * Spinner, Gate, Flipper, Plunger and Ball
 */
export interface MoverObject {
	updateDisplacements(dtime: number): void;
	updateVelocities(): void;
}
