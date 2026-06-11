// WANDILE — stage definitions + procedurally painted parallax backgrounds
var Stages = {

  DEFS: [
    {
      name: 'LUSAKA', sub: 'STREETS & SOWETO MARKET', length: 1750, music: 'stage0',
      waves: [
        { at: 360,  spawn: [{ t: 'rusher', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.7 }] },
        { at: 770,  spawn: [{ t: 'rusher', side: 1, d: 0 }, { t: 'thrower', side: 1, d: 0.5 }, { t: 'rusher', side: -1, d: 1.2 }] },
        { at: 1170, spawn: [{ t: 'kicker', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.6 }, { t: 'rusher', side: 1, d: 1.6 }] },
      ],
      boss: { at: 1580, kind: 'mongoose' },
      crates: [
        { x: 300,  y: 246, item: 'stick' },
        { x: 700,  y: 200, item: 'fritter' },
        { x: 1100, y: 246, item: 'maheu' },
        { x: 1500, y: 200, item: 'nshima' },
      ],
      pickups: [{ kind: 'ball', x: 560, y: 230 }],
    },
    {
      name: 'COPPERBELT', sub: 'THE KITWE MINE', length: 1800, music: 'stage1',
      waves: [
        { at: 360,  spawn: [{ t: 'rusher', side: 1, d: 0 }, { t: 'kicker', side: -1, d: 0.8 }] },
        { at: 780,  spawn: [{ t: 'thrower', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.5 }, { t: 'rusher', side: 1, d: 1.3 }] },
        { at: 1190, spawn: [{ t: 'kicker', side: 1, d: 0 }, { t: 'kicker', side: -1, d: 0.7 }, { t: 'thrower', side: -1, d: 1.6 }] },
      ],
      boss: { at: 1620, kind: 'driller' },
      crates: [
        { x: 320,  y: 200, item: 'fritter' },
        { x: 740,  y: 246, item: 'stick' },
        { x: 1140, y: 200, item: 'maheu' },
        { x: 1540, y: 246, item: 'nshima' },
      ],
      pickups: [{ kind: 'lid', x: 980, y: 225 }],
    },
    {
      name: 'THE BUSH ROAD', sub: 'VILLAGE AT SUNSET', length: 1850, music: 'stage2',
      waves: [
        { at: 370,  spawn: [{ t: 'rusher', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.5 }, { t: 'thrower', side: 1, d: 1.2 }] },
        { at: 800,  spawn: [{ t: 'kicker', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.5 }, { t: 'rusher', side: 1, d: 1.2 }, { t: 'thrower', side: -1, d: 2 }] },
        { at: 1230, spawn: [{ t: 'kicker', side: -1, d: 0 }, { t: 'kicker', side: 1, d: 0.7 }, { t: 'rusher', side: -1, d: 1.4 }, { t: 'rusher', side: 1, d: 2 }] },
      ],
      boss: { at: 1660, kind: 'hyena' },
      crates: [
        { x: 330,  y: 246, item: 'maheu' },
        { x: 760,  y: 200, item: 'stick' },
        { x: 1180, y: 246, item: 'fritter' },
        { x: 1580, y: 200, item: 'nshima' },
      ],
      pickups: [{ kind: 'ball', x: 1000, y: 235 }],
    },
    {
      name: 'VICTORIA FALLS', sub: 'MOSI-OA-TUNYA — THE SMOKE THAT THUNDERS', length: 1900, music: 'stage3',
      waves: [
        { at: 380,  spawn: [{ t: 'kicker', side: 1, d: 0 }, { t: 'rusher', side: -1, d: 0.5 }, { t: 'rusher', side: 1, d: 1.2 }] },
        { at: 820,  spawn: [{ t: 'thrower', side: 1, d: 0 }, { t: 'thrower', side: -1, d: 0.4 }, { t: 'kicker', side: 1, d: 1.1 }, { t: 'rusher', side: -1, d: 1.8 }] },
        { at: 1270, spawn: [{ t: 'kicker', side: -1, d: 0 }, { t: 'kicker', side: 1, d: 0.6 }, { t: 'rusher', side: -1, d: 1.2 }, { t: 'thrower', side: 1, d: 1.8 }, { t: 'rusher', side: 1, d: 2.4 }] },
      ],
      boss: { at: 1700, kind: 'ngwena' },
      crates: [
        { x: 340,  y: 200, item: 'fritter' },
        { x: 780,  y: 246, item: 'maheu' },
        { x: 1220, y: 200, item: 'stick' },
        { x: 1620, y: 246, item: 'nshima' },
      ],
      pickups: [{ kind: 'lid', x: 1050, y: 220 }],
    },
  ],

  current: null,
  far: null, mid: null, ground: null,

  prepare: function (idx) {
    var def = this.DEFS[idx];
    this.current = def;
    this.idx = idx;
    var GT = CFG.GROUND_TOP;

    this.far = this.makeCanvas(Math.ceil(def.length * 0.25) + CFG.W, GT);
    this.mid = this.makeCanvas(Math.ceil(def.length * 0.55) + CFG.W, GT);
    this.ground = this.makeCanvas(def.length + CFG.W, CFG.H - GT + 12);

    var painters = [this.paintLusaka, this.paintMine, this.paintVillage, this.paintFalls];
    painters[idx].call(this, this.far.getContext('2d'), this.mid.getContext('2d'), this.ground.getContext('2d'));

    // depth shading: the ground darkens toward the horizon
    var g = this.ground.getContext('2d');
    for (var i = 0; i < 16; i++) {
      g.fillStyle = 'rgba(0,0,10,' + (0.16 * (1 - i / 16)).toFixed(3) + ')';
      g.fillRect(0, i, this.ground.width, 1);
    }
  },

  makeCanvas: function (w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  },

  // dithered vertical gradient — modern-pixel sky bands
  gradV: function (g, x, y, w, h, c0, c1, steps) {
    var bh = Math.ceil(h / steps);
    for (var i = 0; i < steps; i++) {
      g.fillStyle = lerpColor(c0, c1, i / (steps - 1));
      g.fillRect(x, y + i * bh, w, bh + 1);
    }
  },

  draw: function (ctx, camX, t) {
    var GT = CFG.GROUND_TOP;
    ctx.drawImage(this.far, -Math.floor(camX * 0.25), 0);
    ctx.drawImage(this.mid, -Math.floor(camX * 0.55), 0);
    ctx.drawImage(this.ground, -Math.floor(camX), GT - 12);

    if (this.idx === 0) this.cloudsOverlay(ctx, camX, t);
    if (this.idx === 1) { this.mineOverlay(ctx, camX, t); this.dustOverlay(ctx, t); }
    if (this.idx === 2) this.firefliesOverlay(ctx, t);
    if (this.idx === 3) this.fallsOverlay(ctx, camX, t);
  },

  // drifting clouds over Lusaka
  cloudsOverlay: function (ctx, camX, t) {
    for (var i = 0; i < 4; i++) {
      var x = ((i * 150 - camX * 0.18 - t * 5) % (CFG.W + 140) + CFG.W + 140) % (CFG.W + 140) - 70;
      var y = 16 + i * 13;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(Math.floor(x), y, 38, 6);
      ctx.fillRect(Math.floor(x) + 8, y - 4, 22, 4);
      ctx.fillRect(Math.floor(x) + 5, y + 6, 26, 3);
    }
  },

  // dust motes drifting down in the mine
  dustOverlay: function (ctx, t) {
    ctx.fillStyle = 'rgba(214,194,160,0.2)';
    for (var i = 0; i < 14; i++) {
      var x = Math.floor(hash2(i, 7) * CFG.W + Math.sin(t * 0.6 + i) * 8);
      var y = 26 + ((t * 13 + hash2(i, 8) * 160) % 160);
      ctx.fillRect(((x % CFG.W) + CFG.W) % CFG.W, Math.floor(y), 1, 2);
    }
  },

  // fireflies at dusk on the bush road
  firefliesOverlay: function (ctx, t) {
    for (var i = 0; i < 12; i++) {
      var glow = Math.sin(t * 2.4 + i * 2.1);
      if (glow < 0.25) continue;
      var x = Math.floor(hash2(i, 9) * CFG.W + Math.sin(t * 0.5 + i * 1.7) * 26);
      var y = Math.floor(132 + hash2(i, 10) * 110 + Math.cos(t * 0.7 + i) * 6);
      ctx.fillStyle = 'rgba(255,233,138,' + (0.35 * glow).toFixed(2) + ')';
      ctx.fillRect(((x % CFG.W) + CFG.W) % CFG.W - 1, y - 1, 3, 3);
      ctx.fillStyle = 'rgba(255,247,200,' + (0.9 * glow).toFixed(2) + ')';
      ctx.fillRect(((x % CFG.W) + CFG.W) % CFG.W, y, 1, 1);
    }
  },

  // animated waterfall shimmer + drifting mist
  fallsOverlay: function (ctx, camX, t) {
    ctx.save();
    for (var i = 0; i < 16; i++) {
      var x = (((i * 53 - camX * 0.25) % CFG.W) + CFG.W) % CFG.W;
      var y = 36 + ((t * 110 + i * 31) % 132);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(Math.floor(x), Math.floor(y), 2, 9);
    }
    for (var m = 0; m < 6; m++) {
      var mx = (((m * 97 + t * 12) % CFG.W) + CFG.W) % CFG.W;
      var my = 150 + Math.sin(t * 0.8 + m) * 8;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(Math.floor(mx), Math.floor(my), 26, 7);
    }
    // spray rising past the bridge
    for (var s = 0; s < 8; s++) {
      var rise = (t * 32 + s * 23) % 75;
      var sx = ((s * 61 + t * 9) % CFG.W + CFG.W) % CFG.W;
      ctx.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - rise / 75)).toFixed(2) + ')';
      ctx.fillRect(Math.floor(sx), Math.floor(252 - rise), 2, 4);
    }
    ctx.restore();
  },

  // flickering head-lamps glow
  mineOverlay: function (ctx, camX, t) {
    var flick = 0.16 + 0.06 * Math.sin(t * 7);
    for (var i = 0; i < 5; i++) {
      var x = (((i * 160 - camX * 0.55) % (CFG.W + 80)) + CFG.W + 80) % (CFG.W + 80) - 40;
      ctx.fillStyle = 'rgba(232,197,66,' + flick.toFixed(2) + ')';
      ctx.fillRect(Math.floor(x) - 7, 78, 16, 12);
    }
  },

  // ------------------------------------------------------------- painters
  paintLusaka: function (far, mid, gnd) {
    var r = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); };
    var fw = this.far.width, mw = this.mid.width, gw = this.ground.width, gh = this.ground.height;
    var i, x, h;

    // far: gradient sky, sun, hills, skyline
    this.gradV(far, 0, 0, fw, 180, '#5fa8dd', '#d4eef9', 12);
    r(far, 84, 20, 26, 26, 'rgba(255,247,192,0.35)');               // sun glow
    r(far, 88, 24, 18, 18, 'rgba(255,247,192,0.5)');
    r(far, 91, 27, 12, 12, '#fff7c0'); r(far, 94, 24, 6, 18, '#fff7c0');
    for (x = 0; x < fw; x += 48) {                                  // distant hills
      var hh2 = 10 + hash2(x, 19) * 16;
      r(far, x - 8, 178 - hh2, 64, hh2, '#9cc1d4');
    }
    for (x = 0; x < fw; x += 26) {
      h = 34 + hash2(x, 1) * 56;
      r(far, x, 180 - h, 22, h, '#7fa3b5');
      r(far, x, 180 - h, 22, 2, '#92b4c5');                          // roofline light
      r(far, x, 180 - h, 3, h, '#6d92a4');                           // side shade
      for (i = 0; i < 4; i++) {
        if (hash2(x, i + 2) > 0.4) r(far, x + 5 + (i % 2) * 10, 180 - h + 6 + Math.floor(i / 2) * 14, 4, 5, '#5d7e8f');
      }
    }
    r(far, 0, 176, fw, 4, '#6e8a99');

    // mid: market stalls / walls / minibuses / poles / jacarandas
    for (x = 20; x < mw; x += 95) {
      var kind = Math.floor(hash2(x, 7) * 5);
      if (kind === 4) {            // jacaranda in bloom
        r(mid, x + 18, 138, 5, 42, '#54483a');
        r(mid, x + 14, 130, 3, 10, '#54483a'); r(mid, x + 25, 128, 3, 12, '#54483a');
        r(mid, x + 2, 112, 38, 14, '#7e54b8');
        r(mid, x + 6, 106, 30, 8, '#9a6fd0');
        r(mid, x + 10, 102, 20, 6, '#b48ae0');
        r(mid, x - 2, 118, 10, 8, '#9a6fd0'); r(mid, x + 34, 116, 10, 9, '#9a6fd0');
        for (i = 0; i < 6; i++) r(mid, x + 4 + i * 6, 176 + (i % 2), 2, 1, '#b48ae0'); // fallen petals
        continue;
      }
      if (kind === 0) {            // market stall
        var c1 = hash2(x, 8) > 0.5 ? '#d62828' : '#3a9d4f';
        for (i = 0; i < 6; i++) r(mid, x + i * 7, 116, 7, 8, i % 2 ? '#f2f2f2' : c1);
        r(mid, x, 124, 42, 3, '#8a5a2b');
        r(mid, x + 2, 127, 3, 53, '#6e4421'); r(mid, x + 37, 127, 3, 53, '#6e4421');
        r(mid, x + 5, 150, 32, 12, '#a8743c');
        r(mid, x + 8, 144, 8, 6, '#e2a32b'); r(mid, x + 20, 144, 8, 6, '#cf5b2e'); // fruit
      } else if (kind === 1) {     // painted wall
        r(mid, x, 120, 70, 60, '#c2b49a');
        r(mid, x, 120, 70, 4, '#a89878');
        r(mid, x + 8, 132, 26, 18, '#2f8f9d');
        r(mid, x + 12, 138, 18, 3, '#fff');
        r(mid, x + 42, 132, 20, 30, '#8a3636');
      } else if (kind === 2) {     // minibus
        r(mid, x, 142, 56, 22, '#f2f2f2');
        r(mid, x, 152, 56, 5, '#3a5ba0');
        r(mid, x + 4, 146, 10, 7, '#9fd3e8'); r(mid, x + 18, 146, 10, 7, '#9fd3e8'); r(mid, x + 32, 146, 10, 7, '#9fd3e8');
        r(mid, x + 8, 162, 8, 6, '#222'); r(mid, x + 40, 162, 8, 6, '#222');
      } else {                     // power pole
        r(mid, x + 20, 96, 4, 84, '#54483a');
        r(mid, x + 8, 102, 28, 3, '#54483a');
      }
    }

    // ground: tarmac road
    r(gnd, 0, 0, gw, gh, '#9b8b76');
    r(gnd, 0, 0, gw, 4, '#6e6354');
    r(gnd, 0, 4, gw, 6, '#8a7d6c');
    for (x = 0; x < gw; x += 9) {
      var sy = 12 + hash2(x, 11) * (gh - 16);
      r(gnd, x, sy, 2, 1, hash2(x, 12) > 0.5 ? '#8a7d6c' : '#ab9b85');
    }
    for (x = 30; x < gw; x += 120) r(gnd, x, 46, 26, 3, '#cfc5b0');  // road paint
  },

  paintMine: function (far, mid, gnd) {
    var r = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); };
    var fw = this.far.width, mw = this.mid.width, gw = this.ground.width, gh = this.ground.height;
    var i, x;

    // far: dark rock with copper glints
    this.gradV(far, 0, 0, fw, 180, '#1c1824', '#2e2837', 8);
    r(far, 0, 40, fw, 8, '#332c3d');
    r(far, 0, 100, fw, 10, '#332c3d');
    for (x = 0; x < fw; x += 14) {
      if (hash2(x, 21) > 0.72) {
        var gy = 20 + hash2(x, 22) * 140;
        r(far, x, gy, 3, 2, hash2(x, 23) > 0.5 ? '#d98f3e' : '#e8c542');
        r(far, x + 1, gy + 1, 1, 1, '#fff7c0');
      }
    }

    // mid: timber supports, conveyor, carts, lamps
    for (x = 10; x < mw; x += 70) {
      r(mid, x, 60, 6, 120, '#6e4a22');
      r(mid, x + 52, 60, 6, 120, '#6e4a22');
      r(mid, x - 4, 54, 66, 8, '#8a5a2b');
      if (hash2(x, 31) > 0.6) {                       // hanging lamp
        r(mid, x + 27, 62, 2, 10, '#444');
        r(mid, x + 24, 72, 8, 6, '#e8c542');
        r(mid, x + 26, 74, 4, 2, '#fff7c0');
      }
      if (hash2(x, 32) > 0.65) {                      // ore cart
        r(mid, x + 12, 152, 34, 18, '#4a4e55');
        r(mid, x + 14, 146, 8, 6, '#b8702a'); r(mid, x + 24, 144, 9, 8, '#d98f3e');
        r(mid, x + 16, 170, 7, 7, '#222'); r(mid, x + 35, 170, 7, 7, '#222');
      }
    }
    // conveyor belt strip
    r(mid, 0, 116, mw, 5, '#3a3e45');
    for (x = 0; x < mw; x += 22) r(mid, x, 121, 4, 4, '#55595f');

    // ground: dirt + rails
    r(gnd, 0, 0, gw, gh, '#4a4038');
    r(gnd, 0, 0, gw, 3, '#332c26');
    for (x = 0; x < gw; x += 14) r(gnd, x, 40, 8, 4, '#3a322c');   // sleepers
    r(gnd, 0, 39, gw, 2, '#8f949b');
    r(gnd, 0, 46, gw, 2, '#8f949b');
    for (x = 0; x < gw; x += 11) {
      var sy = 8 + hash2(x, 41) * (gh - 14);
      r(gnd, x, sy, 2, 1, '#3a322c');
    }
  },

  paintVillage: function (far, mid, gnd) {
    var r = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); };
    var fw = this.far.width, mw = this.mid.width, gw = this.ground.width, gh = this.ground.height;
    var i, x;

    // far: gradient sunset sky, glowing sun, hills, birds
    this.gradV(far, 0, 0, fw, 180, '#f7d27a', '#a8443a', 14);
    r(far, 142, 80, 42, 42, 'rgba(255,243,196,0.25)');              // sun halo
    r(far, 148, 86, 30, 30, 'rgba(255,243,196,0.4)');
    r(far, 152, 90, 22, 22, '#fff3c4'); r(far, 156, 86, 14, 30, '#fff3c4'); // low sun
    for (x = 0; x < fw; x += 60) {
      var hh = 14 + hash2(x, 51) * 22;
      r(far, x, 180 - hh, 70, hh, '#7a4a3a');
    }
    for (i = 0; i < 8; i++) {                          // birds
      var bx = hash2(i, 52) * fw, by = 20 + hash2(i, 53) * 50;
      r(far, bx, by, 2, 1, '#5e3328'); r(far, bx + 3, by, 2, 1, '#5e3328'); r(far, bx + 2, by - 1, 1, 1, '#5e3328');
    }

    // mid: baobabs, huts, grass
    for (x = 20; x < mw; x += 110) {
      var kind = Math.floor(hash2(x, 61) * 3);
      if (kind === 0) {            // baobab
        r(mid, x + 10, 100, 18, 80, '#6e4a36');
        r(mid, x + 6, 92, 26, 12, '#6e4a36');
        r(mid, x, 86, 10, 5, '#5a3c2c'); r(mid, x + 28, 84, 12, 5, '#5a3c2c');
        r(mid, x - 2, 80, 44, 8, '#5e6b34');
      } else if (kind === 1) {     // hut
        r(mid, x, 138, 44, 42, '#b08148');
        r(mid, x - 4, 126, 52, 8, '#8a6e3a');
        r(mid, x + 2, 118, 40, 8, '#8a6e3a');
        r(mid, x + 10, 110, 24, 8, '#8a6e3a');
        r(mid, x + 18, 154, 12, 26, '#54371a');         // door
      } else {                     // tall grass + small tree
        for (i = 0; i < 9; i++) r(mid, x + i * 5, 168 - hash2(x, i) * 9, 2, 14, '#7d8a3e');
        r(mid, x + 50, 140, 5, 40, '#6e4a36');
        r(mid, x + 40, 128, 26, 14, '#5e6b34');
      }
    }

    // ground: dirt road with grass patches
    r(gnd, 0, 0, gw, gh, '#a3713f');
    r(gnd, 0, 0, gw, 3, '#7d5630');
    for (x = 0; x < gw; x += 13) {
      var sy = 8 + hash2(x, 71) * (gh - 14);
      if (hash2(x, 72) > 0.6) { r(gnd, x, sy, 2, 2, '#7d8a3e'); r(gnd, x + 1, sy - 1, 1, 1, '#8fa04a'); }
      else r(gnd, x, sy, 2, 1, '#8a5e32');
    }
  },

  paintFalls: function (far, mid, gnd) {
    var r = function (g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); };
    var fw = this.far.width, mw = this.mid.width, gw = this.ground.width, gh = this.ground.height;
    var i, x;

    // far: sky, the great waterfall curtain, rainbow
    r(far, 0, 0, fw, 34, '#bcd9e8');
    r(far, 0, 30, fw, 6, '#7aa8c0');                   // river lip
    for (x = 0; x < fw; x += 6) {                      // falling water columns
      var shade = hash2(x, 81);
      r(far, x, 36, 6, 144, shade > 0.66 ? '#e8f4f8' : shade > 0.33 ? '#cfe4ee' : '#bcd9e8');
    }
    for (x = 0; x < fw; x += 90) {                     // rock pillars jutting through the curtain
      if (hash2(x, 82) > 0.62) {
        var ph2 = 50 + hash2(x, 83) * 65;
        r(far, x - 1, 36, 12, 7, '#5a4f5a');           // wet cap at the lip
        r(far, x, 36, 10, ph2, '#4a3f4a');
        r(far, x + 2, 36 + ph2, 6, 12, '#4a3f4a');     // taper
        r(far, x + 3, 36 + ph2 + 12, 4, 8, '#544a56');
        r(far, x, 36, 2, ph2, '#5a4f5a');              // lit edge
      }
    }
    // rainbow (repeats across the layer)
    for (x = 120; x < fw; x += 460) {
      var cols = ['#e84a5f', '#e8c542', '#3a9d4f', '#3a5ba0'];
      for (i = 0; i < 4; i++) {
        far.strokeStyle = cols[i];
        far.globalAlpha = 0.45;
        far.beginPath();
        far.arc(x, 150, 70 - i * 4, Math.PI, Math.PI * 2);
        far.stroke();
      }
      far.globalAlpha = 1;
    }
    r(far, 0, 172, fw, 8, '#3d3440');                  // gorge edge

    // mid: mist banks, wet rocks, bridge posts with rope
    for (x = 0; x < mw; x += 60) {
      r(mid, x + 10, 156 + hash2(x, 91) * 10, 38, 9, 'rgba(255,255,255,0.30)');
      if (hash2(x, 92) > 0.6) r(mid, x + 30, 164, 22, 16, '#3d3440');
    }
    for (x = 30; x < mw; x += 85) {                    // bridge posts + rope
      r(mid, x, 128, 5, 52, '#5a4a34');
      r(mid, x + 1, 124, 3, 4, '#4a3c28');
      mid.strokeStyle = '#8a7a5a';
      mid.beginPath();
      mid.moveTo(x + 2, 132);
      mid.quadraticCurveTo(x + 44, 146, x + 87, 132);
      mid.stroke();
    }

    // ground: rope-bridge planks over the gorge
    r(gnd, 0, 0, gw, gh, '#7a5a34');
    r(gnd, 0, 0, gw, 3, '#caa84f');                    // rope edge
    for (x = 0; x < gw; x += 11) r(gnd, x, 3, 2, gh - 3, '#54421f');
    for (x = 0; x < gw; x += 160) {                    // missing plank (water glimpse)
      if (hash2(x, 95) > 0.5) r(gnd, x + 40, 20 + hash2(x, 96) * 40, 9, 12, '#2a3540');
    }
    for (x = 0; x < gw; x += 17) {
      var sy = 6 + hash2(x, 97) * (gh - 12);
      r(gnd, x, sy, 2, 1, '#8a6a3e');
    }
  },
};
