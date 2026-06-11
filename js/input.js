// WANDILE — unified keyboard + touch input
var Input = {
  down: {},  // actions currently held (keyboard + touch both write here)
  prev: {},  // snapshot from previous frame, for edge detection

  KEYMAP: {
    ArrowLeft: 'left',  a: 'left',  A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up',      w: 'up',    W: 'up',
    ArrowDown: 'down',  s: 'down',  S: 'down',
    j: 'punch', J: 'punch', z: 'punch', Z: 'punch',
    k: 'kick',  K: 'kick',  x: 'kick',  X: 'kick',
    ' ': 'jump',
    l: 'special', L: 'special', c: 'special', C: 'special',
    Enter: 'start',
    m: 'mute', M: 'mute',
    p: 'pause', P: 'pause',
    f: 'full', F: 'full',
  },

  init: function () {
    var self = this;
    window.addEventListener('keydown', function (e) {
      var act = self.KEYMAP[e.key];
      if (act) {
        if (!e.repeat) self.down[act] = true;
        e.preventDefault();
      }
      AudioSys.unlock();
    });
    window.addEventListener('keyup', function (e) {
      var act = self.KEYMAP[e.key];
      if (act) self.down[act] = false;
    });
    this.initTouch();
  },

  // call once per frame AFTER the game update has consumed input
  endFrame: function () {
    for (var k in this.down) this.prev[k] = this.down[k];
  },

  held: function (a) { return !!this.down[a]; },
  pressed: function (a) { return !!this.down[a] && !this.prev[a]; },

  // ---------- touch ----------
  initTouch: function () {
    var coarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      /[?&]touch/.test(location.search);   // ?touch forces the overlay (hybrids, testing)
    var touchEl = document.getElementById('touch');
    if (!coarse || !touchEl) return;
    touchEl.classList.add('on');
    document.body.classList.add('touchmode');
    var self = this;

    // go fullscreen + lock landscape on the first touch anywhere on the
    // controls (Android/tablets; iPhone ignores it — Safari limitation)
    var wentFull = false;
    touchEl.addEventListener('pointerdown', function () {
      if (wentFull) return;
      wentFull = true;
      var el = document.documentElement;
      if (!el.requestFullscreen) return;
      var p = el.requestFullscreen();
      if (p && p.then) {
        p.then(function () {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(function () {});
          }
        }).catch(function () { wentFull = false; });
      }
    });

    touchEl.querySelectorAll('.tbtn').forEach(function (b) {
      var act = b.getAttribute('data-action');
      var press = function (e) {
        e.preventDefault();
        self.down[act] = true;
        b.classList.add('pressed');
        AudioSys.unlock();
      };
      var release = function (e) {
        e.preventDefault();
        self.down[act] = false;
        b.classList.remove('pressed');
      };
      b.addEventListener('pointerdown', press);
      b.addEventListener('pointerup', release);
      b.addEventListener('pointercancel', release);
      b.addEventListener('pointerleave', release);
    });

    // dpad — direction from touch position relative to pad centre
    var pad = document.getElementById('dpad');
    if (!pad) return;
    var padId = null;
    var setDir = function (e) {
      var rect = pad.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      var dead = rect.width * 0.12;
      self.down.left = dx < -dead;
      self.down.right = dx > dead;
      self.down.up = dy < -dead;
      self.down.down = dy > dead;
    };
    var clearDir = function () {
      self.down.left = self.down.right = self.down.up = self.down.down = false;
    };
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault(); padId = e.pointerId;
      pad.setPointerCapture(e.pointerId);
      setDir(e); AudioSys.unlock();
    });
    pad.addEventListener('pointermove', function (e) {
      if (e.pointerId === padId) setDir(e);
    });
    var end = function (e) {
      if (e.pointerId === padId) { padId = null; clearDir(); }
    };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
  },
};
