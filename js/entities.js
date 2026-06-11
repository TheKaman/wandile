// WANDILE — player, enemies, bosses, pickups, projectiles, particles
// Coordinates: x = world position, y = depth lane (screen y of feet), z = height above ground.

var FOOD = { fritter: 25, maheu: 50, nshima: 999 };

var ATTACKS = {
  punch1: { dur: 0.24, hit: 0.09, range: 20, dmg: 6,  pose: 'punch1', next: 'punch2', meter: 7 },
  punch2: { dur: 0.24, hit: 0.09, range: 20, dmg: 7,  pose: 'punch2', next: 'punch3', meter: 7 },
  punch3: { dur: 0.32, hit: 0.11, range: 23, dmg: 11, pose: 'punch3', knockdown: true, meter: 10 },
  kick:   { dur: 0.38, hit: 0.16, range: 27, dmg: 13, pose: 'kick',   knockdown: true, meter: 10 },
  stick:  { dur: 0.30, hit: 0.12, range: 33, dmg: 15, pose: 'punch3', knockdown: true, meter: 8, weapon: true },
  lid:    { dur: 0.26, hit: 0.10, range: 21, dmg: 11, pose: 'punch1', knockdown: true, meter: 8, weapon: true },
};

function inMeleeRange(a, b, range) {
  var dx = (b.x - a.x) * a.facing;
  return dx > -6 && dx < range &&
    Math.abs(b.y - a.y) <= CFG.DEPTH_TOL &&
    Math.abs((b.z || 0) - (a.z || 0)) < 26;
}

// ================================================================== Player
function Player(x, y) {
  this.x = x; this.y = y; this.z = 0; this.vz = 0;
  this.facing = 1;
  this.maxHp = 100; this.hp = 100;
  this.meter = 0;
  this.state = 'idle'; this.stateT = 0; this.t = 0;
  this.invuln = 0; this.kx = 0; this.flashT = 0;
  this.atk = null; this.didHit = false; this.queued = false;
  this.weapon = null; this.weaponUses = 0;
  this.airHit = {};
}

Player.prototype = {
  SPEED_X: 84, SPEED_Y: 58,

  update: function (dt, world) {
    this.t += dt;
    this.stateT += dt;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.flashT > 0) this.flashT -= dt;

    // knockback drift while hurt/down
    if (this.kx) {
      this.x += this.kx * dt;
      this.kx *= Math.pow(0.02, dt);
      if (Math.abs(this.kx) < 4) this.kx = 0;
    }

    switch (this.state) {
      case 'idle':
      case 'walk':
        this.move(dt, world, 1);
        this.checkActions(world);
        break;

      case 'attack':
        if (!this.didHit && this.stateT >= this.atk.hit) {
          this.didHit = true;
          if (this.atk.throwBall) {
            world.projectiles.push(new Projectile('ball', this.x + this.facing * 8, this.y, 12, this.facing * 220, 18, true));
            AudioSys.sfx('throw');
            this.weapon = null;
          } else {
            this.strike(world, this.atk);
          }
        }
        if (this.didHit && this.atk.next && Input.pressed('punch')) this.queued = true;
        if (this.stateT >= this.atk.dur) {
          if (this.queued) this.startAttack(this.atk.next);
          else { this.state = 'idle'; this.atk = null; }
        }
        break;

      case 'jump':
        this.move(dt, world, 0.6);
        this.z += this.vz * dt;
        this.vz -= CFG.GRAV * dt;
        if (Input.pressed('punch') || Input.pressed('kick')) {
          this.state = 'jumpkick';
          this.airHit = {};
          AudioSys.sfx('swish');
        }
        if (this.z <= 0) { this.z = 0; this.vz = 0; this.state = 'idle'; }
        break;

      case 'jumpkick':
        this.move(dt, world, 0.6);
        this.z += this.vz * dt;
        this.vz -= CFG.GRAV * dt;
        this.strikeAir(world);
        if (this.z <= 0) { this.z = 0; this.vz = 0; this.state = 'idle'; }
        break;

      case 'special':                            // Eagle Strike — call the fish eagle
        if (!this.didHit && this.stateT >= 0.12) {
          this.didHit = true;
          world.projectiles.push(new Eagle(this.facing, world));
          AudioSys.sfx('screech');
        }
        if (this.stateT >= 0.55) this.state = 'idle';
        break;

      case 'hurt':
        if (this.stateT >= 0.32) this.state = 'idle';
        break;

      case 'down':
        if (this.hp <= 0) break;       // stays down — main.js handles game over
        if (this.stateT >= 0.85) { this.state = 'idle'; this.invuln = 1.0; }
        break;
    }

    // collect pickups while grounded and mobile
    if ((this.state === 'idle' || this.state === 'walk') && this.z === 0) {
      this.collect(world);
    }
  },

  move: function (dt, world, mul) {
    var dx = (Input.held('right') ? 1 : 0) - (Input.held('left') ? 1 : 0);
    var dy = (Input.held('down') ? 1 : 0) - (Input.held('up') ? 1 : 0);
    if (dx) this.facing = dx;
    this.x += dx * this.SPEED_X * mul * dt;
    this.y += dy * this.SPEED_Y * mul * dt;
    this.y = clamp(this.y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
    this.x = clamp(this.x, world.minX + 8, world.maxX - 8);
    if (this.state === 'idle' || this.state === 'walk') {
      this.state = (dx || dy) ? 'walk' : 'idle';
    }
  },

  checkActions: function (world) {
    if (Input.pressed('punch')) {
      if (this.weapon === 'ball') {
        this.startAttack(null, { dur: 0.3, hit: 0.12, pose: 'throw', throwBall: true });
      } else if (this.weapon && ATTACKS[this.weapon]) {
        this.startAttack(this.weapon);
      } else {
        this.startAttack('punch1');
      }
    } else if (Input.pressed('kick')) {
      this.startAttack('kick');
    } else if (Input.pressed('jump')) {
      this.state = 'jump'; this.stateT = 0;
      this.vz = 215;
      AudioSys.sfx('jump');
    } else if (Input.pressed('special') && this.meter >= 50) {
      this.state = 'special'; this.stateT = 0; this.didHit = false;
      this.meter -= 50;
      this.invuln = 1.0;
    }
  },

  startAttack: function (name, custom) {
    this.atk = custom || ATTACKS[name];
    this.state = 'attack'; this.stateT = 0;
    this.didHit = false; this.queued = false;
  },

  strike: function (world, atk) {
    var hits = 0, self = this;
    world.enemies.forEach(function (e) {
      if (e.canBeHit() && inMeleeRange(self, e, atk.range)) {
        e.takeHit(atk.dmg, self, atk.knockdown, world);
        hits++;
      }
    });
    world.crates.forEach(function (cr) {
      if (!cr.broken && Math.abs(cr.y - self.y) <= CFG.DEPTH_TOL + 4) {
        var dx = (cr.x - self.x) * self.facing;
        if (dx > -6 && dx < atk.range + 4) { cr.smash(world); hits++; }
      }
    });
    if (hits) {
      this.meter = clamp(this.meter + (atk.meter || 7), 0, 100);
      if (atk.weapon) {
        this.weaponUses--;
        if (this.weaponUses <= 0) this.weapon = null;
      }
      world.hitstop = Math.max(world.hitstop || 0, atk.knockdown ? 0.07 : 0.04);
      AudioSys.sfx(atk.knockdown ? 'kickhit' : 'hit');
    } else {
      AudioSys.sfx('swish');
    }
  },

  strikeAir: function (world) {
    var self = this;
    world.enemies.forEach(function (e) {
      if (!self.airHit[e.id] && e.canBeHit() && inMeleeRange(self, e, 24)) {
        self.airHit[e.id] = true;
        e.takeHit(14, self, true, world);
        self.meter = clamp(self.meter + 8, 0, 100);
        world.hitstop = Math.max(world.hitstop || 0, 0.06);
        AudioSys.sfx('kickhit');
      }
    });
  },

  takeHit: function (dmg, fromX, knockdown, world) {
    if (this.invuln > 0 || this.state === 'special' || this.state === 'down') return;
    if (this.weapon === 'lid') dmg = Math.ceil(dmg / 2);
    this.hp -= dmg;
    this.flashT = 0.14;
    if (knockdown) world.shake = Math.max(world.shake || 0, 0.15);
    this.facing = fromX > this.x ? 1 : -1;
    this.kx = -this.facing * 80;
    world.particles.push(new Particle('spark', this.x, this.y - 20 - this.z, 0, -20, 0.25));
    AudioSys.sfx('hurt');
    this.z = 0; this.vz = 0;
    if (this.hp <= 0) {
      this.hp = 0;
      this.state = 'down'; this.stateT = 0;
    } else {
      this.state = knockdown ? 'down' : 'hurt';
      this.stateT = 0;
      this.invuln = knockdown ? 1.2 : 0.6;
    }
  },

  collect: function (world) {
    for (var i = world.pickups.length - 1; i >= 0; i--) {
      var p = world.pickups[i];
      if (Math.abs(p.x - this.x) < 11 && Math.abs(p.y - this.y) < 10) {
        if (FOOD[p.kind] !== undefined) {
          this.hp = clamp(this.hp + FOOD[p.kind], 0, this.maxHp);
          world.addScore(50, p.x, p.y);
          AudioSys.sfx('eat');
          world.pickups.splice(i, 1);
        } else if (p.kind !== this.weapon) {
          if (this.weapon) {                      // swap: set the old weapon down behind
            world.pickups.push(new Pickup(this.weapon, this.x - this.facing * 18, this.y));
          }
          this.weapon = p.kind;
          this.weaponUses = p.kind === 'stick' ? 4 : p.kind === 'lid' ? 6 : 1;
          AudioSys.sfx('pickup');
          world.pickups.splice(i, 1);
        }
      }
    }
  },

  pose: function () {
    if (this.victoryMode) return 'victory';
    switch (this.state) {
      case 'walk': return 'walk';
      case 'attack': return this.atk.pose;
      case 'jump': return 'jump';
      case 'jumpkick': return 'jumpkick';
      case 'special': return 'summon';
      case 'hurt': return 'hurt';
      case 'down': return 'down';
      default: return 'idle';
    }
  },

  draw: function (ctx, camX) {
    var sx = this.x - camX;
    Sprites.drawShadow(ctx, sx, this.y, 16);
    if (this.invuln > 0 && this.state !== 'down' && Math.floor(this.t * 18) % 2) return; // blink
    Sprites.drawFighter(ctx, {
      x: sx, y: this.y - this.z,
      facing: this.facing, pose: this.pose(),
      t: this.state === 'walk' || this.state === 'special' ? this.stateT : this.t,
      c: Sprites.WANDILE,
      flash: this.flashT > 0,
      weapon: this.weapon,
    });
  },
};

// ================================================================== Enemies
var ENEMY_TYPES = {
  rusher:  { hp: 30, speed: 56, dmg: 6,  range: 18, atkDur: 0.5,  hitT: 0.28, cool: [0.9, 1.8], pose: 'punch1', score: 100 },
  kicker:  { hp: 48, speed: 40, dmg: 10, range: 24, atkDur: 0.65, hitT: 0.34, cool: [1.3, 2.4], pose: 'kick', knockdown: true, score: 150 },
  thrower: { hp: 26, speed: 50, dmg: 7,  ranged: true, far: 115, atkDur: 0.5, hitT: 0.22, cool: [1.8, 2.8], pose: 'throw', score: 120 },
};

var GOON_SHIRTS = {
  rusher:  ['#7b52b8', '#5f6670', '#c2742d', '#2f8f9d'],
  kicker:  ['#2e6e4e', '#8a3636', '#5b3a8c', '#27556e'],
  thrower: ['#b3924f', '#3e7d8c', '#704a32', '#7d4a7a'],
};

var nextEnemyId = 1;

function Enemy(type, x, y, stage) {
  var T = ENEMY_TYPES[type];
  this.id = nextEnemyId++;
  this.type = type; this.def = T;
  this.x = x; this.y = clamp(y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
  this.z = 0;
  this.facing = 1;
  this.hp = T.hp; this.maxHp = T.hp;
  this.state = 'approach'; this.stateT = 0; this.t = Math.random() * 10;
  this.cool = 0.6 + Math.random();
  this.kx = 0; this.flashT = 0; this.hpBarT = 0;
  this.dyOff = (Math.random() - 0.5) * 18;   // personal depth offset so goons don't stack
  this.isBoss = false;
  var shirt = GOON_SHIRTS[type][stage % 4];
  this.colors = {
    skin: '#b97a4e', skinD: '#96603a',
    head: Sprites.CROC_GREEN, headD: Sprites.CROC_GREEN_D, headMode: 'croc',
    shirt: shirt, shirtD: '#23252b',
    pants: '#33363c', pantsD: '#23252b',
    shoes: '#8f949b', shoesD: '#6b6f76',
  };
}

Enemy.prototype = {
  canBeHit: function () {
    return this.state !== 'down' && this.state !== 'dizzy' && this.state !== 'flee' && this.state !== 'defeated';
  },

  update: function (dt, world) {
    this.t += dt;
    this.stateT += dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.hpBarT > 0) this.hpBarT -= dt;
    if (this.kx) {
      this.x += this.kx * dt;
      this.kx *= Math.pow(0.02, dt);
      if (Math.abs(this.kx) < 4) this.kx = 0;
    }
    var p = world.player;

    switch (this.state) {
      case 'approach': this.approach(dt, world, p); break;

      case 'attack':
        if (!this.didHit && this.stateT >= this.def.hitT) {
          this.didHit = true;
          if (this.def.ranged && Math.abs(this.x - p.x) > 40) {
            world.projectiles.push(new Projectile('mango', this.x + this.facing * 8, this.y, 12, this.facing * 150, this.def.dmg, false));
            AudioSys.sfx('throw');
          } else if (inMeleeRange(this, p, (this.def.range || 18) + 3)) {
            p.takeHit(this.def.ranged ? 4 : this.def.dmg, this.x, this.def.knockdown, world);
          }
        }
        if (this.stateT >= this.def.atkDur) {
          this.state = 'approach'; this.stateT = 0;
          this.cool = lerp(this.def.cool[0], this.def.cool[1], Math.random());
        }
        break;

      case 'hurt':
        if (this.stateT >= 0.3) { this.state = 'approach'; this.stateT = 0; }
        break;

      case 'down':
        if (this.stateT >= 0.9) {
          if (this.hp <= 0) { this.state = 'dizzy'; this.stateT = 0; }
          else { this.state = 'approach'; this.stateT = 0; }
        }
        break;

      case 'dizzy':
        if (this.stateT >= 1.1) {
          this.state = 'flee'; this.stateT = 0;
          this.facing = (this.x - world.camX < CFG.W / 2) ? -1 : 1;
          AudioSys.sfx('edown');
        }
        break;

      case 'flee':
        this.x += this.facing * 130 * dt;
        if (this.x < world.camX - 40 || this.x > world.camX + CFG.W + 40) this.dead = true;
        break;
    }

    // once inside the locked arena, stay inside (stops throwers backing out of reach)
    if (world.locked && this.state !== 'flee') {
      if (!this.entered) {
        if (this.x > world.camX + 18 && this.x < world.camX + CFG.W - 18) this.entered = true;
      } else {
        this.x = clamp(this.x, world.camX + 12, world.camX + CFG.W - 12);
      }
    }
  },

  approach: function (dt, world, p) {
    var side = this.x > p.x ? 1 : -1;
    var targetX, targetY = clamp(p.y + this.dyOff, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
    if (this.def.ranged) {
      var dist = Math.abs(this.x - p.x);
      targetX = p.x + side * this.def.far;
      if (Math.abs(dist - this.def.far) < 25) targetX = this.x; // close enough
      targetY = p.y;
    } else {
      targetX = p.x + side * (this.def.range - 4);
    }
    var dx = targetX - this.x, dy = targetY - this.y;
    var d = Math.max(1, Math.hypot(dx, dy));
    if (d > 3) {
      this.x += (dx / d) * this.def.speed * dt;
      this.y += (dy / d) * this.def.speed * 0.7 * dt;
      this.y = clamp(this.y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
      this.moving = true;
    } else this.moving = false;
    this.facing = p.x > this.x ? 1 : -1;

    var aligned = Math.abs(this.y - p.y) <= CFG.DEPTH_TOL;
    var distX = Math.abs(this.x - p.x);
    var inReach = this.def.ranged
      ? (distX > 60 || distX < 26)   // throw from afar, or slap if cornered
      : distX < this.def.range + 4;
    if (this.cool <= 0 && aligned && inReach && p.state !== 'down') {
      this.state = 'attack'; this.stateT = 0; this.didHit = false;
    }
  },

  takeHit: function (dmg, from, knockdown, world) {
    this.hp -= dmg;
    this.flashT = 0.12;
    this.hpBarT = 1.6;
    this.facing = from.x > this.x ? 1 : -1;
    this.kx = -this.facing * (knockdown ? 110 : 55);
    world.particles.push(new Particle('spark', this.x, this.y - 20, 0, -20, 0.22));
    world.addScore(10, this.x, this.y - 30);
    if (this.hp <= 0 || knockdown) {
      this.state = 'down'; this.stateT = 0;
      if (this.hp <= 0) world.addScore(this.def.score, this.x, this.y - 36);
    } else {
      this.state = 'hurt'; this.stateT = 0;
    }
  },

  pose: function () {
    switch (this.state) {
      case 'approach': return this.moving ? 'walk' : 'idle';
      case 'attack': return this.stateT < this.def.hitT * 0.6 ? 'punch2' : this.def.pose;
      case 'hurt': return 'hurt';
      case 'down': return 'down';
      case 'dizzy': return 'dizzy';
      case 'flee': return 'flee';
      default: return 'idle';
    }
  },

  draw: function (ctx, camX) {
    var sx = this.x - camX;
    Sprites.drawShadow(ctx, sx, this.y, 15);
    Sprites.drawFighter(ctx, {
      x: sx, y: this.y - this.z,
      facing: this.facing, pose: this.pose(), t: this.t,
      c: this.colors, headMode: 'croc',
      flash: this.flashT > 0,
    });
    if (this.state === 'dizzy') Sprites.drawStars(ctx, sx, this.y - 34, this.t);
    // mini health bar shows for a moment after taking a hit
    if (this.hpBarT > 0 && this.hp > 0) {
      var frac = this.hp / this.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(Math.round(sx) - 9, this.y - 43, 18, 4);
      ctx.fillStyle = frac > 0.4 ? '#3ad65c' : '#e8483a';
      ctx.fillRect(Math.round(sx) - 8, this.y - 42, Math.max(1, Math.round(16 * frac)), 2);
    }
  },
};

// ==================================================================== Bosses
var BOSS_DEFS = {
  mongoose: { name: 'MAD MONGOOSE', hp: 150, speed: 62, dmg: 9,  range: 32, score: 500, scale: 1.2 },
  driller:  { name: 'THE DRILLER',  hp: 200, speed: 30, dmg: 8,  range: 26, score: 600, scale: 1 },
  hyena:    { name: 'HYENA',        hp: 175, speed: 80, dmg: 8,  range: 20, score: 700, scale: 1.15 },
  ngwena:   { name: "CAPTAIN NG'WENA", hp: 260, speed: 48, dmg: 10, range: 28, score: 1000, scale: 1.4 },
};

function Boss(kind, x, y) {
  var D = BOSS_DEFS[kind];
  this.id = nextEnemyId++;
  this.kind = kind; this.def = D;
  this.x = x; this.y = clamp(y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
  this.z = 0; this.vz = 0;
  this.facing = -1;
  this.hp = D.hp; this.maxHp = D.hp;
  this.state = 'approach'; this.stateT = 0; this.t = 0;
  this.cool = 1.5;
  this.bigCool = 3 + Math.random() * 2;  // timer for the signature move
  this.kx = 0; this.flashT = 0;
  this.hurtCount = 0;
  this.summoned = false;
  this.isBoss = true;
  this.colors = this.palette(kind);
}

Boss.prototype = {
  palette: function (kind) {
    if (kind === 'mongoose') return {
      skin: '#b08148', skinD: '#8a5e30', head: '#b08148', headD: '#8a5e30',
      shirt: '#b08148', shirtD: '#8a5e30', pants: '#6e4a22', pantsD: '#54371a',
      shoes: '#3d2c18', shoesD: '#2a1d0f', headMode: 'beast',
    };
    if (kind === 'hyena') return {
      skin: '#9a8a6a', skinD: '#7a6c50', head: '#9a8a6a', headD: '#7a6c50',
      shirt: '#9a8a6a', shirtD: '#7a6c50', pants: '#5e5340', pantsD: '#463d2e',
      shoes: '#3a3326', shoesD: '#2a2419', headMode: 'beast',
    };
    return {  // ngwena
      skin: Sprites.CROC_GREEN, skinD: Sprites.CROC_GREEN_D,
      head: Sprites.CROC_GREEN, headD: Sprites.CROC_GREEN_D,
      shirt: '#2e5d3a', shirtD: '#1f4128', pants: '#27343c', pantsD: '#1a2329',
      shoes: '#15181c', shoesD: '#0d0f12', headMode: 'croc',
    };
  },

  canBeHit: function () {
    if (this.state === 'defeated') return false;
    if (this.kind === 'driller' && this.state === 'dash') return false;
    return true;
  },

  update: function (dt, world) {
    this.t += dt;
    this.stateT += dt;
    if (this.cool > 0) this.cool -= dt;
    if (this.bigCool > 0) this.bigCool -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.kx) {
      this.x += this.kx * dt;
      this.kx *= Math.pow(0.02, dt);
      if (Math.abs(this.kx) < 4) this.kx = 0;
    }
    var p = world.player;

    switch (this.state) {
      case 'approach': this.brain(dt, world, p); break;

      case 'attack':
        if (!this.didHit && this.stateT >= 0.3) {
          this.didHit = true;
          if (inMeleeRange(this, p, this.def.range + 4)) {
            p.takeHit(this.def.dmg, this.x, true, world);
          }
        }
        if (this.stateT >= 0.55) {
          this.state = 'approach'; this.stateT = 0;
          this.cool = 1.1 + Math.random() * 0.9;
        }
        break;

      case 'telegraph':       // shaking before a charge/dash
        if (this.stateT >= 0.6) {
          this.state = this.kind === 'driller' ? 'dash' : 'charge';
          this.stateT = 0;
          this.didHit = false;
          this.chargeDir = p.x > this.x ? 1 : -1;
          this.facing = this.chargeDir;
        }
        break;

      case 'charge':          // mongoose / hyena running charge
      case 'dash':            // driller drill dash
        var spd = this.kind === 'driller' ? 175 : 145;
        this.x += this.chargeDir * spd * dt;
        // steer slightly toward the player's lane
        this.y += clamp(p.y - this.y, -40, 40) * dt * 1.5;
        if (!this.didHit && inMeleeRange(this, p, this.def.range)) {
          this.didHit = true;
          p.takeHit(this.def.dmg + 3, this.x, true, world);
        }
        if (this.x < world.camX + 14 || this.x > world.camX + CFG.W - 14 || this.stateT > 1.6) {
          this.x = clamp(this.x, world.camX + 14, world.camX + CFG.W - 14);
          this.state = 'tired'; this.stateT = 0;
        }
        break;

      case 'tired':           // vulnerable window after the big move
        if (this.stateT >= 1.2) {
          this.state = 'approach'; this.stateT = 0;
          this.bigCool = 4 + Math.random() * 2.5;
          this.cool = 0.8;
        }
        break;

      case 'throw':           // ngwena egg lob
        if (!this.didHit && this.stateT >= 0.25) {
          this.didHit = true;
          world.projectiles.push(new Projectile('egg', this.x + this.facing * 10, this.y, 24, this.facing * 130, 9, false, 130));
          AudioSys.sfx('throw');
        }
        if (this.stateT >= 0.6) {
          this.state = 'approach'; this.stateT = 0;
          this.cool = 1.4;
        }
        break;

      case 'slam':            // ngwena jump slam
        this.z += this.vz * dt;
        this.vz -= CFG.GRAV * dt;
        this.x += this.slamVx * dt;
        if (this.z <= 0) {
          this.z = 0;
          AudioSys.sfx('kickhit');
          world.shake = 0.3;
          if (Math.abs(p.x - this.x) < 40 && Math.abs(p.y - this.y) < 20 && p.z < 8) {
            p.takeHit(12, this.x, true, world);
          }
          for (var i = -1; i <= 1; i += 2) {
            world.particles.push(new Particle('spark', this.x + i * 14, this.y - 4, i * 40, -30, 0.3));
          }
          this.state = 'tired'; this.stateT = 0;
        }
        break;

      case 'hurt':
        if (this.stateT >= 0.22) { this.state = 'approach'; this.stateT = 0; }
        break;

      case 'down':
        if (this.stateT >= 1.0) {
          if (this.hp <= 0) { this.state = 'defeated'; this.stateT = 0; }
          else { this.state = 'approach'; this.stateT = 0; this.cool = 0.5; }
        }
        break;

      case 'defeated':
        // stays on the ground seeing stars; main.js runs the stage-clear sequence
        break;
    }
  },

  brain: function (dt, world, p) {
    // signature move?
    if (this.bigCool <= 0) {
      if (this.kind === 'ngwena') {
        if (Math.random() < 0.5) {
          this.state = 'slam'; this.stateT = 0;
          this.vz = 235; this.slamVx = clamp((p.x - this.x), -120, 120);
          AudioSys.sfx('jump');
        } else {
          this.state = 'telegraph'; this.stateT = 0; AudioSys.sfx('alarm');
        }
        this.bigCool = 5;
        return;
      }
      this.state = 'telegraph'; this.stateT = 0;
      AudioSys.sfx('alarm');
      return;
    }
    // ngwena lobs eggs when player is far
    if (this.kind === 'ngwena' && this.cool <= 0 && Math.abs(p.x - this.x) > 90) {
      this.facing = p.x > this.x ? 1 : -1;
      this.state = 'throw'; this.stateT = 0; this.didHit = false;
      return;
    }
    // hyena summons backup at half health
    if (this.kind === 'hyena' && !this.summoned && this.hp < this.maxHp / 2) {
      this.summoned = true;
      world.enemies.push(new Enemy('rusher', world.camX - 20, p.y - 10, 2));
      world.enemies.push(new Enemy('rusher', world.camX + CFG.W + 20, p.y + 10, 2));
      AudioSys.sfx('alarm');
    }
    // walk toward the player
    var side = this.x > p.x ? 1 : -1;
    var tx = p.x + side * (this.def.range - 6);
    var ty = p.y;
    var dx = tx - this.x, dy = ty - this.y;
    var d = Math.max(1, Math.hypot(dx, dy));
    if (d > 3) {
      this.x += (dx / d) * this.def.speed * dt;
      this.y += (dy / d) * this.def.speed * 0.7 * dt;
      this.y = clamp(this.y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
      this.moving = true;
    } else this.moving = false;
    this.facing = p.x > this.x ? 1 : -1;

    if (this.cool <= 0 && Math.abs(this.y - p.y) <= CFG.DEPTH_TOL &&
        Math.abs(this.x - p.x) < this.def.range + 6 && p.state !== 'down') {
      this.state = 'attack'; this.stateT = 0; this.didHit = false;
    }
  },

  takeHit: function (dmg, from, knockdown, world) {
    if (this.state === 'dash' || this.state === 'charge' || this.state === 'slam') return; // armored mid-move
    this.hp -= dmg;
    this.flashT = 0.12;
    world.particles.push(new Particle('spark', this.x, this.y - 24, 0, -20, 0.22));
    world.addScore(10, this.x, this.y - 38);
    this.hurtCount++;
    if (this.hp <= 0) {
      this.state = 'down'; this.stateT = 0;
      this.kx = (this.x > from.x ? 1 : -1) * 90;
      world.addScore(this.def.score, this.x, this.y - 44);
      world.hitstop = Math.max(world.hitstop || 0, 0.14);
      world.shake = Math.max(world.shake || 0, 0.3);
      AudioSys.sfx('edown');
    } else if (knockdown && this.hurtCount % 5 === 0) {
      this.state = 'down'; this.stateT = 0;
      this.kx = (this.x > from.x ? 1 : -1) * 80;
    } else if (this.state !== 'tired') {
      this.state = 'hurt'; this.stateT = 0;
    }
  },

  pose: function () {
    switch (this.state) {
      case 'approach': return this.moving ? 'walk' : 'idle';
      case 'attack': return this.kind === 'mongoose' ? 'sweep' : 'punch3';
      case 'telegraph': return 'idle';
      case 'charge': return 'run';
      case 'tired': return 'dizzy';
      case 'throw': return 'throw';
      case 'slam': return 'jumpkick';
      case 'hurt': return 'hurt';
      case 'down': case 'defeated': return 'down';
      default: return 'idle';
    }
  },

  draw: function (ctx, camX) {
    var sx = this.x - camX;
    var shakeX = this.state === 'telegraph' ? (Math.floor(this.t * 30) % 2 ? 1 : -1) : 0;
    Sprites.drawShadow(ctx, sx, this.y, this.kind === 'driller' ? 30 : 20);
    if (this.kind === 'driller') {
      Sprites.drawDriller(ctx, sx + shakeX, this.y, this.facing,
        this.state === 'dash' ? 'dash' : 'idle', this.t, this.flashT > 0);
    } else {
      Sprites.drawFighter(ctx, {
        x: sx + shakeX, y: this.y - this.z,
        facing: this.facing, pose: this.pose(), t: this.t,
        c: this.colors, headMode: this.colors.headMode,
        scale: this.def.scale,
        spots: this.kind === 'hyena',
        hat: this.kind === 'ngwena',
        broom: this.kind === 'mongoose',
        flash: this.flashT > 0,
      });
    }
    if (this.state === 'defeated' || this.state === 'tired') {
      Sprites.drawStars(ctx, sx, this.y - 40, this.t);
    }
  },
};

// ============================================================= Eagle Strike
// The Zambian fish eagle sweeps the whole screen, flattening every enemy.
function Eagle(facing, world) {
  this.facing = facing;
  this.x = facing > 0 ? world.camX - 40 : world.camX + CFG.W + 40;
  this.y = (CFG.GROUND_TOP + CFG.GROUND_BOTTOM) / 2;
  this.t = 0;
  this.hit = {};
  this.dead = false;
}

Eagle.prototype = {
  update: function (dt, world) {
    this.t += dt;
    this.x += this.facing * 340 * dt;
    // golden trail
    if (Math.random() < 0.7) {
      world.particles.push(new Particle('ring',
        this.x - this.facing * 10, this.y - 34 + (Math.random() - 0.5) * 14,
        -this.facing * 30, (Math.random() - 0.5) * 20, 0.45));
    }
    for (var i = 0; i < world.enemies.length; i++) {
      var e = world.enemies[i];
      if (!this.hit[e.id] && e.canBeHit() && Math.abs(e.x - this.x) < 18) {
        this.hit[e.id] = true;
        e.takeHit(28, { x: this.x - this.facing * 10 }, true, world);
        world.hitstop = Math.max(world.hitstop || 0, 0.06);
        AudioSys.sfx('kickhit');
      }
    }
    if (this.x < world.camX - 70 || this.x > world.camX + CFG.W + 70) this.dead = true;
  },

  draw: function (ctx, camX) {
    Sprites.drawShadow(ctx, this.x - camX, this.y + 28, 14);
    Sprites.drawEagle(ctx, this.x - camX, this.y - 6, this.facing, this.t);
  },
};

// ================================================================ Projectile
function Projectile(kind, x, y, z, vx, dmg, fromPlayer, vz) {
  this.kind = kind;
  this.x = x; this.y = y; this.z = z;
  this.vx = vx; this.vz = vz || 0;
  this.dmg = dmg;
  this.fromPlayer = fromPlayer;
  this.arc = !!vz;
  this.t = 0;
  this.dead = false;
}

Projectile.prototype = {
  update: function (dt, world) {
    this.t += dt;
    this.x += this.vx * dt;
    if (this.arc) {
      this.z += this.vz * dt;
      this.vz -= 350 * dt;
      if (this.z <= 0) {
        world.particles.push(new Particle('spark', this.x, this.y, 0, -15, 0.2));
        this.dead = true;
        return;
      }
    }
    if (this.x < world.camX - 30 || this.x > world.camX + CFG.W + 30) { this.dead = true; return; }

    if (this.fromPlayer) {
      for (var i = 0; i < world.enemies.length; i++) {
        var e = world.enemies[i];
        if (e.canBeHit() && Math.abs(e.x - this.x) < 12 &&
            Math.abs(e.y - this.y) <= CFG.DEPTH_TOL && Math.abs(this.z - 16) < 22) {
          e.takeHit(this.dmg, { x: this.x - this.vx }, true, world);
          AudioSys.sfx('hit');
          this.dead = true;
          return;
        }
      }
    } else {
      var p = world.player;
      if (Math.abs(p.x - this.x) < 10 && Math.abs(p.y - this.y) <= CFG.DEPTH_TOL &&
          Math.abs((p.z + 16) - this.z) < 18) {
        p.takeHit(this.dmg, this.x - this.vx, false, world);
        this.dead = true;
      }
    }
  },

  draw: function (ctx, camX) {
    Sprites.drawShadow(ctx, this.x - camX, this.y, 6);
    Sprites.drawItem(ctx, this.kind, this.x - camX, this.y - this.z, 0);
  },
};

// =================================================================== Pickups
function Pickup(kind, x, y) {
  this.kind = kind; this.x = x; this.y = clamp(y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
  this.t = Math.random() * 5;
}
Pickup.prototype.draw = function (ctx, camX) {
  this.t += 1 / 60;
  Sprites.drawShadow(ctx, this.x - camX, this.y, 8);
  Sprites.drawItem(ctx, this.kind, this.x - camX, this.y, this.t);
};

function Crate(x, y, item) {
  this.x = x; this.y = clamp(y, CFG.GROUND_TOP, CFG.GROUND_BOTTOM);
  this.item = item;
  this.broken = false;
}
Crate.prototype = {
  smash: function (world) {
    this.broken = true;
    AudioSys.sfx('crate');
    for (var i = 0; i < 6; i++) {
      world.particles.push(new Particle('wood', this.x, this.y - 8,
        (Math.random() - 0.5) * 120, -60 - Math.random() * 60, 0.5));
    }
    if (this.item) world.pickups.push(new Pickup(this.item, this.x, this.y));
  },
  draw: function (ctx, camX) {
    if (this.broken) return;
    Sprites.drawShadow(ctx, this.x - camX, this.y, 16);
    Sprites.drawCrate(ctx, this.x - camX, this.y);
  },
};

// ================================================================= Particles
function Particle(kind, x, y, vx, vy, life, text) {
  this.kind = kind;
  this.x = x; this.y = y;
  this.vx = vx || 0; this.vy = vy || 0;
  this.life = life; this.maxLife = life;
  this.text = text;
  this.dead = false;
}
Particle.prototype = {
  update: function (dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.kind === 'wood' || this.kind === 'confetti') this.vy += 300 * dt;
  },
  draw: function (ctx, camX) {
    var sx = Math.round(this.x - camX), sy = Math.round(this.y);
    var a = this.life / this.maxLife;
    switch (this.kind) {
      case 'spark':
        ctx.fillStyle = a > 0.5 ? '#fff' : '#ffd23c';
        ctx.fillRect(sx - 2, sy, 5, 1); ctx.fillRect(sx, sy - 2, 1, 5);
        break;
      case 'ring':
        ctx.fillStyle = 'rgba(255,180,60,' + a.toFixed(2) + ')';
        ctx.fillRect(sx - 1, sy - 1, 3, 3);
        break;
      case 'wood':
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(sx, sy, 3, 2);
        break;
      case 'confetti':
        ctx.fillStyle = ['#d62828', '#3a9d4f', '#e8762a', '#ffd23c', '#fff'][Math.abs(Math.floor(this.x + this.y)) % 5];
        ctx.fillRect(sx, sy, 2, 2);
        break;
      case 'text':
        UI.raw(ctx, String(this.text), sx, sy, 1, 'rgba(255,255,255,' + a.toFixed(2) + ')');
        break;
      case 'mist':
        ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.35).toFixed(2) + ')';
        ctx.fillRect(sx - 2, sy - 1, 5, 3);
        break;
    }
  },
};
