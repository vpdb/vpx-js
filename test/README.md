# Tests

Most of the code is covered in unit tests. You can check the latest run [here](https://travis-ci.org/vpdb/vpx-js)
and the coverage [here](https://codecov.io/gh/vpdb/vpx-js).

There are different types of tests.

## Mesh Generation 

Mesh generation tests make sure that the objects rendered to the screen are the
same as those from Visual Pinball. What we do here is export every type of
playfield element as OBJ in Visual Pinball, and verify that the vertices in the
OBJ are the same than in VPX-JS'es scene.

We also change a few parameters and add transformations so test if they are
correctly applied.

For the textures, we feed multiple formats into VPX and compare the exported 
result using [looks-same](https://github.com/gemini-testing/looks-same).

What's currently not tested are:

- Vertex indices
- Texture UVs
- Materials

Those are all easily verifiable by looking at the result though. Materials are
still being tweaked because they obviously depend on the engine and the shaders.
We're currently using the metalness/shininess model which seems to work well.

## Collision

For every table element that is collidable we take the test tables used in the
mesh generation and shoot a ball at it. We do that in the browser and in Visual
Pinball with the same parameters. Then we visually compare the two results and
if they look the same, we add a unit test that asserts the ball position at key
moments in time.

For example, when colliding with a horizontal wall, we first assert that the ball
is moving downwards passing a given position, and at some later point *above* the 
same position, due to the bounce off.

## Movement

Elements that include some kind of motion like flippers, spinners or plungers
are tested if the movement is correctly applied. VPX-JS has a `State` object
for all movable elements, so what's tested is if the state is correct (the actual
visualization is tested manually).

Some elements like flippers can be explicitly moved (set the solenoid to on and
watch the state change), others need to be externally triggered (e.g. a spinner
won't move alone).

The approach is similar to the collision one: Run it in the browser, visually 
check if it looks okay, and write a test that asserts the state of the element
for multiple points in time.
