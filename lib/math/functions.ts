export function solveQuadraticEq(a: number, b: number, c: number): [number, number] | undefined {
	let discr = b * b - 4.0 * a * c;

	if (discr < 0) {
		return undefined;
	}

	discr = Math.sqrt(discr);

	const invA = (-0.5) / a;
	const sol1 = (b + discr) * invA;
	const sol2 = (b - discr) * invA;

	return [sol1, sol2];
}

export function clamp(x: number, min: number, max: number) {
	if (x < min) {
		return min;
	} else if (x > max) {
		return max;
	} else {
		return x;
	}
}
