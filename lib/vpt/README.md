# Table Elements

This folder contains implementations of the playfield items. There are various
aspects to each item, such as data parsing, mesh generation, collision handling,
physical movement, animation, scripting, and state management. 

The original Visual Pinball source code covers all those aspects in one single
class per item. Common code is found in parent classes which are extended by
each item.

Unlike C++, JavaScript doesn't support multiple inheritance. Additionally, we 
try to keep a class focused on one single thing, and keep it as small as 
possible. This results in a somewhat different structure than the original 
Visual Pinball source code:

- Every playfield item gets its own folder
- There is a *main class* which is referenced by rest of the library. This class 
  delegates most of its functionality to its *helper classes*.
- The helper classes are instantiated on-demand. For example, during a GLTF 
  export, no collision helpers will be created.
- No globals. If a class needs the player or the table object, it needs to be 
  passed through the constructor or even better to the method only.
  
## Main Class

The main class of a playfield item is the class interacting with the rest of the
library. They are named without any suffix, like `Flipper`, `Rubber` and `Ball`.
They all extend [`Item`](item.ts).

You can see what a given playfield item is used for by looking at its interfaces.

- `IRenderable<STATE>` is for table elements that are rendered on the playfield
- `IHittable` means the ball can collide with it
- `IMovable` indicates there is some physically-based movement
- `IAnimatable` indicates the item somehow animates
- `IPlayable` is implemented for logic during game play
- `IScriptable` means the item offers a VBScript API

The difference between `IMovable` and `IAnimatable` is subtle: While `IMovable` 
computes its state on the physics loop and thus has a somewhat real-world based
behavior, `IAnimatable`s are only updated once every frame.

## Helper Classes

Some helper classes are available for every table item, some only for a handful.
The following is a description of patterns and how they relate to the interfaces
defined above.

### Data Classes

These keep the properties of the `.vpx` file and know how to read them. They
are *usually* read-only, i.e. changes during gameplay are reflected elsewhere,
but there are some exceptions (which probably are worth refactoring).

Most other helpers rely on data classes to do their job, so they are referenced
a lot. All data classes except `BallData` (which isn't persisted) extend 
[`ItemData`](item-data.ts).

### States

States contain the *visible state* of a table element, i.e. changes that must be
taken into account by the renderer. They are relatively small, if it's a movable
element it contains the position, as well as visibility, material and textures,
which be changed during gameplay as well. They all extend 
[`ItemState`](item-state.ts).

States are updated directly in the physics loop or via the script API. A list of
states that have been changed since the last retrieval can be retrieved by the 
`Player` class.

Since the state changes in the worker thread and needs to be passed to the main
thread, the transfer object only contains the changed values of the state.

### APIs

Visual Pinball provides an API for both the editor and the VBScript engine to
interact with playfield elements. The goal of the API helpers is to provide an
instance that implements that API without being spoiled by internals. 

Playfield items with an API implement `IScriptable`. The returned API class
extends [`ItemApi`](item-api.ts).

### Mesh Generators

Mesh generators provide 3D meshes of the playfield item based on their 
parameters, i.e. their data. They are usually only used when the table is loaded
and the 3D model is created.

Mesh generators are called within the main class implementing `IRenderable`. 
Their interface isn't defined, but they usually return a left-handed version
of `IRenderable`'s `getMeshes()`.

### Hit Generators

Hit generators create the hit shapes that make the ball collide with the table
item. The generated shapes are a collection of generic hit objects like circle,
line, triangle or point.

The `IHittable` interface requires a `getHitShapes()` method, which a hit 
generator provides.

### Hits

Hits or hit objects are item-specific hit shapes. Contrarily to hit generators,
they provide an instance of their own type. It is however possible to mix both,
for example the spinner has both its own hit object for dealing with the moving
plate, as well as a hit generator for the socket.

### Movers

Movers are created within the hit object. They are the result of `IMovable` and 
do a few things:
 
- Calculate the item's transformation and velocity on each physics cycle
- Provide additional parameters to the hit object's collision calculations
- Read and update the state depending on the above
   
So movers sit deeply in the physics loop, but they can also interact with the
outside. For example, for moving a flipper, the flipper API would provide a
`RotateToEnd()` method which would set the solenoid state of the mover to
`true`, which results in building up the acceleration of the flipper through the
mover, which results in the flipper's `angle` state to change and hence the 
renderer applying a different rotation matrix on the object.
 
### Animations

Animation helpers are the "dumb" version of movers. They basically apply a 
static sequence of transformations which are computed only once per frame 
(although the "transformation" is usually just a state parameter changing).

Animation helpers are created by classes which implement `IAnimatable`.

### Updaters

Updaters receive a new state and apply it to the renderer. They usually update 
the object's transformation, as well as visibility, material and textures. 
Sometimes but rarely, they also update the mesh geometry.

In order to do that, they use a provided render adapter which applies the 
changes to the scene.
