# AUDIO

VPX-JS abstracts the audio layer and delegates it to a third party framework.
That means it doesn't come with a ready-to-use web application but
only provides tools and APIs that make it easy to integrate.

The `ISoundAdapter` interface is the link between the framework and the VPX-JS
engine. It makes the following assumptions:

- TODO
- TODO: Document how to load / preload the audio

VPX-JS ships with [howler.js](https://github.com/goldfire/howler.js) adapters.
