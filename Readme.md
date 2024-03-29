# Particles

A simple particle system for pixi.js.

## Features

- Particle emitters: Emit particles from a point, line, rectangle or circle
- Spawn with functions
- Particle life time
- Particle velocity
- Drag: apply drag to particle velocity
- Forces: apply forces to particles
- Particles can shrink or disappear over time

### Examples

#### Basic

- [simple ![simple](./images/simple.png)](https://flo-bit.github.io/pixi-particles/demos/basic/simple.html)
- [emitters ![simple emitters](./images/emitters.png)](https://flo-bit.github.io/pixi-particles/demos/basic/emitters.html)
- [moving emitters ![moving emitters](./images/moving-emitters.png)](https://flo-bit.github.io/pixi-particles/demos/basic/moving_emitters.html)

#### Effects

- [flowfield![flowfield](./images/flowfield.png)](https://flo-bit.github.io/pixi-particles/demos/effects/flowfield.html)
- [snow ![snow](./images/snow.png)](https://flo-bit.github.io/pixi-particles/demos/effects/snow.html)
- [rain ![rain](./images/rain.png)](https://flo-bit.github.io/pixi-particles/demos/effects/rain.html)

## Use

### import

```js
<script src="https://flo-bit.github.io/pixi-particles/particles.js"></script>
```

### Configuration

```js
let particles = new Particles({ renderer: pixiRenderer });
```

## License

MIT License, see LICENSE file.
