export const PHYSICS_STEPTIME = 1000;         // usecs to go between each physics update

export const PHYSICS_STEPTIME_S = (PHYSICS_STEPTIME * 1e-6);     // step time in seconds

export const DEFAULT_STEPTIME = 10000;     // default physics rate: 1000Hz
export const DEFAULT_STEPTIME_S = 0.01;      // default physics rate: 1000Hz

export const PHYS_FACTOR = (PHYSICS_STEPTIME_S / DEFAULT_STEPTIME_S);

export const DEFAULT_TABLE_GRAVITY = 0.97;
export const DEFAULT_TABLE_CONTACTFRICTION = 0.075;
export const DEFAULT_TABLE_SCATTERANGLE = 0.5;
export const DEFAULT_TABLE_ELASTICITY = 0.25;
export const DEFAULT_TABLE_ELASTICITY_FALLOFF = 0;
export const DEFAULT_TABLE_PFSCATTERANGLE = 0;
export const DEFAULT_TABLE_MIN_SLOPE = 6.0;
export const DEFAULT_TABLE_MAX_SLOPE = 6.0;

export const HIT_SHAPE_DETAIL_LEVEL = 7.0; // static detail level to approximate ramps and rubbers for the physics/collision code

export const MAX_REELS = 32;

/*
 * NOTE ABOUT VP PHYSICAL UNITS:
 *
 * By convention, one VP length unit (U) corresponds to
 *   1 U = .53975 mm = 5.3975E-4 m,   or   1 m = 1852.71 U
 *
 * For historical reasons, one VP time unit (T) corresponds to
 *   1 T = 10 ms = 0.01 s,            or   1 s = 100 T
 *
 * Therefore, Earth gravity in VP units can be computed as
 *   g  =  9.81 m/s^2  =  1.81751 U/T^2
 */

export const GRAVITYCONST = 1.81751;

// Collisions:
//
// test near zero conditions in linear, well behaved, conditions
export const C_PRECISION = 0.01;
// tolerance for line segment endpoint and point radii collisions
export const C_TOL_ENDPNTS = 0.0;
export const C_TOL_RADIUS = 0.005;
// Physical Skin ... postive contact layer. Any contact (collision) in this layer reports zero time.
// layer is used to calculate contact effects ... beyond this and objects pass through each other
// Default 25.0
export const PHYS_SKIN = 25.0; //!! seems like this mimics the radius of the ball -> replace with radius where possible?
// Layer outside object which increases it's size for contact measurements. Used to determine clearances.
// Setting this value during testing to 0.1 will insure clearance. After testing set the value to 0.005
// Default 0.01
export const PHYS_TOUCH = 0.05;
// Low Normal speed collison is handled as contact process rather than impulse collision
export const C_LOWNORMVEL = 0.0001;
export const C_CONTACTVEL = 0.099;

//export const NEW_PHYSICS

// low velocity stabilization ... if embedding occurs add some velocity
export const C_EMBEDVELLIMIT = 5;

// old workarounds, not needed anymore?!
export const C_EMBEDSHOT_PLANE = 0; // push pos up if ball embedded in plane
export const C_EMBEDDED = 0.0;
export const C_EMBEDSHOT = 0.05;
// Contact displacement corrections, hard ridgid contacts i.e. steel on hard plastic or hard wood
export const C_DISP_GAIN = 0.9875;
export const C_DISP_LIMIT = 5.0;
// Have special cases for balls that are determined static? (C_DYNAMIC is kind of a counter for detection) -> does not work stable enough anymore nowadays
//export const C_DYNAMIC 2
// choose only one of these two heuristics:
export const C_BALL_SPIN_HACK = 0; // original ball spin reduction code, based on automatic detection/heuristic of resting balls

//trigger/kicker boundary crossing hysterisis
export const STATICTIME = 0.005;
export const STATICCNTS = 10;

//Flippers:
export const C_INTERATIONS = 20; // Precision level and cycles for interative calculations // acceptable contact time ... near zero time

//Plumb:
export const VELOCITY_EPSILON = 0.05;	// The threshold for zero velocity.

export const JOYRANGEMN  = -65536;
export const JOYRANGEMX = 65536;
