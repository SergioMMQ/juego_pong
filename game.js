'use strict';

// ── Canvas ────────────────────────────────────────────────
const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d');
// DPR: evita el desenfoque en pantallas de alta densidad (Retina, AMOLED)
const dpr = Math.min(window.devicePixelRatio || 1, 3);
canvas.width  = 390 * dpr;
canvas.height = 600 * dpr;
ctx.scale(dpr, dpr);
const W = 390;
const H = 600;

// ── Marca (editable para cada cliente) ───────────────────
const MARCA = {
  nombre: 'Café Aurora',
  emoji:  '☕',
};
const PROMO = { facil: '5%', normal: '8%', dificil: '10%' };

// ── Paleta ────────────────────────────────────────────────
const C = {
  bg:        '#0F0805',
  bgCard:    '#1E1008',
  accent:    '#B87333',
  accentLt:  '#D4944A',
  paddleJ:   '#C4842C',
  paddleC:   '#7A5228',
  ball:      '#ECD5A0',
  text:      '#ECD5A0',
  textSub:   '#8C6B47',
  textMuted: '#4A2E14',
};

// ── Constantes ────────────────────────────────────────────
const PW = 80, PH = 14, BR = 9;
const PUNTOS_WIN = 3;
const VEL_X0 = 2, VEL_Y0 = 2.5;
const VEL_BASE = 5, VEL_ACCEL = 1.06, VEL_MAX = 13;
const IA_VEL = { facil: 1.5, normal: 2.7, dificil: 4.4 };

// ── Estado ────────────────────────────────────────────────
let estado = 'inicio', modoJuego = '1p', dificultad = 'normal';
let ptJ = 0, ptC = 0, ganador = '';
let primerGolpe = true, flashFrames = 0, conteoTimer = 0;
const teclas = {};
let hoverKey = '';

// ── Objetos ───────────────────────────────────────────────
// Juego vertical: jugador abajo, CPU arriba
const ball = { x: W/2, y: H/2, vx: 0, vy: 0, rot: 0 };
const pJ   = { x: W/2-PW/2, y: H-62, w: PW, h: PH }; // jugador (abajo)
const pC   = { x: W/2-PW/2, y: 48,   w: PW, h: PH }; // CPU/J2  (arriba)

// ── Input ─────────────────────────────────────────────────
let iptX = W/2, iptX2 = W/2; // X del dedo/mouse para cada jugador

// ── Audio (Web Audio API, sin archivos externos) ──────────
let ac;
function initAudio() {
  if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
}
function beep(freq, dur, vol = 0.08) {
  if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (_) {}
}

// ── Utilidades ────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function getPos(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) * W / r.width,
    y: (clientY - r.top)  * H / r.height,
  };
}

function rRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y,   x+w,y+r,   r);
  ctx.lineTo(x+w, y+h-r);                    ctx.arcTo(x+w,y+h, x+w-r,y+h, r);
  ctx.lineTo(x+r, y+h);                      ctx.arcTo(x,  y+h, x,y+h-r,   r);
  ctx.lineTo(x,   y+r);                      ctx.arcTo(x,  y,   x+r,y,      r);
  ctx.closePath();
}

// ── Botones ───────────────────────────────────────────────
const BTNS = {
  modo1p:     { x: W/2-152, y: 268, w: 130, h: 40, label: '1 Jugador'   },
  modo2p:     { x: W/2+22,  y: 268, w: 148, h: 40, label: '2 Jugadores' },
  facil:      { x: W/2-170, y: 332, w: 100, h: 36, label: 'Fácil'       },
  normal:     { x: W/2-44,  y: 332, w: 100, h: 36, label: 'Normal'      },
  dificil:    { x: W/2+82,  y: 332, w: 100, h: 36, label: 'Difícil'     },
  jugar:      { x: W/2-100, y: 390, w: 200, h: 50, label: 'JUGAR'       },
  reintentar: { x: W/2-110, y: H*0.70, w: 220, h: 48, label: 'Intentar de nuevo' },
};

function drawBtn(key, activo = false, primario = false) {
  const b = BTNS[key]; if (!b) return;
  const hov = hoverKey === key;
  rRect(b.x, b.y, b.w, b.h, 8);
  ctx.fillStyle = primario ? (hov ? C.accentLt : C.accent)
                : activo   ? C.accent
                :            (hov ? '#2A1A10' : C.bgCard);
  ctx.fill();
  ctx.strokeStyle = (activo || primario) ? C.accent : C.textMuted;
  ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = (activo || primario) ? C.text : C.textSub;
  ctx.font = `${activo || primario ? '700' : '400'} 14px Roboto, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w/2, b.y + b.h/2);
}

function inBtn(key, x, y) {
  const b = BTNS[key];
  return b && x > b.x && x < b.x+b.w && y > b.y && y < b.y+b.h;
}

// ── Reset ─────────────────────────────────────────────────
function resetBall(dirY = 1) {
  ball.x = W/2; ball.y = H/2; ball.rot = 0;
  ball.vx = (Math.random() > .5 ? 1 : -1) * VEL_X0;
  ball.vy = dirY * VEL_Y0;
  primerGolpe = true;
}

function resetPaddles() {
  pJ.x = pC.x = W/2 - PW/2;
  iptX = iptX2 = W/2;
}

function reiniciarJuego() {
  ptJ = ptC = 0; ganador = ''; flashFrames = 0;
  document.getElementById('overlay').classList.add('hidden');
  resetBall(1); resetPaddles();
  estado = 'conteo'; conteoTimer = 180;
}

function iniciarSaque(quienGano) {
  // Saque hacia quien anotó
  resetBall(quienGano === 'cpu' ? -1 : 1);
  resetPaddles();
  estado = 'conteo'; conteoTimer = 180;
}

// ── Update ────────────────────────────────────────────────
function update() {
  if (estado !== 'jugando') return;

  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.rot += Math.hypot(ball.vx, ball.vy) * 0.04;

  // Paredes laterales
  if (ball.x - BR < 0)  { ball.x = BR;   ball.vx =  Math.abs(ball.vx); }
  if (ball.x + BR > W)  { ball.x = W-BR; ball.vx = -Math.abs(ball.vx); }

  if (flashFrames > 0) flashFrames--;

  // Mover raqueta jugador (sigue al input X)
  pJ.x = clamp(iptX - PW/2, 0, W - PW);

  // Mover raqueta CPU o J2
  if (modoJuego === '2p') {
    if (teclas['ArrowLeft'])  iptX2 = clamp(iptX2 - 8, PW/2, W - PW/2);
    if (teclas['ArrowRight']) iptX2 = clamp(iptX2 + 8, PW/2, W - PW/2);
    pC.x = clamp(iptX2 - PW/2, 0, W - PW);
  } else {
    const vel = IA_VEL[dificultad];
    const tgt = ball.x - PW/2;
    pC.x = clamp(pC.x + clamp(tgt - pC.x, -vel, vel), 0, W - PW);
  }

  // Colisión jugador (abajo, pelota baja)
  if (ball.vy > 0 &&
      ball.y + BR >= pJ.y &&
      ball.y + BR <= pJ.y + PH + Math.abs(ball.vy) &&
      ball.x >= pJ.x && ball.x <= pJ.x + PW) {
    bounce(pJ, true);
  }

  // Colisión CPU (arriba, pelota sube)
  if (ball.vy < 0 &&
      ball.y - BR <= pC.y + PH &&
      ball.y - BR >= pC.y - Math.abs(ball.vy) &&
      ball.x >= pC.x && ball.x <= pC.x + PW) {
    bounce(pC, false);
  }

  // Puntos
  if (ball.y - BR < 0) {
    // Pelota salió por arriba → jugador anota
    ptJ++; flashFrames = 20; beep(550, 0.22);
    ptJ >= PUNTOS_WIN ? end('jugador') : iniciarSaque('jugador');
  } else if (ball.y + BR > H) {
    // Pelota salió por abajo → CPU anota
    ptC++; flashFrames = 20; beep(220, 0.22);
    ptC >= PUNTOS_WIN ? end('cpu') : iniciarSaque('cpu');
  }
}

function bounce(paddle, isPlayer) {
  beep(isPlayer ? 480 : 340, 0.05);
  const rel   = (ball.x - (paddle.x + paddle.w/2)) / (paddle.w/2);
  const angle = clamp(rel, -1, 1) * Math.PI / 3;
  const speed = primerGolpe
    ? (primerGolpe = false, VEL_BASE)
    : Math.min(Math.hypot(ball.vx, ball.vy) * VEL_ACCEL, VEL_MAX);
  ball.vx = speed * Math.sin(angle);
  ball.vy = isPlayer
    ? -Math.abs(speed * Math.cos(angle))
    :  Math.abs(speed * Math.cos(angle));
}

function end(quien) {
  ganador = quien; estado = 'fin';
  if (quien === 'jugador') {
    beep(660, 0.1); setTimeout(() => beep(880, 0.1), 140); setTimeout(() => beep(1100, 0.18), 280);
    if (modoJuego === '1p') {
      // Mostrar descuento según dificultad
      const pct = PROMO[dificultad];
      document.querySelector('#overlay .promo-pct').textContent = pct;
      document.getElementById('overlay').classList.remove('hidden');
      setTimeout(() => document.getElementById('lead-input').focus(), 350);
    }
    // En 2P no hay cupón, la victoria se muestra en canvas
  } else {
    beep(180, 0.5);
  }
}

// ── Render ────────────────────────────────────────────────
function render() {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  switch (estado) {
    case 'inicio':  renderInicio();  return;
    case 'conteo':  renderCampo();   renderConteo();  return;
    case 'jugando': renderCampo();   return;
    case 'pausado': renderCampo();   renderOverlay('PAUSA', 'Presiona P para continuar'); return;
    case 'fin':
      renderCampo();
      if (modoJuego === '2p') renderGanaste2P();
      else if (ganador === 'cpu') renderPerdiste();
      return;
  }
}

// ── Render: campo ─────────────────────────────────────────
function renderCampo() {
  // Línea divisoria central
  ctx.save();
  ctx.strokeStyle = C.textMuted; ctx.lineWidth = 1; ctx.setLineDash([4, 9]);
  ctx.beginPath(); ctx.moveTo(16, H/2); ctx.lineTo(W-16, H/2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Flash de punto
  if (flashFrames > 0) {
    ctx.fillStyle = `rgba(184,115,51,${(flashFrames/20) * 0.26})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Nombre marca (muy sutil, centro)
  ctx.save();
  ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textMuted;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(MARCA.nombre, W/2, H/2);
  ctx.restore();

  // Raqueta jugador (abajo) con brillo
  rRect(pJ.x, pJ.y, PW, PH, 7); ctx.fillStyle = C.paddleJ; ctx.fill();
  rRect(pJ.x+3, pJ.y+2, PW-6, 4, 2);
  ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();

  // Raqueta CPU (arriba)
  rRect(pC.x, pC.y, PW, PH, 7); ctx.fillStyle = C.paddleC; ctx.fill();

  // Pelota con brillo
  ctx.save();
  ctx.translate(ball.x, ball.y); ctx.rotate(ball.rot);
  ctx.beginPath(); ctx.arc(0, 0, BR, 0, Math.PI*2);
  ctx.fillStyle = C.ball; ctx.fill();
  ctx.beginPath(); ctx.arc(BR*0.28, -BR*0.28, BR*0.26, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.32)'; ctx.fill();
  ctx.restore();

  // Marcador jugador (abajo)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.textBaseline = 'bottom'; ctx.fillText(ptJ, W*0.27, H - 10);
  ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText(modoJuego === '2p' ? 'J1' : 'Tú', W*0.27, H - 42);

  // Marcador CPU (arriba)
  ctx.font = 'bold 30px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.textBaseline = 'top'; ctx.fillText(ptC, W*0.73, 10);
  ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText(modoJuego === '2p' ? 'J2' : 'CPU', W*0.73, 42);
  ctx.restore();

  // Instrucción pausa
  ctx.save();
  ctx.font = '10px Roboto, sans-serif'; ctx.fillStyle = C.textMuted;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('P = pausa', 14, H/2 + 8);
  ctx.restore();
}

// ── Render: inicio ────────────────────────────────────────
function renderInicio() {
  // Círculo logo
  ctx.save();
  ctx.beginPath(); ctx.arc(W/2, 148, 58, 0, Math.PI*2);
  ctx.fillStyle = C.bgCard; ctx.fill();
  ctx.strokeStyle = '#3A2010'; ctx.lineWidth = 1; ctx.stroke();
  ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(MARCA.emoji, W/2, 150);
  ctx.restore();

  // Nombre marca
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = "bold 22px 'Playfair Display', Georgia, serif";
  ctx.fillStyle = C.accent;
  ctx.fillText(MARCA.nombre, W/2, 218);
  ctx.restore();

  // Separador
  ctx.save();
  ctx.strokeStyle = '#3A2010'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(90, 252); ctx.lineTo(W-90, 252); ctx.stroke();
  ctx.restore();

  // Etiquetas
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText('MODO', W/2, 257);
  ctx.restore();

  drawBtn('modo1p', modoJuego === '1p');
  drawBtn('modo2p', modoJuego === '2p');

  if (modoJuego === '1p') {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
    ctx.fillText('DIFICULTAD', W/2, 320);
    ctx.restore();
    drawBtn('facil',   dificultad === 'facil');
    drawBtn('normal',  dificultad === 'normal');
    drawBtn('dificil', dificultad === 'dificil');
  }

  drawBtn('jugar', false, true);

  // Instrucciones pie
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.font = '11px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  const tip = modoJuego === '1p'
    ? `Desliza el dedo · Meta ${PUNTOS_WIN} puntos para ganar`
    : `J1: zona inferior · J2: zona superior · Meta ${PUNTOS_WIN} puntos`;
  ctx.fillText(tip, W/2, H - 10);
  ctx.restore();
}

// ── Render: conteo ────────────────────────────────────────
function renderConteo() {
  ctx.fillStyle = 'rgba(15,8,5,0.72)'; ctx.fillRect(0, 0, W, H);
  conteoTimer--;
  if (conteoTimer <= 0) { estado = 'jugando'; return; }
  const val = Math.ceil(conteoTimer / 60);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 92px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.fillText(val, W/2, H/2);
  ctx.restore();
}

// ── Render: overlay genérico (pausa) ─────────────────────
function renderOverlay(titulo, sub) {
  ctx.fillStyle = 'rgba(15,8,5,0.78)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 38px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.fillText(titulo, W/2, H/2 - 18);
  ctx.font = '13px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText(sub, W/2, H/2 + 20);
  ctx.restore();
}

// ── Render: victoria 2P ──────────────────────────────────
function renderGanaste2P() {
  const quien = ganador === 'jugador' ? 'J1' : 'J2';
  ctx.fillStyle = 'rgba(15,8,5,0.85)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 42px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.textBaseline = 'middle'; ctx.fillText(`¡${quien} gana!`, W/2, H*0.38);
  ctx.font = '20px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText(`${ptJ} — ${ptC}`, W/2, H*0.50);
  ctx.restore();
  drawBtn('reintentar', false, true);
}

// ── Render: perdiste ──────────────────────────────────────
function renderPerdiste() {
  ctx.fillStyle = 'rgba(15,8,5,0.85)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 34px Roboto, sans-serif'; ctx.fillStyle = C.text;
  ctx.textBaseline = 'middle'; ctx.fillText('¡Tan cerca!', W/2, H*0.37);
  ctx.font = '18px Roboto, sans-serif'; ctx.fillStyle = C.textSub;
  ctx.fillText(`${ptJ} — ${ptC}`, W/2, H*0.49);
  ctx.font = '13px Roboto, sans-serif'; ctx.fillStyle = C.textMuted;
  ctx.fillText('¿Lo intentas de nuevo?', W/2, H*0.57);
  ctx.restore();
  drawBtn('reintentar', false, true);
}

// ── Game loop ─────────────────────────────────────────────
requestAnimationFrame(function loop() {
  update();
  render();
  requestAnimationFrame(loop);
});

// ── Mouse ─────────────────────────────────────────────────
canvas.addEventListener('mousemove', e => {
  const p = getPos(e.clientX, e.clientY);
  iptX = p.x;
  hoverKey = Object.keys(BTNS).find(k => inBtn(k, p.x, p.y)) ?? '';
});

canvas.addEventListener('click', e => {
  initAudio();
  const p = getPos(e.clientX, e.clientY);
  handleTap(p.x, p.y);
});

// ── Touch ─────────────────────────────────────────────────
canvas.addEventListener('touchstart', e => {
  e.preventDefault(); initAudio();
  const p = getPos(e.touches[0].clientX, e.touches[0].clientY);
  handleTap(p.x, p.y);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.touches) {
    const p = getPos(t.clientX, t.clientY);
    // 2P: zona superior → J2, zona inferior → J1
    if (modoJuego === '2p' && p.y < H/2) iptX2 = p.x;
    else iptX = p.x;
  }
}, { passive: false });

// ── Teclado ───────────────────────────────────────────────
document.addEventListener('keydown', e => {
  teclas[e.key] = true; initAudio();
  if (e.key === 'p' || e.key === 'P') {
    if (estado === 'jugando') estado = 'pausado';
    else if (estado === 'pausado') estado = 'jugando';
  }
  if ((e.key === 'r' || e.key === 'R') && estado === 'fin') reiniciarJuego();
});
document.addEventListener('keyup', e => { delete teclas[e.key]; });

// ── Click / tap handler ───────────────────────────────────
function handleTap(x, y) {
  if (estado === 'inicio') {
    if (inBtn('modo1p',   x, y)) { modoJuego = '1p'; return; }
    if (inBtn('modo2p',   x, y)) { modoJuego = '2p'; return; }
    if (modoJuego === '1p') {
      if (inBtn('facil',   x, y)) { dificultad = 'facil';   return; }
      if (inBtn('normal',  x, y)) { dificultad = 'normal';  return; }
      if (inBtn('dificil', x, y)) { dificultad = 'dificil'; return; }
    }
    if (inBtn('jugar', x, y)) reiniciarJuego();
  } else if (estado === 'fin' && ganador === 'cpu') {
    if (inBtn('reintentar', x, y)) reiniciarJuego();
  }
}

// ── Formulario de captura (delegado para contenido dinámico) ─
document.getElementById('overlay').addEventListener('click', e => {
  if (e.target.id === 'lead-btn')           handleLeadSubmit();
  if (e.target.classList.contains('btn-reiniciar')) reiniciarJuego();
});

function validarContacto(val) {
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const telRe   = /^\+?[\d\s\-\(\)]{7,15}$/;
  return emailRe.test(val) || telRe.test(val);
}

function handleLeadSubmit() {
  const input = document.getElementById('lead-input');
  if (!validarContacto(input.value.trim())) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 400);
    input.focus();
    return;
  }
  const pct = PROMO[dificultad];
  document.querySelector('#overlay .card').innerHTML = `
    <div class="card-icon-wrap"><span class="card-icon">✅</span></div>
    <h2>¡Cupón enviado!</h2>
    <div class="discount-banner">
      <span class="discount-pct">${pct}</span>
      <span class="discount-label">de descuento</span>
    </div>
    <p class="sub">Nos vemos pronto en <strong>${MARCA.nombre}</strong> ${MARCA.emoji}</p>
    <button class="card-btn btn-reiniciar" style="margin-top:6px">Jugar de nuevo</button>
  `;
}
