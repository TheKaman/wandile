// WANDILE — WebAudio chiptune music + SFX (no audio files)
var AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  muted: false,
  track: -1,
  step: 0,
  nextTime: 0,
  timer: null,

  // patterns: 16 eighth-note steps, MIDI note numbers, 0 = rest
  TRACKS: {
    title: { bpm: 124, bass: [36,0,43,0,36,0,43,45, 36,0,43,0,41,0,43,45], lead: [60,64,67,72, 67,64,60,0, 62,65,69,74, 69,65,62,0] },
    stage0:{ bpm: 134, bass: [36,36,0,36, 43,0,36,0, 41,41,0,41, 43,0,46,0], lead: [60,0,64,67, 0,69,67,64, 60,0,62,65, 67,65,62,0] },  // Lusaka — bright
    stage1:{ bpm: 118, bass: [33,0,33,40, 0,33,38,0, 31,0,31,38, 0,31,36,0], lead: [57,0,60,0, 64,62,60,0, 55,0,58,0, 62,60,58,0] },   // Mine — minor
    stage2:{ bpm: 110, bass: [41,0,48,0, 38,0,45,0, 36,0,43,0, 38,0,45,0],   lead: [65,69,72,0, 69,0,65,0, 64,67,72,0, 67,0,64,0] },   // Village — warm
    stage3:{ bpm: 140, bass: [38,38,45,38, 36,36,43,36, 34,34,41,34, 36,43,36,45], lead: [62,0,65,69, 74,0,69,65, 70,0,67,62, 65,67,69,0] }, // Falls — epic
    boss0: { bpm: 160, bass: [33,33,40,33, 36,36,43,36, 33,33,40,33, 38,38,45,43], lead: [57,60,64,60, 57,0,55,57, 60,64,67,64, 62,60,57,0] },   // Mad Mongoose — frantic market swing
    boss1: { bpm: 126, bass: [28,28,28,31, 28,28,28,26, 28,28,28,31, 34,33,31,29], lead: [0,52,0,52, 55,0,52,0, 0,52,0,56, 55,53,52,0] },       // The Driller — heavy industrial grind
    boss2: { bpm: 168, bass: [26,0,38,26, 0,26,38,0, 29,0,41,29, 31,0,43,31],     lead: [62,0,65,0, 62,0,60,0, 65,0,69,0, 67,65,62,0] },        // Hyena — sneaky and fast
    boss3: { bpm: 144, bass: [28,28,35,28, 29,29,36,29, 31,31,38,31, 29,33,35,36], lead: [64,0,64,65, 67,0,64,0, 71,0,67,65, 64,65,64,0] },     // Captain Ng'wena — the final showdown
    ending:{ bpm: 116, bass: [43,0,50,0, 48,0,43,0, 41,0,48,0, 43,47,50,0], lead: [67,71,74,79, 74,71,67,0, 72,76,79,76, 74,0,71,0] },
  },

  unlock: function () {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.55;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.4;
    this.musicGain.connect(this.master);
    if (this.pendingTrack) { var p = this.pendingTrack; this.pendingTrack = null; this.playMusic(p); }
  },

  toggleMute: function () {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55;
    try { localStorage.setItem('wandile_mute', this.muted ? '1' : '0'); } catch (e) {}
  },

  freq: function (n) { return 440 * Math.pow(2, (n - 69) / 12); },

  // ------------------------------------------------------------------ music
  playMusic: function (name) {
    if (!this.ctx) { this.pendingTrack = name; return; }
    if (this.track === name) return;
    this.stopMusic();
    this.track = name;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    var self = this;
    this.timer = setInterval(function () { self.schedule(); }, 40);
  },

  stopMusic: function () {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    this.track = -1;
  },

  schedule: function () {
    var tr = this.TRACKS[this.track];
    if (!tr) return;
    var stepDur = 60 / tr.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      var i = this.step % 16;
      var b = tr.bass[i], l = tr.lead[i];
      if (b) this.note(this.freq(b), this.nextTime, stepDur * 0.9, 'triangle', 0.5, this.musicGain);
      if (l) this.note(this.freq(l), this.nextTime, stepDur * 0.75, 'square', 0.18, this.musicGain);
      if (i % 4 === 0) this.kick(this.nextTime);
      else if (i % 2 === 0) this.hat(this.nextTime);
      this.nextTime += stepDur;
      this.step++;
    }
  },

  note: function (f, when, dur, type, vol, dest) {
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    o.connect(g); g.connect(dest || this.master);
    o.start(when); o.stop(when + dur + 0.02);
  },

  kick: function (when) {
    var o = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, when);
    o.frequency.exponentialRampToValueAtTime(40, when + 0.1);
    g.gain.setValueAtTime(0.5, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
    o.connect(g); g.connect(this.musicGain);
    o.start(when); o.stop(when + 0.14);
  },

  hat: function (when) {
    this.noiseBurst(when, 0.03, 0.08, 6000);
  },

  noiseBurst: function (when, dur, vol, hp) {
    var len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    var buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var fl = this.ctx.createBiquadFilter();
    fl.type = 'highpass'; fl.frequency.value = hp || 1000;
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(fl); fl.connect(g); g.connect(this.musicGain);
    src.start(when);
  },

  // ------------------------------------------------------------------- sfx
  sfx: function (name) {
    if (!this.ctx) return;
    var t = this.ctx.currentTime;
    var self = this;
    var sweep = function (f0, f1, dur, type, vol) {
      var o = self.ctx.createOscillator();
      var g = self.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(self.master);
      o.start(t); o.stop(t + dur + 0.02);
    };
    var arp = function (notes, gap, dur, vol) {
      notes.forEach(function (n, i) {
        self.note(self.freq(n), t + i * gap, dur, 'square', vol, self.master);
      });
    };
    switch (name) {
      case 'swish':  this.noiseBurst(t, 0.06, 0.12, 2500); break;
      case 'hit':    sweep(300, 90, 0.1, 'square', 0.3); this.noiseBurst(t, 0.05, 0.15, 800); break;
      case 'kickhit':sweep(220, 60, 0.16, 'square', 0.35); this.noiseBurst(t, 0.08, 0.2, 500); break;
      case 'hurt':   sweep(400, 150, 0.18, 'sawtooth', 0.22); break;
      case 'edown':  arp([64, 59, 55, 48], 0.06, 0.08, 0.2); break;
      case 'jump':   sweep(180, 420, 0.14, 'square', 0.18); break;
      case 'pickup': arp([72, 76, 79], 0.05, 0.07, 0.22); break;
      case 'eat':    arp([60, 67, 72, 79], 0.05, 0.06, 0.25); break;
      case 'screech':  // fish eagle cry: high falling whistle, then a rising answer
        [[1600, 900, 0, 0.22], [1200, 1750, 0.18, 0.16]].forEach(function (sp) {
          var o = self.ctx.createOscillator(), g = self.ctx.createGain();
          o.type = 'square';
          o.frequency.setValueAtTime(sp[0], t + sp[2]);
          o.frequency.exponentialRampToValueAtTime(sp[1], t + sp[2] + sp[3]);
          g.gain.setValueAtTime(0.2, t + sp[2]);
          g.gain.exponentialRampToValueAtTime(0.001, t + sp[2] + sp[3]);
          o.connect(g); g.connect(self.master);
          o.start(t + sp[2]); o.stop(t + sp[2] + sp[3] + 0.02);
        });
        break;
      case 'crate':  this.noiseBurst(t, 0.12, 0.3, 400); sweep(150, 60, 0.1, 'triangle', 0.25); break;
      case 'throw':  sweep(500, 900, 0.1, 'square', 0.12); break;
      case 'alarm':  arp([52, 58, 52, 58], 0.12, 0.12, 0.25); break;
      case 'clear':  arp([60, 64, 67, 72, 76, 79], 0.08, 0.2, 0.25); break;
      case 'select': arp([67, 72], 0.06, 0.08, 0.2); break;
      case 'bark':   sweep(600, 900, 0.07, 'square', 0.2); break;
      case 'gameover': arp([55, 51, 48, 43], 0.18, 0.3, 0.25); break;
    }
  },
};
