/**
 * Rubber has a coefficient of restitution which decreases with the impact velocity.
 * We use a heuristic model which decreases the COR according to a falloff parameter:
 * 0 = no falloff, 1 = half the COR at 1 m/s (18.53 speed units)
 *
 * @param elasticity
 * @param falloff
 * @param vel
 */
export function elasticityWithFalloff(elasticity: number, falloff: number, vel: number): number {
	if (falloff > 0) {
		return elasticity / (1.0 + falloff * Math.abs(vel) * (1.0 / 18.53));
	} else {
		return elasticity;
	}
}

export const HARD_SCATTER = 0.0;
