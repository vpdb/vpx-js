# Rendering

VPX-JS abstracts the rendering layer and delegates it to a third party WebGL
framework. That means it doesn't come with a ready-to-use web application but 
only provides tools and APIs that make it easy to integrate.

The `IRenderApi` interface is the link between the framework and the VPX-JS
engine. It makes the following assumptions:

- A mesh consists of a bunch of vertices together with a set of indices.
- Meshes can be grouped together, and their transformation matrix is relative
  to its parent.
- The framework's materials are using physically-based rendering using the 
  Metallic-Roughness workflow.

VPX-JS ships with [three.js](https://threejs.org) and [Babylon.js](https://www.babylonjs.com/)
adapters. What you basically do is create your scene, instantiate the respective
adapter implementing `ÌRenderAPi` and use it to update the scene every frame.
