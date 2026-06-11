// WANDILE — game loop, state machine, camera & wave direction
var Game = {
  canvas: null, ctx: null,
  state: 'title', stateT: 0, t: 0,
  stageIdx: 0, score: 0,
  hi: parseInt(localStorage.getItem('wandile_hi') || '0', 10),
  world: null,
  storyPanel: 0,
  paused: false,
  vignette: null,

  DIALOGS: [
    [['MAD MONGOOSE', 'THIS MARKET BELONGS TO THE CROC GANG, BOY!', 'boss'],
     ['WANDILE', 'WHERE IS LOKI? TALK, OR EAT MY FISTS!', 'w']],
    [['THE DRILLER', "NO ONE LEAVES MY MINE. IT'S DRILL TIME!", 'boss'],
     ['WANDILE', "I'M NOT SCARED OF YOUR NOISY TOY!", 'w']],
    [['HYENA', 'HEHEHE... THE CAPTAIN SAID: NO VISITORS!', 'boss'],
     ['WANDILE', 'MOVE, FURBALL. LOKI IS WAITING FOR ME!', 'w']],
    [["CAPTAIN NG'WENA", 'SWIM HOME, LITTLE HERO. THE PUP IS MINE!', 'boss'],
     ['WANDILE', 'NOBODY TAKES MY BEST FRIEND. NOBODY!', 'w']],
  ],

  init: function () {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.buildVignette();
    AudioSys.muted = localStorage.getItem('wandile_mute') === '1';
    Input.init();
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    // auto-pause when the window loses focus mid-fight
    var self2 = this;
    window.addEventListener('blur', function () {
      if (self2.state === 'play') self2.paused = true;
    });

    var last = performance.now(), acc = 0, self = this;
    var STEP = 1 / 60;
    function loop(now) {
      acc += Math.min((now - last) / 1000, 0.25);
      last = now;
      var steps = 0;
      while (acc >= STEP && steps < 5) {
        self.update(STEP);
        Input.endFrame();
        acc -= STEP;
        steps++;
      }
      self.render();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  },

  // soft vignette overlay for a graded, modern look
  buildVignette: function () {
    this.vignette = document.createElement('canvas');
    this.vignette.width = CFG.W; this.vignette.height = CFG.H;
    var vc = this.vignette.getContext('2d');
    var vg = vc.createRadialGradient(CFG.W / 2, CFG.H / 2, 110, CFG.W / 2, CFG.H / 2, 300);
    vg.addColorStop(0, 'rgba(8,6,16,0)');
    vg.addColorStop(1, 'rgba(8,6,16,0.4)');
    vc.fillStyle = vg;
    vc.fillRect(0, 0, CFG.W, CFG.H);
  },

  // adapt the internal resolution to the screen's aspect ratio so the game
  // fills the whole display — wider on phones, taller on squarer windows
  resize: function () {
    var aspect = window.innerWidth / Math.max(1, window.innerHeight);
    var W, H;
    if (aspect >= 16 / 9) {
      H = 270;
      W = Math.min(Math.round(H * aspect / 2) * 2, 648);
    } else {
      W = 480;
      H = Math.min(Math.round(W / aspect / 2) * 2, 330);
    }
    if (W !== CFG.W || H !== CFG.H || this.canvas.width !== W) {
      CFG.W = W; CFG.H = H;
      CFG.GROUND_BOTTOM = H - 12;
      this.canvas.width = W; this.canvas.height = H;
      this.ctx.imageSmoothingEnabled = false;   // canvas resize resets this
      this.buildVignette();
      if (Stages.current) Stages.prepare(Stages.idx);   // layers depend on CFG.W
    }
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    this.canvas.style.width = Math.round(W * s) + 'px';
    this.canvas.style.height = Math.round(H * s) + 'px';
  },

  setState: function (s) {
    this.state = s;
    this.stateT = 0;
  },

  // ------------------------------------------------------------ stage setup
  startStage: function (idx) {
    this.stageIdx = idx;
    Stages.prepare(idx);
    var def = Stages.current;
    var w = {
      t: 0, camX: 0, minX: 0, maxX: def.length - 8,
      player: new Player(40, 220),
      enemies: [], pickups: [], crates: [], projectiles: [], particles: [],
      waveIdx: 0, locked: false, spawnQueue: [],
      bossSpawned: false, goT: 0,
      shake: 0, hitstop: 0, dialog: null, cageOpen: false, dogX: null,
      addScore: function (n, x, y) {
        Game.score += n;
        if (x !== undefined) w.particles.push(new Particle('text', x, y, 0, -22, 0.7, '+' + n));
      },
    };
    def.crates.forEach(function (c) { w.crates.push(new Crate(c.x, c.y, c.item)); });
    def.pickups.forEach(function (p) { w.pickups.push(new Pickup(p.kind, p.x, p.y)); });
    this.world = w;
    AudioSys.playMusic(def.music);
  },

  // ----------------------------------------------------------------- update
  update: function (dt) {
    this.t += dt;
    this.stateT += dt;
    if (Input.pressed('mute')) AudioSys.toggleMute();
    if (Input.pressed('full')) {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(function () {});
    }

    switch (this.state) {
      case 'title':
        AudioSys.playMusic('title');
        if (Input.pressed('start') || Input.pressed('punch')) {
          AudioSys.sfx('select');
          this.score = 0;
          this.storyPanel = 0;
          this.setState('howto');
        }
        break;

      case 'howto':
        if (this.stateT > 0.4 && (Input.pressed('start') || Input.pressed('punch'))) {
          AudioSys.sfx('select');
          this.setState('story');
        }
        break;

      case 'story':
        if (Input.pressed('kick')) {              // skip straight to the action
          AudioSys.sfx('select');
          this.setState('card');
          this.stageIdx = 0;
          AudioSys.stopMusic();
        } else if (Input.pressed('start') || Input.pressed('punch')) {
          AudioSys.sfx('select');
          this.storyPanel++;
          if (this.storyPanel >= 3) {
            this.setState('card');
            this.stageIdx = 0;
            AudioSys.stopMusic();
          }
        }
        break;

      case 'card':
        if (this.stateT >= 2.2) {
          this.startStage(this.stageIdx);
          this.setState('play');
        }
        break;

      case 'play':
        // START doubles as pause so touch players aren't stuck (Enter/P on keyboard)
        if (Input.pressed('pause') || (Input.pressed('start') && !this.world.dialog)) {
          this.paused = !this.paused;
        }
        if (this.paused) break;
        this.updatePlay(dt);
        break;

      case 'clear':
        this.updateWorldPassive(dt);
        if (this.stateT >= 3) {
          this.stageIdx++;
          this.setState('card');
          AudioSys.stopMusic();
        }
        break;

      case 'rescue':
        this.updateRescue(dt);
        break;

      case 'gameover':
        if (Input.pressed('start') || Input.pressed('punch')) {
          AudioSys.sfx('select');
          var p = this.world.player;
          p.hp = p.maxHp; p.meter = 50;
          p.state = 'idle'; p.stateT = 0; p.invuln = 2;
          var bossAlive = this.world.enemies.some(function (e) { return e.isBoss && e.state !== 'defeated'; });
          AudioSys.playMusic(bossAlive ? 'boss' + this.stageIdx : Stages.current.music);
          this.setState('play');
        }
        break;

      case 'ending':
        if (this.stateT > 1 && Math.random() < 0.3) {
          this.world.particles.push(new Particle('confetti',
            Math.random() * CFG.W, -5,
            (Math.random() - 0.5) * 30, 40 + Math.random() * 50, 3));
        }
        this.world.particles.forEach(function (pt) { pt.update(dt); });
        this.world.particles = this.world.particles.filter(function (pt) { return !pt.dead; });
        if (this.stateT > 3 && (Input.pressed('start') || Input.pressed('punch'))) {
          AudioSys.sfx('select');
          AudioSys.stopMusic();
          this.setState('title');
        }
        break;
    }
  },

  updatePlay: function (dt) {
    var w = this.world;
    var def = Stages.current;
    var p = w.player;
    w.t += dt;
    if (w.shake > 0) w.shake -= dt;
    if (w.goT > 0) w.goT -= dt;

    // hit-stop: freeze the action for a few frames when a big hit lands
    if (w.hitstop > 0) {
      w.hitstop -= dt;
      w.particles.forEach(function (pt) { pt.update(dt); });
      return;
    }

    // boss dialogue: the world holds its breath while they talk
    if (w.dialog) {
      w.dialog.t += dt;
      if ((w.dialog.t > 0.35 && (Input.pressed('punch') || Input.pressed('start'))) || w.dialog.t > 4) {
        AudioSys.sfx('select');
        w.dialog.idx++;
        w.dialog.t = 0;
        if (w.dialog.idx >= w.dialog.lines.length) w.dialog = null;
      }
      return;
    }

    // camera follows, never backtracks
    if (!w.locked) {
      var target = clamp(p.x - CFG.W * 0.4, w.camX, def.length - CFG.W);
      w.camX = lerp(w.camX, target, clamp(dt * 5, 0, 1));
      if (target - w.camX < 0.5) w.camX = target;
    }

    // movement bounds
    w.minX = w.camX + 8;
    w.maxX = w.locked ? w.camX + CFG.W - 8 : def.length - 8;

    // wave locks
    if (!w.locked && w.waveIdx < def.waves.length && p.x >= def.waves[w.waveIdx].at) {
      w.locked = true;
      var wave = def.waves[w.waveIdx];
      wave.spawn.forEach(function (s) {
        w.spawnQueue.push({ timer: s.d, type: s.t, side: s.side });
      });
    }

    // boss trigger
    if (!w.bossSpawned && p.x >= def.boss.at) {
      w.bossSpawned = true;
      w.locked = true;
      w.camX = def.length - CFG.W;
      w.enemies.push(new Boss(def.boss.kind, w.camX + CFG.W - 60, 218));
      w.dialog = { lines: this.DIALOGS[this.stageIdx], idx: 0, t: 0 };
      AudioSys.sfx('alarm');
      AudioSys.playMusic('boss' + this.stageIdx);
    }

    // spawn queue
    for (var i = w.spawnQueue.length - 1; i >= 0; i--) {
      var s = w.spawnQueue[i];
      s.timer -= dt;
      if (s.timer <= 0) {
        var ex = s.side < 0 ? w.camX - 24 : w.camX + CFG.W + 24;
        w.enemies.push(new Enemy(s.type, ex, p.y + (Math.random() - 0.5) * 40, this.stageIdx));
        w.spawnQueue.splice(i, 1);
      }
    }

    // unlock when wave finished
    if (w.locked && !w.bossSpawned && w.spawnQueue.length === 0 && w.enemies.length === 0) {
      w.locked = false;
      w.waveIdx++;
      w.goT = 3;
      AudioSys.sfx('select');
    }

    // entity updates
    p.update(dt, w);
    w.enemies.forEach(function (e) { e.update(dt, w); });
    w.enemies = w.enemies.filter(function (e) { return !e.dead; });
    w.projectiles.forEach(function (pr) { pr.update(dt, w); });
    w.projectiles = w.projectiles.filter(function (pr) { return !pr.dead; });
    w.particles.forEach(function (pt) { pt.update(dt); });
    w.particles = w.particles.filter(function (pt) { return !pt.dead; });

    // boss defeated?
    var boss = null;
    w.enemies.forEach(function (e) { if (e.isBoss) boss = e; });
    if (boss && boss.state === 'defeated' && boss.stateT > 1.4) {
      AudioSys.stopMusic();
      AudioSys.sfx('clear');
      // clear out remaining goons politely
      w.enemies.forEach(function (e) {
        if (!e.isBoss && e.state !== 'flee') { e.hp = 0; e.state = 'dizzy'; e.stateT = 0; }
      });
      if (this.stageIdx === 3) {
        w.cageOpen = true;
        w.dogX = def.length - 52;
        AudioSys.sfx('bark');
        this.setState('rescue');
      } else {
        this.setState('clear');
      }
    }

    // player defeated?
    if (p.hp <= 0 && p.state === 'down' && p.stateT > 1.2) {
      AudioSys.stopMusic();
      AudioSys.sfx('gameover');
      if (this.score > this.hi) { this.hi = this.score; localStorage.setItem('wandile_hi', this.hi); }
      this.setState('gameover');
    }
  },

  // keep particles/fleeing goons moving during stage-clear overlay
  updateWorldPassive: function (dt) {
    var w = this.world;
    w.t += dt;
    w.enemies.forEach(function (e) { e.update(dt, w); });
    w.enemies = w.enemies.filter(function (e) { return !e.dead; });
    w.particles.forEach(function (pt) { pt.update(dt); });
    w.particles = w.particles.filter(function (pt) { return !pt.dead; });
  },

  updateRescue: function (dt) {
    var w = this.world;
    w.t += dt;
    this.updateWorldPassive(dt);
    var p = w.player;
    // Zuba runs to Wandile
    if (w.dogX > p.x + 14) {
      w.dogX -= 70 * dt;
      if (Math.random() < 0.05) AudioSys.sfx('bark');
    } else {
      p.victoryMode = true;
      if (Math.random() < 0.2) {
        w.particles.push(new Particle('confetti',
          p.x + (Math.random() - 0.5) * 80, p.y - 60 - Math.random() * 30,
          (Math.random() - 0.5) * 30, 50, 2));
      }
    }
    if (this.stateT > 4.5) {
      if (this.score > this.hi) { this.hi = this.score; localStorage.setItem('wandile_hi', this.hi); }
      AudioSys.playMusic('ending');
      this.setState('ending');
    }
  },

  // ----------------------------------------------------------------- render
  render: function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, CFG.W, CFG.H);

    switch (this.state) {
      case 'title':  UI.drawTitle(ctx, this.t, this.hi); return;
      case 'howto':  UI.drawHowTo(ctx, this.t); return;
      case 'story':  UI.drawStory(ctx, this.storyPanel, this.t); return;
      case 'card':   UI.drawStageCard(ctx, this.stageIdx, this.stateT); return;
      case 'ending': UI.drawEnding(ctx, this.stateT, this.score, this.hi);
        this.world.particles.forEach(function (pt) { pt.draw(ctx, 0); });
        return;
    }

    // world-rendering states: play / clear / rescue / gameover
    var w = this.world;
    if (!w) return;

    ctx.save();
    if (w.shake > 0) {
      ctx.translate(Math.round((Math.random() - 0.5) * 5), Math.round((Math.random() - 0.5) * 4));
    }

    Stages.draw(ctx, w.camX, w.t);

    // Zuba's cage waits at the end of the final stage
    if (this.stageIdx === 3) {
      var cageX = Stages.current.length - 52 - w.camX;
      if (cageX > -30 && cageX < CFG.W + 30) {
        Sprites.drawCage(ctx, cageX, 216, w.t, w.cageOpen);
      }
    }

    // depth-sorted drawing
    var drawables = [];
    w.crates.forEach(function (c) { if (!c.broken) drawables.push(c); });
    w.pickups.forEach(function (p) { drawables.push(p); });
    w.enemies.forEach(function (e) { drawables.push(e); });
    drawables.push(w.player);
    w.projectiles.forEach(function (p) { drawables.push(p); });
    drawables.sort(function (a, b) { return a.y - b.y; });
    drawables.forEach(function (d) { d.draw(ctx, w.camX); });

    // Zuba (rescue sequence)
    if (this.state === 'rescue' && w.dogX !== null) {
      Sprites.drawDog(ctx, w.dogX - w.camX, 218, -1, w.t, true);
      if (w.player.victoryMode) Sprites.drawHeart(ctx, w.player.x - w.camX + 12, w.player.y - 48);
    }

    w.particles.forEach(function (pt) { pt.draw(ctx, w.camX); });
    ctx.restore();

    ctx.drawImage(this.vignette, 0, 0);
    UI.drawHUD(ctx, w, this.score, this.hi, Stages.current);
    if (w.goT > 0 && !w.locked) UI.drawGo(ctx, w.t);
    if (w.dialog) UI.drawDialog(ctx, w.dialog, w);
    if (this.state === 'clear') UI.drawStageClear(ctx, this.stateT, this.score);
    if (this.state === 'gameover') UI.drawGameOver(ctx, this.stateT);
    if (this.paused && this.state === 'play') UI.drawPause(ctx);
  },
};

window.addEventListener('load', function () { Game.init(); });
