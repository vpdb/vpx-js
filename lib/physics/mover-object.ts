/**
 * Spinner, Gate, Flipper, Plunger and Ball
 */
export interface MoverObject {
	addToList(): boolean;
	updateDisplacements(dtime: number): void;
	updateVelocities(): void;
}
