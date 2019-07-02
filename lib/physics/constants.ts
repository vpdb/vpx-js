export const PHYSICS_STEPTIME = 1000;         // usecs to go between each physics update

export const PHYSICS_STEPTIME_S = (PHYSICS_STEPTIME * 1e-6);     // step time in seconds

export const DEFAULT_STEPTIME = 10000;      // default physics rate: 1000Hz
export const DEFAULT_STEPTIME_S = 0.01;       // default physics rate: 1000Hz

export const PHYS_FACTOR = (PHYSICS_STEPTIME_S / DEFAULT_STEPTIME_S);

export const DEFAULT_TABLE_GRAVITY = 0.97;
export const DEFAULT_TABLE_CONTACTFRICTION = 0.075;
export const DEFAULT_TABLE_SCATTERANGLE = 0.5;
export const DEFAULT_TABLE_ELASTICITY = 0.25;
export const DEFAULT_TABLE_ELASTICITY_FALLOFF = 0.;
export const DEFAULT_TABLE_PFSCATTERANGLE = 0.;
export const DEFAULT_TABLE_MIN_SLOPE = 6.0;
export const DEFAULT_TABLE_MAX_SLOPE = 6.0;

export const HIT_SHAPE_DETAIL_LEVEL = 7.0; // static detail level to approximate ramps and rubbers for the physics/collision code
