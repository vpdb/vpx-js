# Visual Pinball Playfield Export

VPDB can read the VPX/VPT file format and generate a 3D mesh including 
materials, textures and lights.

Using [three.js](https://threejs.org/), the mesh can be exported to a standard
format such as [GLTF](https://www.khronos.org/gltf/), where it then can be 
loaded into basically any 3D modeller, but more importantly, into the browser.

This allows VPDB's web application to visualize the entire model of an uploaded 
table in 3D!

## Import

First, VPDB needs to read the VPX/VPT table file, which is a binary format
using multiple structures on top of each other:

- The global structure is an [OLE Compound file](https://github.com/libyal/libolecf/blob/master/documentation/OLE%20Compound%20File%20format.asciidoc),
  used in old versions of Excel. It's organized in "storages", where every 
  storage can have multiple entries.
- Each entry is also binary data structured as *BIFF* (also used in Excel).
  Typically, all game items' parameters are linked to a BIFF tag of a given
  storage item.
  
VPDB parses the table file in a somewhat efficient way, i.e. it streams the 
storage items to a parser which updates the model without having to keep the
whole table file in memory or read data multiple times. For binary data such as 
textures we only save the file offset and data length and skip the actual data,
so parsing is relatively fast.

Once we have our internal representation of the data, we use the API of
three.js to create a full 3D model, from where we can do all kinds of neat
stuff, like export it to GLTF (or more precisely, to GLB, the binary version
of GLTF).

## Export

When exporting, textures are included in the exported files, but they are first
run through a PNG crusher and image optimizer, which cuts the size 
approximately in half. Textures are also streamed from the table file directly,
so it's the export which takes the most time to complete.

In order to furthermore reduce the size of the exported model, we apply 
Google's [Draco compression](https://github.com/google/draco), which gets the
geometry size down to under 10%.

In short, we're able to get a VPX file of 190M down to just over 12M. Average
size is under 10MB, varying from 1.7M (Robo-War) to 17M (TWD).

A Visual Pinball table consists of many different items. The exporter supports
all items that are visually rendered on the playfield:

### Surfaces

Surfaces, or walls, are made of 2D-surfaces with a given height. Materials
and textures can be applied to the top surface and the side surfaces 
separately.

### Flippers

Flippers contain two meshes, the flipper and the rubber. Both can be 
textured separately. Many parameters are customizable, such as the start-
and end radius and the thickness of the rubber.

### Bumpers

Visual Pinball comes with a standard bumper mesh which contains four separate
elements:

- a base
- the ring
- the skirt (or socket)
- the bumper cap

Materials and textures may be applied to all elements separately.

### Triggers

There are a few trigger meshes that Visual Pinball computes:

- three different wire triggers
- a "D" wire trigger (round)
- a trigger in star shape
- a trigger in button shape

### Lights

Apart adding light to the playfield, lights can also render a bulb. A bulb
consists of two meshes, the socket and the glass bulb containing the wire.
Both of them have their own material and texture.

### Kickers

Kicker holes can look quite sophisticated. There are a few types:

- two "cup" types
- two "hole" types
- a Williams kicker
- a Gottlieb kicker

### Gates

Gates come with a wire mesh and a bracket mesh. The bracket can be optionally 
hidden. There are a few types of gates:

- a "normal" and a rectangular wire gate
- a "normal" and a rectangular plate gate

### Spinners

Spinners are built out of a plate and a bracket, where the latter is optional.

### Ramps

There are two types of ramps: Wire ramps and solid ramps. Solid ramps are 
flat surfaces along a curve with optional left and right walls, while wire 
ramps can have one to four wires.

### Primitives

Primitives are 3D meshes imported from third-party modelers. They are usually
used for toys and non-standard objects, but there are tables that are entirely
modelled as primitives.

### Rubbers

Rubbers are splines rendered as 3D "tubes". They are always parallel to a given
surface, and come with an assigned material.

### Hit Targets

Visual Pinball provides several types of hit targets, namely:

- beveled drop targets
- simple and flat drop targets
- round and rectangular hit targets
- both of the above in slim and thick

### Other (non-visible)

There are other elements that we currently ignore, such as:

- Timers
- Plungers
- Textboxes
- Decals
- Light Centers
- Drag Point
- Collections
- Disp Reels
- Light Sequences
- Flasher
- Counts
