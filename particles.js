import * as PIXI from "https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.mjs";

import Noise from "../every-noise/noise.js";
import Utils from "../js-utils/utils.js";
import Vector from "../js-utils/vector.js";

/**
 * A particle emitter
 *
 * @class ParticleEmitter
 *
 * @param {object} opts
 * @param {string} opts.type - "point", "circle", "box", "line"
 *
 * @param {number} opts.size - size of circle or box
 *
 * @param {number} opts.width - width of box
 * @param {number} opts.height - height of box
 *
 * @param {Vector} opts.center - center of emitter
 *
 * @param {Vector} opts.a - start of line
 * @param {Vector} opts.b - end of line
 *
 * @param {number} opts.particlesPerSecond - number of particles to spawn per second
 *
 * @param {object} opts.particleSettings - settings to pass to Particle constructor
 *
 */
class ParticleEmitter {
  constructor(opts) {
    opts = opts || {};
    this.type = opts.type ?? "point";

    this.size = new Vector(
      opts.width ?? opts.w ?? opts.size ?? 10,
      opts.height ?? opts.h ?? opts.size ?? 10
    );

    this.center = opts.center ?? new Vector(0, 0);
    this.a = opts.a;
    this.b = opts.b;
    if (this.a && this.b) {
      this.vec = this.b.clone().sub(this.a);
    }

    this.particlesPerSecond = opts.particlesPerSecond ?? 100;

    this.particleSettings = opts.particleSettings ?? opts.settings ?? {};

    this.dt = 0;
  }

  getPos() {
    if (this.type == "point") {
      return this.center;
    } else if (this.type == "circle") {
      let angle = Math.random() * Math.PI * 2;
      let r = (Math.random() * this.size.x) / 2;
      return this.center.clone().add(Math.cos(angle) * r, Math.sin(angle) * r);
    } else if (
      this.type == "box" ||
      this.type == "square" ||
      this.type == "rect"
    ) {
      let x = (Math.random() - 0.5) * this.size.x;
      let y = (Math.random() - 0.5) * this.size.y;
      return this.center.clone().add(x, y);
    } else if (this.type == "line") {
      let t = Math.random();
      return this.b.clone().sub(this.a).mult(t, t).add(this.a);
    }
  }
  update(dt) {
    // spawn new particles
    this.dt += dt;

    let count = Math.floor(this.particlesPerSecond * this.dt);
    if (count == 0) return;

    this.dt -= count / this.particlesPerSecond;

    for (let i = 0; i < count; i++) {
      let pos = this.getPos();
      this.particleSettings.x = pos.x;
      this.particleSettings.y = pos.y;
      this.spawn(this.particleSettings);
    }
  }
}

/**
 * A particle
 *
 * @class Particle
 *
 * @param {object} opts
 *
 * @param {number|function} opts.x - x position
 * @param {number|function} opts.y - y position
 *
 * @param {number|function} opts.vx - x velocity
 * @param {number|function} opts.vy - y velocity
 *
 * @param {number|function} opts.life - lifetime in seconds
 *
 * @param {number|function} opts.size - size of particle relative to max size (1.0 = max size)
 *
 * @param {number} opts.color - color of particle
 * @param {number} opts.alpha - alpha value of particle
 *
 * @param {boolean} opts.shouldShrink - should particle shrink over time
 * @param {boolean} opts.shouldDisappear - should particle disappear over time
 *
 * @param {boolean} opts.applyForces - should particle be affected by forces
 * @param {number} opts.drag - drag coefficient
 *
 * @param {function} opts.check - function to check if particle should be removed (return true to remove)
 */
class Particle extends PIXI.Sprite {
  static makeTexture(renderer, size, shape) {
    size = size ?? 1;
    const graphic = new PIXI.Graphics();
    graphic.beginFill(0xffffff);
    if (shape == "square" || shape == "rect") {
      graphic.drawRect(-size, -size, size * 2, size * 2);
    } else {
      graphic.drawCircle(0, 0, size);
    }
    graphic.endFill();
    let texture = renderer.generateTexture(graphic);
    return texture;
  }

  constructor(opts) {
    opts = opts || {};
    super(opts.texture);

    this.opts = opts;
    this._alive = true;
    this.life = 0;
    this.shouldShrink = opts.shouldShrink ?? false;
    this.shouldDisappear = opts.shouldDisappear ?? false;

    this.size = Utils.getNumber(opts.size, this, 1);
    this.scale.x = this.scale.y = this.size;

    this.lifetimeSeconds = Utils.getNumber(opts.life, this, 0);

    this.x = Utils.getNumber(opts.x, this, 0);
    this.y = Utils.getNumber(opts.y, this, 0);

    this.vx = Utils.getNumber(opts.vx, this, 0);
    this.vy = Utils.getNumber(opts.vy, this, 0);
    this.v = new Vector(this.vx, this.vy);

    this.tint = Utils.getNumber(opts.color ?? opts.tint, this, 0xffffff);

    this.applyForces = opts.applyForces ?? false;

    this.alpha = Utils.getNumber(opts.alpha, this, 1);

    this.check = opts.check;

    this.drag = opts.drag;
  }

  set color(c) {
    this.tint = c;
  }
  get color() {
    return this.tint;
  }

  get alive() {
    return this._alive;
  }
  set alive(value) {
    this._alive = value;
    this.alpha = value ? 1 : 0;
  }

  reset(settings) {
    for (let k of Object.keys(settings)) {
      particle[k] = settings[k];
    }
  }

  applyForce(force) {
    if (!this.applyForces) return;

    let value = force(this);
    if (value == undefined || value == null) return;
    this.v.add(value);
  }

  update(dt) {
    if (!this.alive) return;

    this.life += dt;
    if (this.lifetimeSeconds > 0 && this.life > this.lifetimeSeconds) {
      this.alive = false;
      return;
    }

    if (this.shouldShrink) {
      this.scale.x = this.scale.y =
        this.size * (1 - this.life / this.lifetimeSeconds);
    }
    if (this.shouldDisappear) {
      this.alpha = 1 - this.life / this.lifetimeSeconds;
    }
    if (this.drag != undefined) {
      this.v.x *= this.drag;
      this.v.y *= this.drag;
    }

    this.x += this.v.x * dt;
    this.y += this.v.y * dt;

    if (this.check && this.check(this)) {
      this.alive = false;
    }
  }
}

/**
 * A particle container
 *
 * @class ParticleContainer
 *
 * @param {object} opts
 * @param {number} opts.maxCount - maximum number of particles
 * @param {number} opts.maxSize - maximum size of particles
 * @param {string} opts.shape - shape of particles (circle or square)
 *
 * @param {PIXI.Renderer} opts.renderer - renderer to use for generating textures
 *
 */
class ParticleContainer extends PIXI.ParticleContainer {
  constructor(opts) {
    opts = opts || {};
    let maxParticleCount = opts.maxCount ?? 10000;
    super(
      maxParticleCount,
      {
        vertices: true,
        position: true,
        rotation: true,
        tint: true,
      },
      undefined,
      true
    );

    this.particleTexture =
      opts.texture ??
      Particle.makeTexture(
        opts.renderer,
        opts.maxSize ?? opts.size,
        opts.shape
      );

    this.emitters = [];
    if (opts.emitters) {
      for (let e of opts.emitters) {
        this.createEmitter(e);
      }
    }

    this.forces = [];
    if (opts.forces) {
      for (let f of opts.forces) {
        this.forces.push(f);
      }
    }
  }
  createEmitter(options) {
    let emitter = new ParticleEmitter(options);
    emitter.spawn = this.spawn.bind(this);
    this.emitters.push(emitter);
    return emitter;
  }
  spawn(opts) {
    opts = opts || {};
    let count = Utils.getNumber(opts.count, this);
    if (count == undefined) count = 1;
    for (let i = 0; i < count; i++) {
      this.createParticle(opts);
    }
  }
  createParticle(settings) {
    settings.texture = this.particleTexture;
    let particle = new Particle(settings);
    this.addChild(particle);
    return particle;
  }

  /**
   * function does the following:
   *
   * - updates all emitters
   * - updates all particles
   * - applies forces to all particles
   * - removes dead particles
   *
   * @param {*} dt
   */
  update(dt) {
    // go through all emitters and add new particles to the queue
    for (let emitter of this.emitters) {
      emitter.update(dt);
    }

    // update all living particles
    for (let i = this.children.length - 1; i >= 0; i--) {
      let particle = this.children[i];

      // if particle is dead, remove it
      if (!particle.alive) {
        this.children.splice(i, 1);
        continue;
      }
      particle.update(dt);

      // apply forces
      for (let force of this.forces) {
        particle.applyForce(force);
      }
    }
  }
}

export {
  ParticleContainer as Particles,
  Particle,
  ParticleEmitter,
  Utils,
  Noise,
  Vector,
  PIXI,
};
export default ParticleContainer;
