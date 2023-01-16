class ParticleEmitter {
  constructor(opts) {
    opts = opts || {};
    this.type = opts.type || "point";
    this.particlesPerSecond = opts.particlesPerSecond || 100;

    this.particleSettings = opts.particleSettings || particleSettings;
  }
  update(dt) {
    // spawn new particles
    this.particleSettings.count = this.particlesPerSecond * dt;
    for (let i = 0; i < this.particleSettings.count; i++) {
      this.add(this.particleSettings);
    }
  }
}

function makeTexture(opts) {
  let size = opts.particleSize || 10;
  const graphic = new PIXI.Graphics();
  graphic.beginFill(0xffffff);
  if (opts.squares) {
    graphic.drawRect(-size, -size, size * 2, size * 2);
  } else {
    graphic.drawCircle(0, 0, size);
  }
  graphic.endFill();
  let texture = opts.renderer.generateTexture(graphic);
  return texture;
}

class Particle extends PIXI.Sprite {
  constructor(opts) {
    opts = opts || {};
    super(opts.texture);

    this._alive = true;
    this.life = 0;
    this.shouldShrink = opts.shouldShrink || false;
    this.shouldDisappear = opts.shouldDisappear || false;

    this.size = Utils.getNumber(opts.size, this, 1);
    this.scale.x = this.scale.y = this.size;

    this.lifetimeSeconds = Utils.getNumber(opts.lifetime, this, 0);
    console.log(this.lifetimeSeconds);

    this.vx = Utils.getNumber(opts.vx, this, 0);
    this.vy = Utils.getNumber(opts.vy, this, 0);

    this.x = Utils.getNumber(opts.x, this, 0);
    this.y = Utils.getNumber(opts.y, this, 0);

    this.tint = Utils.getNumber(opts.color, this, 0xffffff);

    this.applyForces = opts.applyForces || true;

    this.alpha = Utils.getNumber(opts.alpha, this, 1);

    this.check = opts.check;
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
    let value = force(this);
    this.vx += value.x;
    this.vy += value.y;
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

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.check && this.check(this)) {
      this.alive = false;
    }
  }
}

class Particles extends PIXI.ParticleContainer {
  constructor(opts) {
    opts = opts || {};
    let maxParticleCount = opts.maxCount || 10000;
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
    this.createParticleOptions = {
      rendere: opts.renderer,
      texture: makeTexture(opts),
    };
    this.queue = [];
    this.rng = opts.random || Math.random;

    this.emitters = [];

    this.forces = [];
  }
  createEmitter(options) {
    let emitter = new ParticleEmitter(options);
    emitter.add = this.createParticle.bind(this);
    this.emitters.push(emitter);
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
    settings = Utils.merge(settings, this.createParticleOptions);
    let particle = new Particle(settings);
    this.addChild(particle);
    return particle;
  }
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

class Utils {
  static isDict(a) {
    return a != undefined && a.constructor == Object;
  }
  static isObject(a) {
    return Utils.isDict(a);
  }
  static isString(a) {
    return typeof a === "string" || a instanceof String;
  }
  static isNumber(a) {
    return typeof a === "number";
  }
  static isFunction(a) {
    return typeof a === "function";
  }
  static isArray(a) {
    return Array.isArray(a);
  }
  static isBool(a) {
    return typeof a === "boolean";
  }
  static isNull(a) {
    return a === null;
  }
  static isDefined(a) {
    return a !== undefined;
  }
  static firstDefined(...arr) {
    if (arr == undefined) return;

    for (let element of arr) {
      if (element != undefined) return element;
    }
  }
  static deepClone(a) {
    if (!Utils.isDict(a)) return a;

    let myClone = {};
    for (let k of Object.keys(a)) {
      myClone[k] = Utils.deepClone(a[k]);
    }
    return myClone;
  }

  // merge dictionaries a and b with priority to a
  static mergeTwoDicts(a, b) {
    if (b == undefined) return Utils.deepClone(a);
    if (a == undefined) return Utils.deepClone(b);

    let result = Utils.deepClone(a);
    for (let k of Object.keys(b)) {
      if (a[k] == undefined) {
        result[k] = Utils.deepClone(b[k]);
      } else if (Utils.isDict(a[k]) && Utils.isDict(b[k])) {
        result[k] = Utils.mergeTwoDicts(a[k], b[k]);
      }
    }
    return result;
  }

  static merge(...arr) {
    let result = arr[0];
    for (let i = 1; i < arr.length; i++) {
      result = Utils.mergeTwoDicts(result, arr[i]);
    }
    return result;
  }

  /**
   * get a number from a variable
   * if variable is a number, return it
   * if variable is a function, call it with settings and return the result
   * if variable is a dictionary, return a random number between min and max
   *
   * @param {*} obj
   * @param {*} settings
   * @returns
   */
  static getNumber(obj, settings, defaultVal) {
    if (obj == undefined) return defaultVal;

    if (Utils.isNumber(obj)) {
      return obj;
    }
    if (Utils.isFunction(obj)) {
      return obj(settings);
    }
    if (Utils.isDict(obj)) {
      if (Utils.isNumber(obj.min) && Utils.isNumber(obj.max)) {
        let rng = settings.rng || Math.random;
        return obj.min + rng() * (obj.max - obj.min);
      }
    }
  }
}
