// WANDILE — bitmap pixel font, HUD and full-screen menus
var UI = {

  // 5x7 pixel font — each glyph is 7 rows of 5 bits (MSB = leftmost pixel)
  FONT: {
    A: [14,17,17,31,17,17,17], B: [30,17,17,30,17,17,30], C: [14,17,16,16,16,17,14],
    D: [30,17,17,17,17,17,30], E: [31,16,30,16,16,16,31], F: [31,16,30,16,16,16,16],
    G: [14,17,16,23,17,17,15], H: [17,17,17,31,17,17,17], I: [31,4,4,4,4,4,31],
    J: [7,2,2,2,2,18,12],      K: [17,18,20,24,20,18,17], L: [16,16,16,16,16,16,31],
    M: [17,27,21,21,17,17,17], N: [17,25,21,19,17,17,17], O: [14,17,17,17,17,17,14],
    P: [30,17,17,30,16,16,16], Q: [14,17,17,17,21,18,13], R: [30,17,17,30,20,18,17],
    S: [15,16,16,14,1,1,30],   T: [31,4,4,4,4,4,4],       U: [17,17,17,17,17,17,14],
    V: [17,17,17,17,10,10,4],  W: [17,17,17,21,21,27,17], X: [17,17,10,4,10,17,17],
    Y: [17,17,10,4,4,4,4],     Z: [31,1,2,4,8,16,31],
    '0': [14,17,19,21,25,17,14], '1': [4,12,4,4,4,4,31],   '2': [14,17,1,2,4,8,31],
    '3': [31,2,4,2,1,17,14],     '4': [2,6,10,18,31,2,2],  '5': [31,16,30,1,1,17,14],
    '6': [6,8,16,30,17,17,14],   '7': [31,1,2,4,8,8,8],    '8': [14,17,17,14,17,17,14],
    '9': [14,17,17,15,1,2,12],
    ' ': [0,0,0,0,0,0,0],   '!': [4,4,4,4,4,0,4],   '?': [14,17,1,2,4,0,4],
    '.': [0,0,0,0,0,12,12], ',': [0,0,0,0,0,12,8],  ':': [0,12,12,0,12,12,0],
    "'": [4,4,8,0,0,0,0],   '-': [0,0,0,14,0,0,0],  '+': [0,4,4,31,4,4,0],
    '/': [1,1,2,4,8,16,16], '(': [2,4,8,8,8,4,2],   ')': [8,4,2,2,2,4,8],
    '#': [10,10,31,10,31,10,10], '>': [8,4,2,1,2,4,8], '<': [2,4,8,16,8,4,2],
    '=': [0,0,31,0,31,0,0],
  },

  // draw text in the pixel font. scale 1 = 7px tall glyphs.
  text: function (ctx, str, x, y, scale, color, align) {
    var s = Math.max(1, Math.round(scale || 1));
    str = String(str).toUpperCase().replace(/—/g, '-');
    var w = str.length * 6 * s - s;
    if (align === 'center') x -= Math.round(w / 2);
    else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    this.raw(ctx, str, x + s, y + s, s, 'rgba(0,0,0,0.6)');
    this.raw(ctx, str, x, y, s, color || '#fff');
  },

  raw: function (ctx, str, x, y, s, color) {
    ctx.fillStyle = color;
    for (var i = 0; i < str.length; i++) {
      var g = this.FONT[str[i]];
      if (g) {
        for (var r = 0; r < 7; r++) {
          var row = g[r];
          for (var c = 0; c < 5; c++) {
            if (row & (16 >> c)) ctx.fillRect(x + c * s, y + r * s, s, s);
          }
        }
      }
      x += 6 * s;
    }
  },

  textW: function (str, scale) { return String(str).length * 6 * scale - scale; },

  bar: function (ctx, x, y, w, h, frac, fg, bg) {
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = bg || '#3a3a44';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fg;
    ctx.fillRect(x, y, Math.max(0, Math.round(w * clamp(frac, 0, 1))), h);
  },

  flagStripe: function (ctx, x, y, w, h) {  // Zambia flag colors
    var seg = Math.floor(w / 4);
    ctx.fillStyle = '#198a00'; ctx.fillRect(x, y, seg, h);
    ctx.fillStyle = '#de2010'; ctx.fillRect(x + seg, y, seg, h);
    ctx.fillStyle = '#000';    ctx.fillRect(x + seg * 2, y, seg, h);
    ctx.fillStyle = '#ef7d00'; ctx.fillRect(x + seg * 3, y, w - seg * 3, h);
  },

  isTouch: function () {
    var el = document.getElementById('touch');
    return el && el.classList.contains('on');
  },

  // ------------------------------------------------------------------- HUD
  drawHUD: function (ctx, world, score, hi, stageDef) {
    var p = world.player;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, CFG.W, 27);
    Sprites.drawPortrait(ctx, 4, 4);
    this.text(ctx, 'WANDILE', 24, 3, 1, '#ffd23c');
    this.bar(ctx, 24, 12, 64, 5, p.hp / p.maxHp, p.hp > 30 ? '#3ad65c' : '#e8483a');
    var full = p.meter >= 50;
    this.bar(ctx, 24, 20, 64, 3, p.meter / 100,
      full && Math.floor(world.t * 6) % 2 ? '#fff' : '#ef7d00');
    if (full) this.text(ctx, 'EAGLE READY!', 94, 17, 1, '#ef7d00');

    this.text(ctx, 'SCORE ' + String(score).padStart(6, '0'), CFG.W - 4, 3, 1, '#fff', 'right');
    this.text(ctx, 'HI ' + String(hi).padStart(6, '0'), CFG.W - 4, 13, 1, '#9aa1ab', 'right');
    this.text(ctx, stageDef.name, CFG.W / 2, 3, 1, '#9aa1ab', 'center');
    if (AudioSys.muted) this.text(ctx, 'MUTED', CFG.W / 2, 13, 1, '#666', 'center');

    // boss health bar
    var boss = null;
    for (var i = 0; i < world.enemies.length; i++) if (world.enemies[i].isBoss) boss = world.enemies[i];
    if (boss && boss.state !== 'defeated') {
      this.text(ctx, boss.def.name, CFG.W / 2, CFG.H - 19, 1, '#ff8a7a', 'center');
      this.bar(ctx, CFG.W / 2 - 70, CFG.H - 9, 140, 5, boss.hp / boss.maxHp, '#e8483a');
    }

    // weapon indicator
    if (p.weapon) {
      Sprites.drawItem(ctx, p.weapon, 104, 14, 0);
      this.text(ctx, 'X' + p.weaponUses, 112, 7, 1, '#fff');
    }
  },

  drawGo: function (ctx, t) {
    if (Math.floor(t * 3) % 2) {
      this.text(ctx, 'GO', CFG.W - 56, CFG.H / 2 - 8, 2, '#ffd23c');
      ctx.fillStyle = '#ffd23c';
      ctx.fillRect(CFG.W - 28, CFG.H / 2 - 2, 9, 4);
      ctx.fillRect(CFG.W - 19, CFG.H / 2 - 5, 3, 10);
      ctx.fillRect(CFG.W - 16, CFG.H / 2 - 3, 3, 6);
      ctx.fillRect(CFG.W - 13, CFG.H / 2 - 1, 3, 2);
    }
  },

  // boss / hero pre-fight dialogue box
  drawDialog: function (ctx, dialog, world) {
    var line = dialog.lines[dialog.idx];
    if (!line) return;
    var isBoss = line[2] === 'boss';
    var py = CFG.H - 62;
    ctx.fillStyle = 'rgba(10,10,20,0.92)';
    ctx.fillRect(8, py, CFG.W - 16, 54);
    ctx.fillStyle = isBoss ? '#e8483a' : '#ffd23c';
    ctx.fillRect(8, py, CFG.W - 16, 2);

    // speaker portrait
    var boss = null;
    for (var i = 0; i < world.enemies.length; i++) if (world.enemies[i].isBoss) boss = world.enemies[i];
    if (isBoss && boss) {
      if (boss.kind === 'driller') {
        Sprites.drawDriller(ctx, 40, py + 48, 1, 'idle', world.t + dialog.t, false);
      } else {
        Sprites.drawFighter(ctx, {
          x: 40, y: py + 49, facing: 1, pose: 'idle', t: world.t + dialog.t,
          c: boss.colors, headMode: boss.colors.headMode,
          spots: boss.kind === 'hyena', hat: boss.kind === 'ngwena', broom: boss.kind === 'mongoose',
        });
      }
    } else {
      Sprites.drawFighter(ctx, {
        x: 40, y: py + 49, facing: 1, pose: 'punch1', t: world.t + dialog.t, c: Sprites.WANDILE,
      });
    }

    this.text(ctx, line[0], 76, py + 9, 1, isBoss ? '#ff8a7a' : '#ffd23c');
    this.text(ctx, line[1], 76, py + 24, 1, '#fff');
    if (Math.floor((world.t + dialog.t) * 3) % 2) {
      this.text(ctx, this.isTouch() ? 'PUNCH >' : 'J >', CFG.W - 16, py + 42, 1, '#9aa1ab', 'right');
    }
  },

  // ----------------------------------------------------------------- title
  drawTitle: function (ctx, t, hi) {
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    for (var x = 0; x < CFG.W; x += 30) {
      var h = 20 + hash2(x, 5) * 40;
      ctx.fillStyle = '#1a1a26';
      ctx.fillRect(x, 200 - h, 26, h);
    }
    ctx.fillStyle = '#16161f';
    ctx.fillRect(0, 200, CFG.W, 70);

    var logoW = this.textW('WANDILE', 5);
    this.flagStripe(ctx, CFG.W / 2 - logoW / 2 - 10, 52, logoW + 20, 4);
    this.raw(ctx, 'WANDILE', Math.round(CFG.W / 2 - logoW / 2) + 3, 67, 5, '#7a1515');
    this.raw(ctx, 'WANDILE', Math.round(CFG.W / 2 - logoW / 2), 64, 5, '#ffd23c');
    this.flagStripe(ctx, CFG.W / 2 - logoW / 2 - 10, 106, logoW + 20, 4);
    this.text(ctx, "A ZAMBIAN BEAT 'EM UP", CFG.W / 2, 118, 1, '#9aa1ab', 'center');
    if (hi > 0) this.text(ctx, 'HI SCORE ' + hi, CFG.W / 2, 136, 1, '#ef7d00', 'center');

    Sprites.drawFighter(ctx, { x: CFG.W / 2 - 16, y: 218, facing: 1, pose: 'idle', t: t, c: Sprites.WANDILE });
    Sprites.drawDog(ctx, CFG.W / 2 + 12, 218, -1, t, true);

    if (Math.floor(t * 2) % 2) {
      this.text(ctx, this.isTouch() ? 'TAP START' : 'PRESS ENTER', CFG.W / 2, 238, 2, '#fff', 'center');
    }
    this.text(ctx, 'MADE WITH LOVE FOR WANDILE', CFG.W / 2, 260, 1, '#555', 'center');
  },

  // ----------------------------------------------------------- how to play
  drawHowTo: function (ctx, t) {
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    this.flagStripe(ctx, CFG.W / 2 - 80, 10, 160, 3);
    this.text(ctx, 'HOW TO PLAY', CFG.W / 2, 20, 2, '#ffd23c', 'center');

    var touch = this.isTouch();
    var lines = touch ? [
      ['MOVE',      'LEFT PAD'],
      ['PUNCH',     'P  (3 HITS = COMBO)'],
      ['KICK',      'K  (KNOCKS GOONS DOWN)'],
      ['JUMP',      'J  (+ PUNCH IN AIR = JUMP KICK)'],
      ['EAGLE STRIKE', 'STAR BUTTON, WHEN THE BAR FLASHES'],
    ] : [
      ['MOVE',      'ARROW KEYS OR WASD'],
      ['PUNCH',     'J  (3 HITS = COMBO)'],
      ['KICK',      'K  (KNOCKS GOONS DOWN)'],
      ['JUMP',      'SPACE  (+ PUNCH IN AIR = JUMP KICK)'],
      ['EAGLE STRIKE', 'L, WHEN THE ORANGE BAR FLASHES'],
      ['PAUSE / MUTE / FULL', 'P / M / F'],
    ];
    var y = 46;
    for (var i = 0; i < lines.length; i++) {
      this.text(ctx, lines[i][0], 150, y, 1, '#ef7d00', 'right');
      this.text(ctx, lines[i][1], 166, y, 1, '#fff');
      y += 14;
    }
    // the eagle itself, swooping in over the demo
    Sprites.drawEagle(ctx, 380, 72, 1, t);

    // little demo: Wandile bops a goon (right side, clear of the text)
    var demoPose = Math.floor(t * 2) % 2 ? 'punch1' : 'idle';
    Sprites.drawFighter(ctx, { x: 408, y: 112, facing: 1, pose: demoPose, t: t, c: Sprites.WANDILE });
    Sprites.drawFighter(ctx, {
      x: 442, y: 112, facing: -1, pose: demoPose === 'punch1' ? 'hurt' : 'idle', t: t,
      c: { skin: '#b97a4e', head: Sprites.CROC_GREEN, headD: Sprites.CROC_GREEN_D, shirt: '#7b52b8', shirtD: '#23252b', pants: '#33363c', shoes: '#8f949b' },
      headMode: 'croc',
    });

    // snacks & weapons
    this.text(ctx, 'BREAK CRATES! ZAMBIAN SNACKS HEAL YOU:', CFG.W / 2, 158, 1, '#3ad65c', 'center');
    var items = [['fritter', 'VITUMBUWA +25'], ['maheu', 'MAHEU +50'], ['nshima', 'NSHIMA FULL!']];
    var ix = CFG.W / 2 - 150;
    for (var k = 0; k < 3; k++) {
      Sprites.drawItem(ctx, items[k][0], ix + 30, 184, 0);
      this.text(ctx, items[k][1], ix + 40, 176, 1, '#fff');
      ix += 105;
    }
    this.text(ctx, 'GRAB A STICK, POT LID OR FOOTBALL TO FIGHT WITH:', CFG.W / 2, 202, 1, '#3ad65c', 'center');
    Sprites.drawItem(ctx, 'stick', CFG.W / 2 - 30, 224, 0);
    Sprites.drawItem(ctx, 'lid', CFG.W / 2, 225, 0);
    Sprites.drawItem(ctx, 'ball', CFG.W / 2 + 30, 225, 0);

    if (Math.floor(t * 2) % 2) {
      this.text(ctx, touch ? 'TAP START OR PUNCH' : 'PRESS ENTER', CFG.W / 2, 246, 1, '#ffd23c', 'center');
    }
  },

  // ----------------------------------------------------------------- story
  STORY: [
    { cap1: 'LUSAKA, ZAMBIA. WANDILE AND HIS PUPPY', cap2: 'LOKI DO EVERYTHING TOGETHER.' },
    { cap1: 'BUT THE CROCODILE GANG GRABBED LOKI!', cap2: "THEY'RE HEADING FOR VICTORIA FALLS..." },
    { cap1: 'NOBODY TAKES LOKI. NOBODY.', cap2: 'TIME TO FIGHT!' },
  ],

  drawStory: function (ctx, panel, t) {
    ctx.fillStyle = '#101018';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    ctx.fillStyle = '#1c1c28';
    ctx.fillRect(90, 36, 300, 130);
    ctx.strokeStyle = '#ffd23c';
    ctx.strokeRect(90.5, 36.5, 300, 130);

    var cx = CFG.W / 2;
    if (panel === 0) {
      ctx.fillStyle = '#2a3a4a'; ctx.fillRect(91, 37, 298, 90);
      ctx.fillStyle = '#3d4a3a'; ctx.fillRect(91, 127, 298, 38);
      Sprites.drawFighter(ctx, { x: cx - 20, y: 151, facing: 1, pose: 'idle', t: t, c: Sprites.WANDILE });
      Sprites.drawDog(ctx, cx + 14, 151, -1, t, true);
      Sprites.drawHeart(ctx, cx - 2, 106);
    } else if (panel === 1) {
      ctx.fillStyle = '#3a2330'; ctx.fillRect(91, 37, 298, 128);
      var gx = cx + 30 + (t * 30) % 40;
      Sprites.drawFighter(ctx, {
        x: gx, y: 151, facing: 1, pose: 'walk', t: t,
        c: { skin: '#b97a4e', head: Sprites.CROC_GREEN, headD: Sprites.CROC_GREEN_D, shirt: '#5f6670', shirtD: '#23252b', pants: '#33363c', shoes: '#8f949b' },
        headMode: 'croc',
      });
      Sprites.drawCage(ctx, gx - 26, 148, t, false);
      Sprites.drawFighter(ctx, { x: cx - 90, y: 151, facing: 1, pose: 'hurt', t: t, c: Sprites.WANDILE });
      this.text(ctx, '!', cx - 92, 90, 2, '#ffd23c', 'center');
    } else {
      ctx.fillStyle = '#401818'; ctx.fillRect(91, 37, 298, 128);
      Sprites.drawFighter(ctx, { x: cx, y: 156, facing: 1, pose: 'punch3', t: t, c: Sprites.WANDILE, scale: 1.6 });
    }

    var s = this.STORY[panel];
    this.text(ctx, s.cap1, cx, 180, 1, '#fff', 'center');
    this.text(ctx, s.cap2, cx, 194, 1, '#fff', 'center');
    this.text(ctx, (panel + 1) + ' / 3', cx, 214, 1, '#666', 'center');
    if (Math.floor(t * 2) % 2) {
      this.text(ctx, this.isTouch() ? 'PUNCH = NEXT   KICK = SKIP' : 'J = NEXT   K = SKIP STORY', cx, 240, 1, '#ffd23c', 'center');
    }
  },

  // ----------------------------------------------------------- transitions
  drawStageCard: function (ctx, idx, t) {
    var def = Stages.DEFS[idx];
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    this.flagStripe(ctx, CFG.W / 2 - 70, 92, 140, 3);
    this.text(ctx, 'STAGE ' + (idx + 1), CFG.W / 2, 104, 2, '#ffd23c', 'center');
    this.text(ctx, def.name, CFG.W / 2, 128, 2, '#fff', 'center');
    this.text(ctx, def.sub, CFG.W / 2, 150, 1, '#9aa1ab', 'center');
    this.flagStripe(ctx, CFG.W / 2 - 70, 166, 140, 3);
  },

  drawStageClear: function (ctx, t, score) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, CFG.H / 2 - 30, CFG.W, 56);
    this.text(ctx, 'STAGE CLEAR!', CFG.W / 2, CFG.H / 2 - 20, 2, '#ffd23c', 'center');
    this.text(ctx, 'SCORE ' + score, CFG.W / 2, CFG.H / 2 + 4, 1, '#fff', 'center');
  },

  drawGameOver: function (ctx, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    this.text(ctx, 'GAME OVER', CFG.W / 2, 96, 3, '#e8483a', 'center');
    this.text(ctx, 'LOKI STILL NEEDS YOU!', CFG.W / 2, 134, 1, '#9aa1ab', 'center');
    if (Math.floor(t * 2) % 2) {
      this.text(ctx, this.isTouch() ? 'TAP START TO CONTINUE' : 'PRESS ENTER TO CONTINUE', CFG.W / 2, 156, 1, '#fff', 'center');
    }
  },

  drawEnding: function (ctx, t, score, hi) {
    ctx.fillStyle = '#101a2a';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    for (var i = 0; i < 40; i++) {
      var sx = hash2(i, 3) * CFG.W, sy = hash2(i, 4) * 120;
      ctx.fillStyle = hash2(i, 5) > 0.8 ? '#fff' : '#5a6a8a';
      ctx.fillRect(Math.floor(sx), Math.floor(sy), 1, 1);
    }
    ctx.fillStyle = '#16243a';
    ctx.fillRect(0, 190, CFG.W, 80);

    this.text(ctx, 'YOU SAVED LOKI!', CFG.W / 2, 46, 3, '#ffd23c', 'center');

    Sprites.drawFighter(ctx, { x: CFG.W / 2 - 14, y: 190, facing: 1, pose: 'victory', t: t, c: Sprites.WANDILE });
    Sprites.drawDog(ctx, CFG.W / 2 + 16, 190, -1, t, true);
    Sprites.drawHeart(ctx, CFG.W / 2 + 2, 140 + Math.floor(Math.sin(t * 3) * 3));

    this.text(ctx, 'FINAL SCORE ' + score, CFG.W / 2, 210, 1, '#fff', 'center');
    if (score >= hi && score > 0) this.text(ctx, 'NEW HI SCORE!', CFG.W / 2, 224, 1, '#ef7d00', 'center');
    this.text(ctx, 'THE HERO OF ZAMBIA WALKS HOME WITH HIS BEST FRIEND.', CFG.W / 2, 242, 1, '#9aa1ab', 'center');
    if (t > 3 && Math.floor(t * 2) % 2) {
      this.text(ctx, this.isTouch() ? 'TAP START' : 'PRESS ENTER', CFG.W / 2, 256, 1, '#fff', 'center');
    }
  },

  drawPause: function (ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    this.text(ctx, 'PAUSED', CFG.W / 2, CFG.H / 2 - 40, 2, '#fff', 'center');
    this.text(ctx, this.isTouch() ? 'TAP START TO RESUME' : 'P TO RESUME', CFG.W / 2, CFG.H / 2 - 16, 1, '#9aa1ab', 'center');
    this.text(ctx, 'J PUNCH   K KICK   SPACE JUMP   L EAGLE', CFG.W / 2, CFG.H / 2 + 4, 1, '#666', 'center');
    this.text(ctx, 'M MUTE   F FULLSCREEN', CFG.W / 2, CFG.H / 2 + 18, 1, '#666', 'center');
  },
};
