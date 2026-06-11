// WANDILE — procedural pixel-art sprites.
// Fighters are drawn from rects with feet at local (0,0), up = -y.
// Facing is handled by a horizontal flip, so "forward" is always +x here.
// Characters are composited through fx() which adds a dark 1px outline and
// an optional white hit-flash — the "modern pixel art" pass.
var Sprites = {

  WANDILE: {
    skin: '#cf9663', skinD: '#aa7448', hair: '#1c130b', hairL: '#3a2a16',
    shirt: '#d62828', shirtD: '#9c1d1d', shirtL: '#ef4444',
    pants: '#3a5ba0', pantsD: '#2b4276', pantsL: '#4f74c4',
    shoes: '#f2f2f2', shoesD: '#c4c4c4', laces: '#d62828',
    belt: '#2a2118', buckle: '#caa84f',
    headMode: 'human',
  },

  CROC_GREEN: '#4f9e3f',
  CROC_GREEN_D: '#39752c',

  // --------------------------------------------------- outline + flash pass
  _sc: null, _si: null, FXW: 112, FXH: 88, FXOX: 56, FXOY: 80,

  fx: function (ctx, x, y, flash, bodyFn) {
    if (!this._sc) {
      this._sc = document.createElement('canvas');
      this._sc.width = this.FXW; this._sc.height = this.FXH;
      this._si = document.createElement('canvas');
      this._si.width = this.FXW; this._si.height = this.FXH;
    }
    var sc = this._sc.getContext('2d');
    sc.clearRect(0, 0, this.FXW, this.FXH);
    sc.save();
    sc.translate(this.FXOX, this.FXOY);
    bodyFn(sc);
    sc.restore();

    var si = this._si.getContext('2d');
    si.globalCompositeOperation = 'source-over';
    si.clearRect(0, 0, this.FXW, this.FXH);
    si.fillStyle = '#14101c';
    si.fillRect(0, 0, this.FXW, this.FXH);
    si.globalCompositeOperation = 'destination-in';
    si.drawImage(this._sc, 0, 0);

    var px = Math.round(x) - this.FXOX, py = Math.round(y) - this.FXOY;
    ctx.drawImage(this._si, px - 1, py);
    ctx.drawImage(this._si, px + 1, py);
    ctx.drawImage(this._si, px, py - 1);
    ctx.drawImage(this._si, px, py + 1);
    ctx.drawImage(this._sc, px, py);

    if (flash) {
      si.globalCompositeOperation = 'source-over';
      si.fillStyle = '#ffffff';
      si.fillRect(0, 0, this.FXW, this.FXH);
      si.globalCompositeOperation = 'destination-in';
      si.drawImage(this._sc, 0, 0);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(this._si, px, py);
      ctx.globalAlpha = 1;
    }
  },

  // ---------------------------------------------------------------- fighter
  // o: { x, y, facing, pose, t, c, scale, headMode, hat, spots, broom, flash }
  drawFighter: function (ctx, o) {
    var self = this;
    this.fx(ctx, o.x, o.y, o.flash, function (sc) { self.fighterBody(sc, o); });
  },

  fighterBody: function (ctx, o) {
    var c = o.c;
    var s = o.scale || 1;
    var t = o.t || 0;
    ctx.scale((o.facing || 1) * s, s);
    var r = function (x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); };

    var headMode = o.headMode || c.headMode || 'human';
    var headCol = c.head || c.skin;

    var head = function (hx, hy) {
      if (headMode === 'croc') {
        r(hx, hy, 8, 8, headCol);
        r(hx + 7, hy + 3, 5, 3, headCol);              // snout
        r(hx + 7, hy + 5, 5, 1, c.headD || Sprites.CROC_GREEN_D);
        r(hx + 11, hy + 3, 1, 1, '#1a2e12');           // nostril
        r(hx + 3, hy + 1, 3, 2, '#fff');               // bulgy eye
        r(hx + 5, hy + 2, 1, 1, '#000');
        r(hx + 7, hy + 6, 4, 1, '#e8e4d0');            // little teeth
        r(hx, hy + 6, 7, 2, c.headD || Sprites.CROC_GREEN_D);
        r(hx, hy, 2, 6, c.headD || Sprites.CROC_GREEN_D); // back-of-head shade
      } else if (headMode === 'beast') {
        r(hx - 1, hy - 3, 3, 4, headCol);              // ears
        r(hx + 4, hy - 3, 3, 4, headCol);
        r(hx, hy - 3, 1, 2, c.headD || '#5e4426');     // inner ear
        r(hx, hy, 8, 7, headCol);
        r(hx + 6, hy + 3, 5, 3, headCol);              // muzzle
        r(hx + 6, hy + 5, 5, 1, c.headD || '#5e4426');
        r(hx + 10, hy + 3, 1, 1, '#000');              // nose
        r(hx + 3, hy + 1, 2, 2, '#fff');
        r(hx + 4, hy + 2, 1, 1, '#000');
        r(hx, hy + 1, 1, 6, c.headD || '#5e4426');     // shade
        if (o.spots) { r(hx + 1, hy + 4, 1, 1, '#3d2c18'); r(hx + 5, hy, 1, 1, '#3d2c18'); }
      } else {
        r(hx, hy, 8, 8, c.skin);
        r(hx, hy + 4, 2, 4, c.skinD);                  // jaw shade at back
        r(hx + 7, hy + 2, 1, 4, c.skinD);              // brow-to-chin profile shade
        r(hx - 1, hy - 2, 9, 3, c.hair);               // short hair with volume
        r(hx - 1, hy + 1, 2, 4, c.hair);               // back of head
        r(hx + 1, hy - 2, 5, 1, c.hairL || '#3a2a16'); // hair highlight
        r(hx + 6, hy - 1, 2, 1, c.hair);               // hairline at temple
        r(hx - 1, hy + 4, 1, 3, c.skinD);              // ear
        r(hx + 4, hy + 2, 3, 1, c.hair);               // brow
        r(hx + 4, hy + 3, 3, 2, '#fff');               // eye white
        r(hx + 6, hy + 3, 1, 2, '#241910');            // pupil, looking ahead
        r(hx + 4, hy + 6, 3, 1, '#8a5638');            // mouth
        r(hx + 3, hy + 7, 4, 1, c.skinD);              // chin shade
      }
      if (o.hat) {                                      // captain's hat
        r(hx - 2, hy - 2, 11, 2, '#1a2a4a');
        r(hx, hy - 5, 8, 3, '#1a2a4a');
        r(hx + 1, hy - 3, 6, 1, '#e8c542');
      }
    };

    var torso = function (tx, ty) {
      r(tx, ty, 10, 11, c.shirt);
      r(tx, ty, 2, 11, c.shirtD);                       // shaded side
      if (c.shirtL) r(tx + 8, ty + 1, 2, 8, c.shirtL);  // lit side
      r(tx + 2, ty, 6, 1, c.shirtD);                    // collar
      r(tx + 4, ty, 2, 1, c.skin);                      // neck
      if (c.belt) {
        r(tx, ty + 9, 10, 2, c.belt);                   // belt
        r(tx + 4, ty + 9, 2, 2, c.buckle || '#caa84f'); // buckle
      } else {
        r(tx, ty + 9, 10, 2, c.shirtD);                 // hem
      }
      if (o.spots) { r(tx + 2, ty + 2, 2, 2, '#3d2c18'); r(tx + 6, ty + 5, 2, 2, '#3d2c18'); }
    };

    var armV = function (sx, sy) {              // hanging arm: short sleeve, bare forearm
      r(sx, sy, 3, 4, c.shirt);                 // sleeve
      r(sx, sy + 3, 3, 1, c.shirtD);
      r(sx, sy + 4, 3, 4, c.skin);              // forearm
      r(sx, sy + 7, 1, 3, c.skinD);
      r(sx, sy + 8, 3, 2, c.skin);              // hand
    };
    var armH = function (sx, sy, len) {          // arm punched forward
      r(sx, sy, 4, 3, c.shirt);                  // sleeve at the shoulder
      r(sx, sy + 2, 4, 1, c.shirtD);
      r(sx + 4, sy, len - 4, 3, c.skin);         // bare arm
      r(sx + 4, sy + 2, len - 4, 1, c.skinD);
      r(sx + len, sy, 3, 3, c.skin);             // fist
      r(sx + len, sy + 2, 3, 1, c.skinD);
    };
    var armUp = function (sx, sy) {              // arm raised
      r(sx, sy - 4, 3, 4, c.shirt);              // sleeve
      r(sx, sy - 8, 3, 4, c.skin);               // forearm
      r(sx + 2, sy - 8, 1, 4, c.skinD);
      r(sx, sy - 10, 3, 2, c.skin);              // hand
    };
    var shoe = function (sx, w) {
      r(sx, -3, w, 3, c.shoes);
      r(sx, -1, w, 1, c.shoesD);                          // sole
      if (c.laces) r(sx + w - 3, -3, 2, 1, c.laces);      // lace accent
    };
    var legPair = function (bx, fx2) {
      r(bx, -13, 3, 11, c.pants);
      r(fx2, -13, 3, 11, c.pants);
      if (c.pantsL) { r(bx + 2, -13, 1, 8, c.pantsL); r(fx2 + 2, -13, 1, 8, c.pantsL); } // seam highlight
      r(bx, -8, 3, 1, c.pantsD); r(fx2, -8, 3, 1, c.pantsD);   // knee shade
      r(bx, -5, 3, 2, c.pantsD); r(fx2, -5, 3, 2, c.pantsD);   // cuff
    };
    var legsStand = function () {
      legPair(-4, 1);
      shoe(-5, 5); shoe(1, 6);
    };
    var legsWalk = function (f) {                // f: 0..3
      var off = [3, 1, -2, 1][f];
      legPair(-4 - off, 1 + off);
      shoe(-5 - off, 5); shoe(1 + off, 6);
    };
    var broom = function (mode) {
      if (!o.broom) return;
      if (mode === 'swing') {
        r(5, -20, 14, 2, '#8a5a2b');
        r(19, -24, 4, 9, '#caa84f');
        r(19, -24, 4, 2, '#a8852e');
      } else {
        r(6, -28, 2, 18, '#8a5a2b');
        r(4, -33, 6, 6, '#caa84f');
      }
    };

    var hand = null;   // front-hand position — held weapons are drawn here
    var f, bob;
    switch (o.pose) {
      case 'walk':
      case 'flee':
        f = Math.floor(t * (o.pose === 'flee' ? 14 : 9)) % 4;
        legsWalk(f);
        torso(-5, -24); head(-4, -32);
        armV(-7, -23 + (f % 2)); armV(5, -23 + ((f + 1) % 2));
        broom('hold');
        hand = [5, -14];
        break;

      case 'run':
        f = Math.floor(t * 12) % 4;
        legsWalk(f);
        torso(-4, -23); head(-2, -31);          // leaning forward
        armH(3, -21, 5); armV(-6, -22);
        hand = [8, -20];
        break;

      case 'punch1':
        legsStand();
        torso(-5, -24); head(-4, -32);
        armH(3, -21, 8); armV(-7, -23);
        broom('hold');
        hand = [11, -20];
        break;

      case 'punch2':
        legsStand();
        torso(-4, -24); head(-3, -32);
        armH(3, -19, 9); armV(-6, -23);
        broom('hold');
        hand = [12, -18];
        break;

      case 'punch3':
      case 'sweep':
        legsWalk(0);
        torso(-3, -24); head(-2, -32);
        armH(4, -21, 11); armV(-5, -23);
        broom('swing');
        hand = [15, -20];
        break;

      case 'kick':
        r(-4, -13, 3, 11, c.pants);              // standing leg
        r(-4, -5, 3, 2, c.pantsD);
        r(-5, -3, 5, 3, c.shoes); r(-5, -1, 5, 1, c.shoesD);
        r(1, -16, 11, 3, c.pants);               // kicking leg
        r(1, -14, 11, 1, c.pantsD);
        r(12, -17, 4, 4, c.shoes);
        r(14, -17, 2, 4, c.shoesD);              // sole facing the goon
        torso(-6, -25); head(-5, -33);
        armV(-8, -24); armUp(4, -25);
        hand = [4, -33];
        break;

      case 'jump':
        r(-4, -13, 3, 8, c.pants); r(1, -13, 3, 8, c.pants);   // tucked legs
        r(-5, -6, 5, 3, c.shoes); r(1, -6, 6, 3, c.shoes);
        torso(-5, -24); head(-4, -32);
        armUp(-7, -23); armUp(5, -23);
        hand = [5, -31];
        break;

      case 'jumpkick':
        r(-6, -11, 3, 7, c.pants); r(-7, -5, 5, 3, c.shoes);   // tucked back leg
        r(1, -16, 12, 3, c.pants); r(13, -17, 4, 4, c.shoes);  // extended leg
        torso(-6, -25); head(-5, -33);
        armV(-8, -24); armH(3, -22, 6);
        hand = [9, -21];
        break;

      case 'hurt':
        legsWalk(1);
        torso(-7, -23); head(-7, -31);
        armUp(-9, -23); armUp(3, -21);
        r(-3, -27, 2, 2, '#000');                // "ow" open mouth
        break;

      case 'down':                               // lying on back, head forward
        r(-15, -5, 10, 3, c.pants);
        r(-18, -5, 3, 3, c.shoes);
        r(-5, -7, 12, 6, c.shirt);
        r(-5, -3, 12, 2, c.shirtD);
        r(7, -7, 7, 6, c.skin);
        r(12, -8, 3, 8, c.hair || '#222');
        break;

      case 'summon':                             // calling the eagle — arm to the sky
        legsStand();
        torso(-5, -24); head(-4, -33);
        armV(-7, -23);
        r(3, -33, 3, 10, c.shirt);               // raised arm
        r(3, -36, 3, 3, c.skin);                 // fist up
        hand = [3, -35];
        break;

      case 'throw':
        legsStand();
        torso(-5, -24); head(-4, -32);
        armV(-7, -23);
        if (t < 0.15) { armUp(4, -24); hand = [4, -32]; }
        else { armH(3, -23, 9); hand = [12, -22]; }
        break;

      case 'victory':
        bob = Math.floor(t * 6) % 2;
        legsStand();
        torso(-5, -24 - bob); head(-4, -32 - bob);
        armUp(-7, -24 - bob); armUp(5, -24 - bob);
        hand = [5, -32 - bob];
        break;

      case 'dizzy':
        legsWalk(1);
        torso(-5, -23); head(-4 + (Math.floor(t * 8) % 2 ? 1 : -1), -31);
        armV(-7, -22); armV(5, -22);
        hand = [5, -13];
        break;

      default: // idle
        bob = Math.floor(t * 2.5) % 2;
        legsStand();
        torso(-5, -24 + bob); head(-4, -32 + bob);
        armV(-7, -23 + bob); armV(5, -23 + bob);
        broom('hold');
        hand = [5, -14 + bob];
    }

    // held weapon follows the front hand and swings with punches
    if (o.weapon && hand) {
      var hx = hand[0], hy = hand[1];
      var swing = o.pose === 'punch1' || o.pose === 'punch2' || o.pose === 'punch3';
      if (o.weapon === 'stick') {
        if (swing) {
          r(hx, hy - 1, 12, 2, '#8a5a2b');
          r(hx + 10, hy - 2, 3, 2, '#a8743c');   // tip catches the light
        } else {
          r(hx + 2, hy - 3, 2, 12, '#8a5a2b');   // resting upright in the grip
          r(hx + 2, hy - 3, 2, 2, '#6e4421');
        }
      } else if (o.weapon === 'lid') {
        ctx.fillStyle = '#a7adb5';
        ctx.beginPath(); ctx.arc(hx + (swing ? 5 : 3), hy + 1, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#cfd6dd';
        ctx.fillRect(hx + (swing ? 3 : 1), hy - 2, 3, 1);
        ctx.fillStyle = '#6b727c';
        ctx.fillRect(hx + (swing ? 4 : 2), hy, 2, 2);
      } else if (o.weapon === 'ball') {
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.arc(hx + 3, hy + 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#222';
        ctx.fillRect(hx + 2, hy + 1, 2, 2);
      }
    }
  },

  // ------------------------------------------------------------ The Driller
  drawDriller: function (ctx, x, y, facing, pose, t, flash) {
    var self = this;
    this.fx(ctx, x, y, flash, function (sc) {
      self.drillerBody(sc, facing, pose, t);
    });
  },

  drillerBody: function (ctx, facing, pose, t) {
    ctx.scale(facing, 1);
    var r = function (px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(px, py, w, h); };

    // treads
    r(-15, -8, 30, 8, '#33363c');
    var wo = Math.floor(t * 12) % 4;
    for (var i = 0; i < 7; i++) r(-14 + i * 4 + (wo > 1 ? 1 : 0), -7, 2, 6, '#1d1f24');
    // body
    r(-13, -23, 24, 15, '#7a7f87');
    r(-13, -23, 24, 3, '#9aa1ab');
    r(-13, -10, 24, 2, '#565b63');
    r(-10, -18, 8, 6, '#454a52');                       // hatch
    r(-13, -12, 24, 2, '#b8702a');                      // copper stripe
    // drill cone (spinning stripes)
    var ph = Math.floor(t * 14) % 2;
    r(11, -20, 5, 12, ph ? '#9aa1ab' : '#6b727c');
    r(16, -18, 5, 8, ph ? '#6b727c' : '#9aa1ab');
    r(21, -16, 4, 4, ph ? '#9aa1ab' : '#6b727c');
    // croc driver poking out the top
    r(-4, -31, 8, 8, Sprites.CROC_GREEN);
    r(3, -28, 4, 2, Sprites.CROC_GREEN);                 // snout
    r(-1, -29, 2, 2, '#fff'); r(0, -28, 1, 1, '#000');
    r(-5, -33, 10, 3, '#e8c542');                        // hard hat
    r(4, -32, 2, 2, '#fff7c0');                          // headlamp
    if (pose === 'dash') {                               // dust kicked up behind
      var d = Math.floor(t * 20) % 3;
      r(-20 - d * 2, -4, 3, 3, 'rgba(200,190,170,0.7)');
      r(-25 - d * 3, -2, 2, 2, 'rgba(200,190,170,0.5)');
    }
  },

  // ------------------------------------------------------- the fish eagle
  drawEagle: function (ctx, x, y, facing, t) {
    var self = this;
    this.fx(ctx, x, y, false, function (sc) {
      sc.scale(facing, 1);
      var r = function (px, py, w, h, col) { sc.fillStyle = col; sc.fillRect(px, py, w, h); };
      var flap = Math.floor(t * 16) % 2;
      // tail (white) + body (brown)
      r(-14, -8, 5, 4, '#f2f0e8');
      r(-10, -9, 14, 6, '#6b4226');
      r(-10, -5, 14, 2, '#52331e');
      // white head & chest — the fish eagle look
      r(2, -11, 7, 7, '#f2f0e8');
      r(1, -5, 5, 3, '#f2f0e8');
      // beak
      r(9, -10, 4, 3, '#e8c542');
      r(11, -8, 2, 2, '#c98a1e');
      r(5, -10, 2, 2, '#241910');                       // eye
      // wings
      if (flap) {
        r(-6, -21, 4, 12, '#6b4226');
        r(-4, -25, 5, 8, '#6b4226');
        r(-1, -27, 5, 7, '#52331e');
      } else {
        r(-6, -7, 5, 10, '#6b4226');
        r(-3, -4, 6, 8, '#52331e');
        r(0, -1, 6, 6, '#42281a');
      }
      // talons
      r(0, -2, 2, 3, '#e8c542'); r(3, -2, 2, 3, '#e8c542');
    });
  },

  // ------------------------------------------------------------------ props
  drawShadow: function (ctx, x, y, w) {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 0.12;                              // soft outer shadow
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), w / 2 + 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2;                               // dense core
    ctx.beginPath();
    ctx.ellipse(Math.round(x), Math.round(y), w / 2 - 1, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  drawDog: function (ctx, x, y, facing, t, excited) {
    var self = this;
    this.fx(ctx, x, y, false, function (sc) {
      sc.scale(facing, 1);
      var r = function (px, py, w, h, col) { sc.fillStyle = col; sc.fillRect(px, py, w, h); };
      var hop = excited ? -(Math.floor(t * 8) % 2) * 2 : 0;
      var wag = Math.floor(t * 10) % 2;
      r(-8, -8 + hop - wag, 2, 4, '#7c5430');             // tail
      r(-6, -7 + hop, 11, 5, '#9a6a3f');                  // body
      r(-6, -3 + hop, 11, 1, '#7c5430');
      r(-2, -2 + hop, 2, 2, '#7c5430'); r(2, -2 + hop, 2, 2, '#7c5430'); // legs
      r(3, -11 + hop, 6, 5, '#9a6a3f');                   // head
      r(7, -13 + hop, 2, 3, '#7c5430');                   // ear
      r(8, -9 + hop, 2, 2, '#6e4421');                    // snout
      r(5, -10 + hop, 1, 1, '#000');                      // eye
    });
  },

  drawCage: function (ctx, x, y, t, open) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    var r = function (px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(px, py, w, h); };
    r(-12, -22, 24, 3, '#5a5f66');
    r(-12, -2, 24, 2, '#5a5f66');
    if (!open) {
      Sprites.drawDog(ctx, 0, -2, 1, t, false);   // ctx already translated to cage origin
      for (var i = -12; i <= 10; i += 4) r(i, -20, 2, 18, '#5a5f66');
    } else {
      r(-12, -20, 2, 18, '#5a5f66'); r(10, -20, 2, 18, '#5a5f66');
    }
    ctx.restore();
  },

  drawCrate: function (ctx, x, y) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    var r = function (px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(px, py, w, h); };
    r(-8, -14, 16, 14, '#8a5a2b');
    r(-8, -14, 16, 2, '#a8743c');
    r(-8, -2, 16, 2, '#6e4421');
    r(-8, -14, 2, 14, '#6e4421'); r(6, -14, 2, 14, '#6e4421');
    r(-6, -9, 12, 2, '#6e4421');
    ctx.restore();
  },

  drawItem: function (ctx, kind, x, y, t) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y - Math.abs(Math.sin((t || 0) * 3)) * 1.5));
    var r = function (px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(px, py, w, h); };
    switch (kind) {
      case 'stick':
        r(-7, -3, 14, 2, '#8a5a2b'); r(-2, -4, 2, 4, '#6e4421');
        break;
      case 'lid':
        ctx.fillStyle = '#a7adb5';
        ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
        r(-1, -5, 2, 2, '#6b727c');
        break;
      case 'ball':
        ctx.fillStyle = '#f0f0f0';
        ctx.beginPath(); ctx.arc(0, -4, 4, 0, Math.PI * 2); ctx.fill();
        r(-1, -5, 2, 2, '#222'); r(-3, -3, 1, 1, '#222'); r(2, -3, 1, 1, '#222');
        break;
      case 'fritter': // vitumbuwa
        r(-3, -5, 6, 4, '#d9912e'); r(-2, -6, 4, 1, '#eab04f'); r(-2, -4, 2, 1, '#b06f1e');
        break;
      case 'maheu':
        r(-3, -9, 6, 9, '#e8762a'); r(-3, -9, 6, 2, '#c45c1a');
        r(-2, -6, 4, 3, '#fff'); r(-2, -5, 4, 1, '#e8762a');
        break;
      case 'nshima':
        r(-6, -2, 12, 2, '#cfd6dd');
        r(-4, -6, 8, 4, '#f5f1e6'); r(-3, -7, 6, 1, '#fffdf6');
        r(3, -5, 3, 2, '#7da14e');  // relish on the side
        break;
      case 'mango':
        r(-3, -5, 6, 5, '#e2a32b'); r(-1, -6, 2, 1, '#46711f'); r(1, -4, 2, 2, '#cf5b2e');
        break;
      case 'egg':
        r(-3, -6, 6, 6, '#e8e4d0'); r(-2, -7, 4, 1, '#e8e4d0');
        r(-1, -5, 1, 1, '#9ab36b'); r(1, -3, 1, 1, '#9ab36b');
        break;
    }
    ctx.restore();
  },

  drawStars: function (ctx, x, y, t) {
    for (var k = 0; k < 3; k++) {
      var ang = t * 5 + k * 2.1;
      var px = Math.round(x + Math.cos(ang) * 8);
      var py = Math.round(y + Math.sin(ang) * 2.5 - 2);
      ctx.fillStyle = k === 1 ? '#fff' : '#ffd23c';
      ctx.fillRect(px - 1, py, 3, 1);
      ctx.fillRect(px, py - 1, 1, 3);
    }
  },

  drawHeart: function (ctx, x, y) {
    ctx.fillStyle = '#e84a5f';
    ctx.fillRect(x - 2, y - 1, 2, 2); ctx.fillRect(x + 1, y - 1, 2, 2);
    ctx.fillRect(x - 2, y, 5, 2); ctx.fillRect(x - 1, y + 2, 3, 1);
  },

  // 16x16 HUD portrait of Wandile
  drawPortrait: function (ctx, x, y) {
    var r = function (px, py, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x + px, y + py, w, h); };
    r(0, 0, 16, 16, '#23232e');
    r(2, 13, 12, 3, '#d62828');                          // tee shoulders
    r(4, 13, 8, 1, '#9c1d1d');                           // collar
    r(6, 12, 4, 2, '#cf9663');                           // neck
    r(4, 3, 8, 9, '#cf9663');                            // face
    r(3, 8, 1, 3, '#aa7448'); r(12, 8, 1, 3, '#aa7448'); // ears
    r(3, 1, 10, 3, '#1c130b'); r(3, 3, 2, 3, '#1c130b'); r(11, 3, 2, 3, '#1c130b'); // hair
    r(5, 1, 6, 1, '#3a2a16');                            // hair highlight
    r(5, 5, 2, 1, '#1c130b'); r(9, 5, 2, 1, '#1c130b');  // brows
    r(5, 6, 2, 2, '#fff'); r(9, 6, 2, 2, '#fff');        // eye whites
    r(6, 6, 1, 2, '#241910'); r(10, 6, 1, 2, '#241910'); // pupils
    r(7, 10, 3, 1, '#8a5638');                           // mouth
    r(6, 11, 4, 1, '#aa7448');                           // chin shade
  },
};
