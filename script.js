<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Table Tennis 3D</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;background:#0a1224;color:#f5f7fa;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
canvas{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}
.vig{position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.5))}
#hud{position:fixed;top:14px;left:0;right:0;display:none;justify-content:center;gap:28px;align-items:center;pointer-events:none;text-shadow:0 2px 12px #000}
#hud .n{font-size:.85rem;opacity:.8;letter-spacing:.1em;text-transform:uppercase;text-align:center}
#hud .s{font-size:2.6rem;font-weight:800;font-variant-numeric:tabular-nums;text-align:center}
#msg{position:fixed;top:30%;left:0;right:0;text-align:center;font-size:clamp(1.4rem,4vw,2.2rem);font-weight:800;text-shadow:0 2px 16px #000;pointer-events:none;opacity:0;transition:opacity .25s}
#pauseBtn{position:fixed;top:12px;right:12px;display:none;padding:8px 14px;min-width:0;font-size:.9rem;background:rgba(0,0,0,.5)}
#sndBtn{position:fixed;top:12px;left:12px;padding:8px 14px;min-width:0;font-size:.9rem;background:rgba(0,0,0,.5)}
#panel{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(5,10,20,.5);backdrop-filter:blur(4px);text-align:center;padding:20px}
#panel[hidden]{display:none}
h1{margin:0;font-size:clamp(2.2rem,7vw,4rem);letter-spacing:.02em;text-shadow:0 4px 28px #000}
#ps{margin:0;opacity:.9;max-width:520px;line-height:1.5;text-shadow:0 2px 10px #000}
#pb{display:flex;flex-direction:column;gap:10px;align-items:center}
button{font:inherit;font-weight:700;padding:12px 22px;border:0;border-radius:12px;background:linear-gradient(180deg,#2fbf8a,#1f8f66);color:#fff;cursor:pointer;min-width:240px;box-shadow:0 6px 20px rgba(0,0,0,.4)}
button:hover{filter:brightness(1.08)}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="vig"></div>
<div id="hud">
  <div><div class="n" id="n1">You</div><div class="s" id="s1">0</div></div>
  <div class="s" style="opacity:.4">–</div>
  <div><div class="n" id="n2">CPU</div><div class="s" id="s2">0</div></div>
</div>
<div id="msg"></div>
<button id="sndBtn">🔊 Sound on</button>
<button id="pauseBtn">Pause</button>
<div id="panel"><h1 id="pt"></h1><p id="ps"></p><div id="pb"></div></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
const T = THREE, $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TL = 12, TW = 6, G = -12, R = 0.18, NET_H = 0.7, PX = 5.2, ZMAX = 2.6;

// Renderer and scene
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputEncoding = T.sRGBEncoding;
const scene = new T.Scene();
scene.background = new T.Color(0x0a1224);
scene.fog = new T.Fog(0x0a1224, 20, 42);
const camera = new T.PerspectiveCamera(50, 1, 0.1, 120);
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// Lights
scene.add(new T.HemisphereLight(0xcfe3ff, 0x1a1f30, 0.9));
const sun = new T.DirectionalLight(0xffffff, 1.5);
sun.position.set(-6, 14, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 8, bottom: -8, near: 1, far: 40 });
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.bias = -0.0008;
scene.add(sun);
const glow = new T.PointLight(0xffd9a0, 0.9, 8, 2);
scene.add(glow);

// Floor
const floor = new T.Mesh(new T.PlaneGeometry(90, 90), new T.MeshStandardMaterial({ color: 0x121b2e, roughness: 0.85 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -3.4;
floor.receiveShadow = true;
scene.add(floor);

// Room: walls, ceiling, lamp panels and a spotlight that casts soft shadows
const wallMat = new T.MeshStandardMaterial({ color: 0x1b2433, roughness: 0.95 });
const wallA = new T.Mesh(new T.PlaneGeometry(90, 40), wallMat);
wallA.position.set(0, 4, -14);
scene.add(wallA);
const wallB = wallA.clone(); wallB.position.set(0, 4, 14); wallB.rotation.y = Math.PI; scene.add(wallB);
const wallC = wallA.clone(); wallC.position.set(-22, 4, 0); wallC.rotation.y = Math.PI / 2; scene.add(wallC);
const wallD = wallA.clone(); wallD.position.set(22, 4, 0); wallD.rotation.y = -Math.PI / 2; scene.add(wallD);
const ceil = new T.Mesh(new T.PlaneGeometry(90, 90), wallMat);
ceil.rotation.x = Math.PI / 2;
ceil.position.y = 8;
scene.add(ceil);
const lampMat = new T.MeshBasicMaterial({ color: 0xfff3dc });
for (const x of [-4, 0, 4]) { const l = new T.Mesh(new T.BoxGeometry(2.4, 0.08, 1.2), lampMat); l.position.set(x, 7.5, 0); scene.add(l); }
const spot = new T.SpotLight(0xfff1d6, 1.6, 0, 0.7, 0.6, 1);
spot.position.set(-1, 7, 0);
spot.target.position.set(0, 0, 0);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.bias = -0.0008;
scene.add(spot);
scene.add(spot.target);

// Pictures on the walls (drawn procedurally, so no external images are needed)
function artTex(kind) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 384;
  const x = c.getContext('2d');
  if (kind === 0) {
    const g = x.createLinearGradient(0, 0, 0, 384);
    g.addColorStop(0, '#2b1b4f'); g.addColorStop(0.6, '#e0643c'); g.addColorStop(1, '#f5c26b');
    x.fillStyle = g; x.fillRect(0, 0, 512, 384);
    x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(256, 230, 70, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1a0f2e'; x.beginPath();
    x.moveTo(0, 300); x.lineTo(120, 200); x.lineTo(220, 300); x.lineTo(330, 190); x.lineTo(512, 300); x.lineTo(512, 384); x.lineTo(0, 384);
    x.fill();
  } else if (kind === 1) {
    x.fillStyle = '#0f3d3e'; x.fillRect(0, 0, 512, 384);
    const cols = ['#f4a261', '#e76f51', '#2a9d8f', '#e9c46a', '#264653'];
    for (let i = 0; i < 14; i++) {
      x.globalAlpha = 0.7;
      x.fillStyle = cols[i % cols.length];
      x.beginPath(); x.arc(Math.random() * 512, Math.random() * 384, 20 + Math.random() * 90, 0, Math.PI * 2); x.fill();
    }
    x.globalAlpha = 1;
  } else {
    x.fillStyle = '#1d5bb0'; x.fillRect(0, 0, 512, 384);
    x.fillStyle = '#ffffff'; x.font = 'bold 64px sans-serif'; x.textAlign = 'center';
    x.fillText('PING', 256, 160); x.fillText('PONG', 256, 240);
    x.fillStyle = '#ff7a59'; x.beginPath(); x.arc(256, 300, 26, 0, Math.PI * 2); x.fill();
  }
  return new T.CanvasTexture(c);
}
const frameMat = new T.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.5 });
function hang(kind, x, y, z, rotY, w, h) {
  const g = new T.Group();
  const pic = new T.Mesh(new T.PlaneGeometry(w * 0.9, h * 0.9), new T.MeshStandardMaterial({ map: artTex(kind), roughness: 0.6 }));
  pic.position.z = 0.035;
  g.add(pic);
  const parts = [[w, 0.1, 0, h / 2 - 0.05], [w, 0.1, 0, -h / 2 + 0.05], [0.1, h, -w / 2 + 0.05, 0], [0.1, h, w / 2 - 0.05, 0]];
  for (const [bw, bh, fx, fy] of parts) {
    const m = new T.Mesh(new T.BoxGeometry(bw, bh, 0.06), frameMat);
    m.position.set(fx, fy, 0);
    m.castShadow = true;
    g.add(m);
  }
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  scene.add(g);
}
hang(0, -8, 4.6, -13.94, 0, 3.2, 2.2);
hang(1, -2, 4.6, -13.94, 0, 2.6, 2.2);
hang(2, 4, 4.6, -13.94, 0, 2.6, 2.2);
hang(1, 10, 4.6, -13.94, 0, 3.2, 2.2);
hang(2, 16, 4.6, 13.94, Math.PI, 3.2, 2.2);

// Table, lines, legs, net
const add = (geo, mat, x, y, z, cast = true) => {
  const m = new T.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  scene.add(m);
  return m;
};
const blue = new T.MeshStandardMaterial({ map: grainTex('#1d5bb0'), roughness: 0.3, metalness: 0.05 });
const white = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
const dark = new T.MeshStandardMaterial({ color: 0x2a2f3c, roughness: 0.6, metalness: 0.4 });
add(new T.BoxGeometry(TL, 0.2, TW), blue, 0, -0.1, 0);
add(new T.BoxGeometry(TL, 0.02, 0.07), white, 0, 0.01, TW / 2 - 0.035, false);
add(new T.BoxGeometry(TL, 0.02, 0.07), white, 0, 0.01, -TW / 2 + 0.035, false);
add(new T.BoxGeometry(0.07, 0.02, TW), white, TL / 2 - 0.035, 0.01, 0, false);
add(new T.BoxGeometry(0.07, 0.02, TW), white, -TL / 2 + 0.035, 0.01, 0, false);
add(new T.BoxGeometry(0.04, 0.02, TW), white, 0, 0.01, 0, false);
for (const x of [-5, 5]) for (const z of [-2.5, 2.5]) add(new T.CylinderGeometry(0.12, 0.12, 3.3, 14), dark, x, -1.75, z);
add(new T.BoxGeometry(0.03, NET_H, TW + 0.5), new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.6 }), 0, NET_H / 2, 0, false);
add(new T.BoxGeometry(0.05, 0.07, TW + 0.5), white, 0, NET_H, 0);
for (const z of [-TW / 2 - 0.25, TW / 2 + 0.25]) add(new T.BoxGeometry(0.08, NET_H + 0.2, 0.08), dark, 0, (NET_H + 0.2) / 2, z);

// Rackets
function grainTex(base) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = base;
  x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    x.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.1)';
    x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
  }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping;
  t.repeat.set(2, 2);
  return t;
}
function racket(face, back) {
  const g = new T.Group();
  const wood = new T.MeshStandardMaterial({ color: 0xb9844a, roughness: 0.55 });
  const part = (geo, mat, x, y, rz) => {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, 0);
    if (rz) m.rotation.z = rz;
    m.castShadow = true;
    g.add(m);
    return m;
  };
  part(new T.CylinderGeometry(0.42, 0.42, 0.04, 40), wood, 0, 0, Math.PI / 2);
  part(new T.CylinderGeometry(0.43, 0.43, 0.02, 40), new T.MeshStandardMaterial({ map: grainTex(face), roughness: 0.85 }), 0.03, 0, Math.PI / 2);
  part(new T.CylinderGeometry(0.43, 0.43, 0.02, 40), new T.MeshStandardMaterial({ map: grainTex(back), roughness: 0.85 }), -0.03, 0, Math.PI / 2);
  const rim = new T.Mesh(new T.TorusGeometry(0.43, 0.04, 12, 48), new T.MeshStandardMaterial({ color: 0x3a2412, roughness: 0.35, metalness: 0.2 }));
  rim.rotation.y = Math.PI / 2;
  rim.castShadow = true;
  g.add(rim);
  part(new T.CylinderGeometry(0.07, 0.1, 0.85, 18), wood, 0, -0.85);
  part(new T.CylinderGeometry(0.075, 0.095, 0.6, 18), new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 }), 0, -0.9);
  part(new T.CylinderGeometry(0.09, 0.09, 0.06, 18), new T.MeshStandardMaterial({ color: 0xcfd6df, metalness: 0.8, roughness: 0.25 }), 0, -0.46);
  scene.add(g);
  return g;
}
const racketL = racket('#d8402f', '#1b1b1b'); racketL.position.set(-PX, 2, 0);
const racketR = racket('#1b1b1b', '#1f6fd1'); racketR.position.set(PX, 2, 0);

// Ball and sparks
const ball = new T.Mesh(new T.SphereGeometry(R, 32, 16), new T.MeshPhysicalMaterial({ color: 0xfff8e8, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.1 }));
ball.castShadow = true;
ball.visible = false;
scene.add(ball);
const seam = new T.Mesh(new T.SphereGeometry(R * 0.3, 12, 8), new T.MeshStandardMaterial({ color: 0xd8402f, roughness: 0.4 }));
seam.position.set(0, R * 0.7, R * 0.7);
ball.add(seam);
const sparkGeo = new T.SphereGeometry(0.04, 6, 4);
const sparkMat = new T.MeshBasicMaterial({ color: 0xffe08a });
let sparks = [];
function burst(p) {
  for (let i = 0; i < 14; i++) {
    const m = new T.Mesh(sparkGeo, sparkMat);
    m.position.copy(p);
    m.userData = { v: new T.Vector3((Math.random() - 0.5) * 6, Math.random() * 4, (Math.random() - 0.5) * 6), life: 0.45 };
    scene.add(m);
    sparks.push(m);
  }
}

// Sound effects (synthesized with Web Audio, no files)
let AC = null, muted = false, master = null;
function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain();
    master.connect(AC.destination);
    const conv = AC.createConvolver(), len = Math.floor(AC.sampleRate * 1.4), ib = AC.createBuffer(2, len, AC.sampleRate), wet = AC.createGain();
    for (let ch = 0; ch < 2; ch++) {
      const d = ib.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    conv.buffer = ib;
    wet.gain.value = 0.3;
    master.connect(conv);
    conv.connect(wet).connect(AC.destination);
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const a = ac(), o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g).connect(master);
  o.start();
  o.stop(a.currentTime + dur);
}
function noise(dur, vol, freq) {
  if (muted) return;
  const a = ac(), len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  s.buffer = buf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  g.gain.value = vol;
  s.connect(f).connect(g).connect(master);
  s.start();
}
const sfx = {
  hit(v = 8) { const s = Math.min(1, v / 12); noise(0.035, 0.35 + 0.4 * s, 1400 + 1000 * s); tone(260 + 200 * s, 0.07, 'triangle', 0.18, 120); },
  bounce(v = 5) { const s = Math.min(1, v / 10); tone(150 + 140 * s, 0.16, 'sine', 0.22 + 0.25 * s, 60); noise(0.025, 0.08 + 0.18 * s, 700 + 600 * s); },
  net() { noise(0.12, 0.25, 1200); tone(300, 0.15, 'square', 0.05, 150); },
  point(w) { tone(w < 0 ? 660 : 880, 0.2, 'sine', 0.25); setTimeout(() => tone(w < 0 ? 880 : 1100, 0.3, 'sine', 0.25), 120); },
  over(won) { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(won ? f : f * 0.6, 0.35, 'triangle', 0.25), i * 160)); },
  click() { tone(900, 0.05, 'square', 0.08); }
};

// Game state
const vel = new T.Vector3();
const game = { mode: 'single', state: 'menu', sL: 0, sR: 0, paused: false };
const keys = {};
let lastHit = -1, landed = { L: false, R: false }, serverSide = -1;
let pointT = 0, msgT = 0, shake = 0, aiErr = 0, mouseT = null, orbit = 0;
const LEVELS = [
  { name: 'Easy', speed: 3, err: 1.1 },
  { name: 'Medium', speed: 5, err: 0.6 },
  { name: 'Hard', speed: 7, err: 0.3 },
  { name: 'Champion', speed: 10, err: 0.1 }
];
let level = 1;
const mouseRay = new T.Raycaster(), mouseHit = new T.Vector3(), racketPlane = new T.Plane(new T.Vector3(1, 0, 0), PX);

const nameOf = s => game.mode === 'single' ? (s < 0 ? 'You' : 'CPU') : (s < 0 ? 'P1' : 'P2');
function showPanel(title, sub, btns) {
  $('pt').textContent = title;
  $('ps').textContent = sub;
  const pb = $('pb');
  pb.innerHTML = '';
  for (const [label, fn] of btns) {
    const b = document.createElement('button');
    b.textContent = label;
    b.onclick = () => { sfx.click(); fn(); };
    pb.appendChild(b);
  }
  $('panel').hidden = false;
}
function hidePanel() { $('panel').hidden = true; }
function flash(t) { $('msg').textContent = t; $('msg').style.opacity = 1; msgT = 1.3; }
function hud() {
  $('n1').textContent = nameOf(-1);
  $('n2').textContent = nameOf(1) + (game.mode === 'single' ? ' · ' + LEVELS[level].name : '');
  $('s1').textContent = game.sL;
  $('s2').textContent = game.sR;
}

function toMenu() {
  game.state = 'menu';
  game.paused = false;
  ball.visible = false;
  $('hud').style.display = 'none';
  $('pauseBtn').style.display = 'none';
  showPanel('Table Tennis 3D', 'Rally, smash and win in 3D. First to 11, win by 2.', [
    ['Single Player (vs CPU)', showLevels],
    ['Multiplayer (2 players)', () => startGame('double')],
    ['Controls', showControls]
  ]);
}
function showLevels() {
  showPanel('Choose CPU level', 'Higher levels react faster and make fewer mistakes.', [
    ...LEVELS.map((l, i) => [l.name, () => { level = i; startGame('single'); }]),
    ['Back', toMenu]
  ]);
}
function showControls() {
  showPanel('Controls', 'Single player: move the mouse, or use W/A/S/D. Multiplayer: Player 1 uses W/A/S/D, Player 2 uses the arrow keys. P or Esc pauses. Rackets hit the ball automatically when it is within reach.', [
    ['Back', toMenu]
  ]);
}

function startGame(m) {
  game.mode = m;
  game.sL = 0; game.sR = 0; game.paused = false;
  racketL.position.set(-PX, 2, 0);
  racketR.position.set(PX, 2, 0);
  hidePanel();
  $('hud').style.display = 'flex';
  $('pauseBtn').style.display = 'block';
  hud();
  serverSide = Math.random() < 0.5 ? -1 : 1;
  beginWait();
}
function beginWait() {
  game.state = 'wait';
  pointT = 1.0;
  ball.visible = false;
}
function serve() {
  const s = serverSide, T1 = 1.5;
  ball.position.set(s * 5, 1.6, (Math.random() - 0.5) * 1.2);
  vel.set(-s * 8 / T1, (R - 1.6 - 0.5 * G * T1 * T1) / T1, (Math.random() - 0.5) * 0.8);
  lastHit = s; ball.userData.spin = 0.3;
  landed.L = landed.R = false;
  aiErr = (Math.random() - 0.5) * LEVELS[level].err;
  ball.visible = true;
  game.state = 'play';
}

function endPoint(w) { // w = side that wins the point
  if (w < 0) game.sL++; else game.sR++;
  hud();
  shake = 0.3;
  burst(ball.position); sfx.point(w);
  if (Math.max(game.sL, game.sR) >= 11 && Math.abs(game.sL - game.sR) >= 2) return endGame(w);
  serverSide = -w;
  flash(nameOf(w) + ' scores!');
  beginWait();
}
function endGame(w) {
  game.state = 'over';
  ball.visible = false;
  $('pauseBtn').style.display = 'none';
  sfx.over(w < 0);
  const title = game.mode === 'single' ? (w < 0 ? 'You win!' : 'CPU wins') : (w < 0 ? 'Player 1 wins!' : 'Player 2 wins!');
  showPanel(title, `Final score ${game.sL} – ${game.sR}`, [
    ['Play again', () => startGame(game.mode)],
    ['Main menu', toMenu]
  ]);
}
function togglePause() {
  if (game.state === 'menu' || game.state === 'over') return;
  game.paused = !game.paused;
  if (game.paused) showPanel('Paused', 'Press P or Esc to resume.', [['Resume', togglePause], ['Main menu', toMenu]]);
  else hidePanel();
}

function near(r) {
  return Math.hypot(ball.position.y - r.position.y, ball.position.z - r.position.z) < 0.7;
}
function doHit(side) {
  const r = side < 0 ? racketL : racketR, p = ball.position;
  const tX = -side * (1.6 + Math.random() * 3.2);
  const tZ = clamp(r.position.z * 0.6 + (Math.random() - 0.5) * 2.4, -ZMAX, ZMAX);
  const pw = Math.min(1, (r.userData.spd || 0) / 6);
  const T1 = 0.95 - 0.3 * pw + Math.random() * 0.2;
  vel.set((tX - p.x) / T1, (R - p.y - 0.5 * G * T1 * T1) / T1, (tZ - p.z) / T1);
  lastHit = side;
  landed.L = landed.R = false;
  burst(p); sfx.hit(Math.abs(vel.x)); r.userData.sw = 1; ball.userData.spin = 0.2 + Math.random() * 0.8;
  aiErr = (Math.random() - 0.5) * LEVELS[level].err;
}

function substep(dt) {
  const p = ball.position, prevX = p.x;
  vel.y += G * dt;
  vel.y -= ball.userData.spin * Math.max(0.2, Math.abs(vel.x)) * 0.2 * dt;
  vel.multiplyScalar(1 - 0.05 * dt);
  p.addScaledVector(vel, dt);

  // Net
  if ((prevX < 0) !== (p.x < 0) && p.y < NET_H && Math.abs(p.z) <= TW / 2 + 0.25) { sfx.net(); return endPoint(-lastHit); }

  // Rackets
  if (vel.x < 0 && p.x <= racketL.position.x + 0.35 && p.x >= racketL.position.x - 0.5 && near(racketL)) return doHit(-1);
  if (vel.x > 0 && p.x >= racketR.position.x - 0.35 && p.x <= racketR.position.x + 0.5 && near(racketR)) return doHit(1);

  // Table bounce
  if (p.y <= R && vel.y < 0 && Math.abs(p.x) <= TL / 2 && Math.abs(p.z) <= TW / 2) {
    const side = p.x < 0 ? -1 : 1, k = side < 0 ? 'L' : 'R';
    p.y = R;
    if (lastHit === side || landed[k]) return endPoint(-side);
    landed[k] = true; sfx.bounce(-vel.y); vel.x *= 0.9; vel.z *= 0.9;
    vel.y = -vel.y * 0.7;
  }

  // Out of bounds
  if (Math.abs(p.x) > TL / 2 + 0.05 || Math.abs(p.z) > TW / 2 + 0.05 || p.y < -2) {
    const side = p.x < 0 ? -1 : 1;
    const loser = landed[side < 0 ? 'L' : 'R'] ? side : lastHit;
    return endPoint(-loser);
  }
}

function moveRacket(r, dz, dy, dt) {
  r.position.z = clamp(r.position.z + dz * 6 * dt, -ZMAX, ZMAX);
  r.position.y = clamp(r.position.y + dy * 5 * dt, 1.3, 3.4);
}

function update(dt) {
  // Camera: orbit in menu, fixed behind the left end in play
  if (game.state === 'menu') {
    orbit += dt * 0.12;
    camera.position.set(Math.cos(orbit) * 11, 5.5, Math.sin(orbit) * 11);
    camera.lookAt(0, 0.2, 0);
  } else {
    camera.position.set(-10 + (Math.random() - 0.5) * shake, 4.6 + (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    const inPlay = game.state === 'play';
    camera.lookAt(inPlay ? clamp(ball.position.x, -2, 4) : 0.6, 0.3, inPlay ? ball.position.z * 0.35 : 0);
  }
  shake *= 0.88;

  const live = game.state !== 'menu' && game.state !== 'over' && !game.paused;
  if (live) {
    const held = k => !!keys[k];
    const dzL = (held('d') ? 1 : 0) - (held('a') ? 1 : 0);
    const dyL = (held('w') ? 1 : 0) - (held('s') ? 1 : 0);
    moveRacket(racketL, dzL, dyL, dt);
    if (game.mode === 'single') {
      if (mouseT && !dzL && !dyL) {
        mouseRay.setFromCamera(new T.Vector2(mouseT.nx, mouseT.ny), camera);
        if (mouseRay.ray.intersectPlane(racketPlane, mouseHit)) {
          racketL.position.z = clamp(mouseHit.z, -ZMAX, ZMAX);
          racketL.position.y = clamp(mouseHit.y, 1.3, 3.4);
        }
        
        
      }
      let tz = 0, ty = 2;
      if (vel.x > 0) {
        const tr = Math.max(0, (racketR.position.x - ball.position.x) / vel.x);
        tz = clamp(ball.position.z + vel.z * tr + aiErr, -ZMAX, ZMAX);
        ty = clamp(ball.position.y + vel.y * tr + 0.5 * G * tr * tr, 1.3, 3.4);
      }
      const k = Math.min(1, dt * LEVELS[level].speed);
      racketR.position.z += (tz - racketR.position.z) * k;
      racketR.position.y += (ty - racketR.position.y) * k;
    } else {
      const dzR = (held('arrowright') ? 1 : 0) - (held('arrowleft') ? 1 : 0);
      const dyR = (held('arrowup') ? 1 : 0) - (held('arrowdown') ? 1 : 0);
      moveRacket(racketR, dzR, dyR, dt);
    }

    if (game.state === 'wait') {
      pointT -= dt;
      if (pointT <= 0) serve();
    }
    if (game.state === 'play') {
      for (let i = 0; i < 3 && game.state === 'play'; i++) substep(dt / 3);
    }
    if (game.state === 'play') {
      glow.position.set(ball.position.x, ball.position.y + 1.2, ball.position.z);
      ball.rotation.z -= (vel.x / R) * dt;
      ball.rotation.x += (vel.z / R) * dt;
      ball.rotation.z -= ball.userData.spin * 40 * dt;
    }
  }

  for (const r of [racketL, racketR]) {
    r.userData.spd = Math.hypot(r.position.y - (r.userData.ly ?? r.position.y), r.position.z - (r.userData.lz ?? r.position.z)) / Math.max(dt, 1e-3);
    r.userData.ly = r.position.y;
    r.userData.lz = r.position.z;
    r.userData.sw = Math.max(0, (r.userData.sw || 0) - dt * 4);
    r.rotation.z = r.userData.sw * 0.6 * (r === racketL ? 1 : -1);
  }
  // Sparks
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.userData.v.y += G * dt;
    s.position.addScaledVector(s.userData.v, dt);
    s.userData.life -= dt;
    if (s.userData.life <= 0) { scene.remove(s); sparks.splice(i, 1); }
  }

  if (msgT > 0) { msgT -= dt; if (msgT <= 0) $('msg').style.opacity = 0; }
}

// Input
canvas.addEventListener('pointermove', e => {
  mouseT = {
    nx: e.clientX / innerWidth * 2 - 1,
    ny: -(e.clientY / innerHeight) * 2 + 1
  };
});
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k.startsWith('arrow') || k === ' ') e.preventDefault();
  keys[k] = true;
  if (!e.repeat && (k === 'p' || k === 'escape')) togglePause();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
$('pauseBtn').onclick = togglePause;
$('sndBtn').onclick = () => { muted = !muted; $('sndBtn').textContent = muted ? '🔇 Sound off' : '🔊 Sound on'; };

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

toMenu();
requestAnimationFrame(frame);
</script>
</body>
</html>
