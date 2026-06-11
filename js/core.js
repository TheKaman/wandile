// WANDILE — shared constants & helpers
var CFG = {
  W: 480, H: 270,
  GROUND_TOP: 180,    // highest walkable depth (screen y of feet)
  GROUND_BOTTOM: 258, // lowest walkable depth
  GRAV: 700,          // px/s^2 for jump arcs (z axis)
  DEPTH_TOL: 13,      // how close in depth two actors must be to trade hits
};

function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t) { return a + (b - a) * t; }

// blend two '#rrggbb' colors — used for gradient skies
function lerpColor(a, b, t) {
  var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  var r = Math.round(((pa >> 16) & 255) + ((((pb >> 16) & 255) - ((pa >> 16) & 255)) * t));
  var g = Math.round(((pa >> 8) & 255) + ((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t));
  var bl = Math.round((pa & 255) + (((pb & 255) - (pa & 255)) * t));
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

// deterministic pseudo-random in [0,1) from two ints — used for background decoration
function hash2(i, j) {
  var n = (i * 374761393 + j * 668265263) | 0;
  n = ((n ^ (n >> 13)) * 1274126177) | 0;
  return (((n ^ (n >> 16)) >>> 0) % 100000) / 100000;
}
