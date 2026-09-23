/* =========================================================
   liquid.js — "living gradient" background (WebGL, simplex noise).
   Vanilla port of the Velaris component, adapted for light pages:
   edges fade to the page background instead of darkening.

   Usage:  <canvas class="liquid"
                   data-bg="#ffffff"
                   data-colors="#c9f7ff,#cfe1ff,#e9f2ff,#f5fbff"
                   data-speed="0.35"
                   data-grain="0.12"
                   data-strength="1"></canvas>
   The canvas fills its positioned parent (position:absolute; inset:0 in CSS).
   Rendering pauses while the canvas is off-screen or the tab is hidden.
   With prefers-reduced-motion a single still frame is drawn.
   ========================================================= */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 position;',
    'varying vec2 vUv;',
    'void main(){ vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  // 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT) + colour blending
  var FRAG = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_res;',
    'uniform float u_time;',
    'uniform float u_grain;',
    'uniform float u_strength;',
    'uniform vec3 u_colors[4];',
    'uniform vec3 u_bg;',
    'vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }',
    'float snoise(vec2 v){',
    '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);',
    '  vec2 i = floor(v + dot(v, C.yy));',
    '  vec2 x0 = v - i + dot(i, C.xx);',
    '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
    '  vec4 x12 = x0.xyxy + C.xxzz;',
    '  x12.xy -= i1;',
    '  i = mod(i, 289.0);',
    '  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
    '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
    '  m = m*m; m = m*m;',
    '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
    '  vec3 h = abs(x) - 0.5;',
    '  vec3 ox = floor(x + 0.5);',
    '  vec3 a0 = x - ox;',
    '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
    '  vec3 g;',
    '  g.x = a0.x * x0.x + h.x * x0.y;',
    '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
    '  return 130.0 * dot(m, g);',
    '}',
    'void main(){',
    '  vec2 uv = vUv;',
    '  float ratio = u_res.x / u_res.y;',
    '  vec2 p = uv - 0.5;',
    '  p.x *= ratio;',
    '  float t = u_time * 0.1;',
    '  float n1 = snoise(p * 0.4  + vec2( t * 0.2,  -t * 0.3));',
    '  float n2 = snoise(p * 0.55 + vec2(-t * 0.15,  t * 0.25) + n1 * 0.25);',
    '  float n3 = snoise(p * 0.75 + vec2( t * 0.1,  -t * 0.2)  + n2 * 0.2);',
    '  vec3 col = u_bg;',
    '  col = mix(col, u_colors[0], smoothstep(-0.2, 0.5, n1) * 0.85 * u_strength);',
    '  col = mix(col, u_colors[1], smoothstep(-0.1, 0.6, n2) * 0.70 * u_strength);',
    '  col = mix(col, u_colors[2], smoothstep(-0.3, 0.4, n3) * 0.60 * u_strength);',
    '  col = mix(col, u_colors[3], smoothstep( 0.0, 0.7, n1 * n2) * 0.50 * u_strength);',
    '  float dist = length(p) * 1.5;',
    '  float vignette = 1.0 - smoothstep(0.3, 1.2, dist);',
    '  col = mix(u_bg, col, vignette);',                        // light-mode: melt into the page
    '  float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453 + u_time);',
    '  col += (grain - 0.5) * u_grain * 0.1;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  function hexToRgb(hex) {
    var h = hex.trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
  }

  function mount(canvas) {
    var parent = canvas.parentElement;
    var gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false });
    if (!gl || !parent) { canvas.remove(); return; }

    var opts = {
      bg: canvas.dataset.bg || '#ffffff',
      colors: (canvas.dataset.colors || '#c9f7ff,#cfe1ff,#e9f2ff,#f5fbff').split(','),
      speed: parseFloat(canvas.dataset.speed || '0.35'),
      grain: parseFloat(canvas.dataset.grain || '0.12'),
      strength: parseFloat(canvas.dataset.strength || '1')
    };
    while (opts.colors.length < 4) opts.colors.push(opts.bg);

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn('liquid.js shader error:', gl.getShaderInfoLog(s)); }
      return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      grain: gl.getUniformLocation(prog, 'u_grain'),
      strength: gl.getUniformLocation(prog, 'u_strength'),
      colors: gl.getUniformLocation(prog, 'u_colors'),
      bg: gl.getUniformLocation(prog, 'u_bg')
    };
    var flat = [];
    opts.colors.slice(0, 4).forEach(function (c) { flat = flat.concat(hexToRgb(c)); });
    gl.uniform3fv(U.colors, new Float32Array(flat));
    gl.uniform3fv(U.bg, new Float32Array(hexToRgb(opts.bg)));
    gl.uniform1f(U.grain, opts.grain);
    gl.uniform1f(U.strength, opts.strength);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, Math.round(parent.clientWidth * dpr));
      var h = Math.max(1, Math.round(parent.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform2f(U.res, w, h);
    }

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var visible = true, raf = 0, start = performance.now();

    function frame(now) {
      raf = 0;
      resize();
      gl.uniform1f(U.time, ((now || performance.now()) - start) * 0.001 * opts.speed + 10.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reduced && visible && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function play() { if (!raf) raf = requestAnimationFrame(frame); }

    if ('ResizeObserver' in window) { new ResizeObserver(function () { play(); }).observe(parent); }
    else { window.addEventListener('resize', play); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) play();
      }, { threshold: 0 }).observe(parent);
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) play(); });

    play();
  }

  function init() { Array.prototype.forEach.call(document.querySelectorAll('canvas.liquid'), mount); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
