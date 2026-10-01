// ── Paleta ───────────────────────────────────────────────
const C = {
  verde:    '#2dad5e',
  verdeClaro: '#34c26c',
  oscuro:   '#0d0d0d',
  oscuro2:  '#1c1c1c',
  blanco:   '#ffffff',
  gris:     '#aaaaaa',
  grisMid:  '#666666',
};

// ── Constantes ───────────────────────────────────────────
const VEL_X_BASE  = 8;
const VEL_Y_BASE  = 3;
const VEL_X_INICIO = 3;   // velocidad lenta al sacar
const VEL_Y_INICIO = 1.2;
const VEL_ACCEL   = 1.05;
const VEL_MAX     = 16;
const PUNTOS_WIN  = 5;
const IA_VEL      = { facil: 1.8, normal: 2.85, dificil: 4.5 };

// ── Estado ───────────────────────────────────────────────
let primerGolpe = true;      // false tras el primer rebote en raqueta
let estado     = 'inicio';   // 'inicio' | 'conteo' | 'jugando' | 'pausado' | 'fin'
let modoJuego  = '1p';
let dificultad = 'normal';
let ganador    = '';
let conteoTimer = 180;       // 3 seg a 60fps
let flashFrames = 0;

// ── Pelota ───────────────────────────────────────────────
let pelotaX, pelotaY, vx, vy, diam, angRot;

// ── Raquetas ─────────────────────────────────────────────
let jX, jY, cX, cY, rW, rH;

// ── Puntuación ───────────────────────────────────────────
let ptJ = 0, ptC = 0;

// ── Input 2P ─────────────────────────────────────────────
let teclas = {};

// ── Assets ───────────────────────────────────────────────
let imgFondo, imgBJ, imgBC, imgBola;
let sndRebote, sndFin;

// ── Botones ──────────────────────────────────────────────
let btns = {};

// ─────────────────────────────────────────────────────────
function preload() {
  imgFondo  = loadImage('fondo1.png');
  imgBJ     = loadImage('barra1.png');
  imgBC     = loadImage('barra2.png');
  imgBola   = loadImage('bola.png');
  sndRebote = loadSound('bounce.wav');
  sndFin    = loadSound('173859__jivatma07__j1game_over_mono.wav');
}

function setup() {
  let c = createCanvas(800, 400);
  c.parent('contenedor-juego');
  textFont('Roboto');
  rW = 10; rH = 70;
  jX = 10;
  cX = width - rW - 10;
  calcularBotones();
  resetPosiciones();
}

function calcularBotones() {
  const cx = width / 2;
  btns.modo1p  = mkBtn(cx - 155, 178, 130, 38, '1 Jugador');
  btns.modo2p  = mkBtn(cx + 25,  178, 150, 38, '2 Jugadores');
  btns.facil   = mkBtn(cx - 182, 240, 105, 34, 'Fácil');
  btns.normal  = mkBtn(cx - 52,  240, 105, 34, 'Normal');
  btns.dificil = mkBtn(cx + 78,  240, 105, 34, 'Difícil');
  btns.jugar   = mkBtn(cx - 90,  298, 180, 44, 'JUGAR');
}

function mkBtn(x, y, w, h, label) { return { x, y, w, h, label }; }

function resetPosiciones() {
  diam    = 20;
  pelotaX = width / 2;
  pelotaY = height / 2;
  angRot  = 0;
  jY      = height / 2 - rH / 2;
  cY      = height / 2 - rH / 2;
}

function reiniciarJuego() {
  ptJ = 0; ptC = 0;
  ganador     = '';
  flashFrames = 0;
  resetPosiciones();
  // Dirección aleatoria al inicio de partida, velocidad lenta
  vx = (random() > 0.5 ? 1 : -1) * VEL_X_INICIO;
  vy = VEL_Y_INICIO;
  primerGolpe = true;
  estado      = 'conteo';
  conteoTimer = 180;
}

// haciaIzquierda = true  → pelota va hacia el jugador izquierdo (el que perdió el punto)
// haciaIzquierda = false → pelota va hacia el jugador derecho  (el que perdió el punto)
function iniciarSaque(haciaIzquierda) {
  resetPosiciones();
  vx          = haciaIzquierda ? -VEL_X_INICIO : VEL_X_INICIO;
  vy          = VEL_Y_INICIO;
  primerGolpe = true;
  estado      = 'conteo';
  conteoTimer = 180;
}

// ── DRAW ─────────────────────────────────────────────────
function draw() {
  switch (estado) {
    case 'inicio':  drawInicio(); break;
    case 'conteo':  drawJuego(); drawConteo(); break;
    case 'jugando': drawJuego(); break;
    case 'pausado': drawJuego(); drawPausa(); break;
    case 'fin':     drawJuego(); drawFin();   break;
  }
}

// ── Pantalla de inicio ───────────────────────────────────
function drawInicio() {
  background(C.oscuro);

  stroke(C.verde); strokeWeight(1); setLineDash([6, 10]);
  line(width / 2, 0, width / 2, height);
  setLineDash([]); noStroke();

  textAlign(CENTER, CENTER);
  textSize(72); textStyle(BOLD);
  fill(C.blanco);
  text('PONG', width / 2, 110);

  textSize(11); textStyle(NORMAL);
  fill(C.gris);
  text('MODO', width / 2, 160);

  drawBtn(btns.modo1p, modoJuego === '1p');
  drawBtn(btns.modo2p, modoJuego === '2p');

  if (modoJuego === '1p') {
    textSize(11); fill(C.gris); textStyle(NORMAL); textAlign(CENTER, CENTER);
    text('DIFICULTAD', width / 2, 222);
    drawBtn(btns.facil,   dificultad === 'facil');
    drawBtn(btns.normal,  dificultad === 'normal');
    drawBtn(btns.dificil, dificultad === 'dificil');
  }

  drawBtn(btns.jugar, false, true);

  textSize(11); fill(C.grisMid); textStyle(NORMAL); textAlign(CENTER);
  let tip = modoJuego === '1p'
    ? 'Ratón para mover · Gana el primero en llegar a ' + PUNTOS_WIN + ' puntos'
    : 'J1: ratón · J2: ↑↓ · Gana el primero en llegar a ' + PUNTOS_WIN + ' puntos';
  text(tip, width / 2, height - 15);
}

function drawBtn(b, activo, destacado = false) {
  let hover = mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;

  if (destacado) {
    fill(hover ? C.verdeClaro : C.verde);
  } else if (activo) {
    fill(C.verde);
  } else {
    fill(hover ? '#2a2a2a' : C.oscuro2);
  }

  stroke(activo || destacado ? C.verde : C.grisMid);
  strokeWeight(1);
  rect(b.x, b.y, b.w, b.h, 6);

  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13); textStyle(activo || destacado ? BOLD : NORMAL);
  fill(activo || destacado ? C.blanco : C.gris);
  text(b.label, b.x + b.w / 2, b.y + b.h / 2);
}

// ── Campo de juego ───────────────────────────────────────
function drawJuego() {
  image(imgFondo, 0, 0, width, height);

  // Flash al anotar
  if (flashFrames > 0) {
    noStroke(); fill(45, 173, 94, map(flashFrames, 0, 20, 0, 55));
    rect(0, 0, width, height);
    flashFrames--;
  }

  // Marcos
  noStroke(); fill(C.verde);
  rect(0, 0, width, 10);
  rect(0, height - 10, width, 10);

  // Línea central
  stroke(C.verde); strokeWeight(1); setLineDash([6, 10]);
  line(width / 2, 10, width / 2, height - 10);
  setLineDash([]); noStroke();

  // Seguimiento del jugador (siempre activo)
  jY = constrain(mouseY - rH / 2, 10, height - rH - 10);
  if (modoJuego === '2p' && estado !== 'fin') {
    if (teclas[UP_ARROW])   cY -= 5;
    if (teclas[DOWN_ARROW]) cY += 5;
    cY = constrain(cY, 10, height - rH - 10);
  }

  // Pelota (gira siempre)
  push();
  translate(pelotaX, pelotaY);
  rotate(angRot);
  imageMode(CENTER);
  image(imgBola, 0, 0, diam, diam);
  pop();
  angRot += sqrt(vx * vx + vy * vy) * 0.05;

  // Raquetas
  image(imgBJ, jX, jY, rW, rH);
  image(imgBC, cX, cY, rW, rH);

  // Física solo cuando está jugando
  if (estado === 'jugando') {
    pelotaX += vx;
    pelotaY += vy;
    if (pelotaY - diam / 2 < 10 || pelotaY + diam / 2 > height - 10) vy *= -1;
    if (modoJuego === '1p') moverIA();
    verificarColisiones();
    verificarPuntos();
  }

  // HUD
  noStroke(); textStyle(BOLD); textSize(34);
  fill(C.blanco); textAlign(CENTER);
  text(ptJ, width / 4,     45);
  text(ptC, width * 3 / 4, 45);

  textSize(12); textStyle(NORMAL);
  fill(C.grisMid); textAlign(LEFT);
  text('P = pausa', 15, height - 15);
}

// ── Overlays ─────────────────────────────────────────────
function drawConteo() {
  fill(0, 0, 0, 160); noStroke();
  rect(0, 0, width, height);

  conteoTimer--;
  if (conteoTimer <= 0) { estado = 'jugando'; return; }

  let val = ceil(conteoTimer / 60);
  textAlign(CENTER, CENTER); textStyle(BOLD); textSize(90);
  fill(C.blanco);
  text(val, width / 2, height / 2);
}

function drawPausa() {
  fill(0, 0, 0, 160); noStroke();
  rect(0, 0, width, height);
  textAlign(CENTER, CENTER);
  textSize(38); textStyle(BOLD); fill(C.blanco);
  text('PAUSA', width / 2, height / 2 - 15);
  textSize(13); textStyle(NORMAL); fill(C.gris);
  text('Presiona P para continuar', width / 2, height / 2 + 25);
}

function drawFin() {
  fill(0, 0, 0, 185); noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  textSize(46); textStyle(BOLD); fill(C.blanco);
  text('¡' + ganador + ' gana!', width / 2, 85);

  textSize(26); textStyle(NORMAL); fill(C.gris);
  text(ptJ + '  —  ' + ptC, width / 2, 130);

  // Historial
  let hist = obtenerHistorial();
  if (hist.length > 0) {
    textSize(11); fill(C.grisMid);
    text('ÚLTIMAS PARTIDAS', width / 2, 170);
    for (let i = 0; i < hist.length; i++) {
      let h   = hist[i];
      let etJ = h.modo === '2p' ? 'J1' : 'Jugador';
      let etC = h.modo === '2p' ? 'J2' : 'CPU';
      textSize(12); fill(C.gris);
      text(etJ + ' ' + h.ptJ + ' — ' + h.ptC + ' ' + etC + '   ·   ganó: ' + h.ganador,
           width / 2, 195 + i * 24);
    }
  }

  if (frameCount % 60 < 42) {
    textSize(14); fill(C.verde);
    text('R = jugar de nuevo', width / 2, height - 25);
  }
}

// ── IA ───────────────────────────────────────────────────
function moverIA() {
  let vel = IA_VEL[dificultad];
  if (pelotaY > cY + rH / 2) cY += vel;
  else                        cY -= vel;
  cY = constrain(cY, 10, height - rH - 10);
}

// ── Colisiones ───────────────────────────────────────────
function verificarColisiones() {
  // Raqueta jugador
  if (vx < 0 &&
      pelotaX - diam / 2 < jX + rW &&
      pelotaY > jY && pelotaY < jY + rH) {
    sndRebote.play();
    let rel = pelotaY - (jY + rH / 2);
    let ang = map(rel, -rH / 2, rH / 2, -PI / 3, PI / 3);
    if (primerGolpe) {
      vx = VEL_X_BASE;
      primerGolpe = false;
    } else {
      vx = min(abs(vx) * VEL_ACCEL, VEL_MAX);
    }
    vy = 5 * sin(ang);
  }
  // Raqueta derecha
  if (vx > 0 &&
      pelotaX + diam / 2 > cX &&
      pelotaY > cY && pelotaY < cY + rH) {
    sndRebote.play();
    let rel = pelotaY - (cY + rH / 2);
    let ang = map(rel, -rH / 2, rH / 2, -PI / 3, PI / 3);
    if (primerGolpe) {
      vx = -VEL_X_BASE;
      primerGolpe = false;
    } else {
      vx = -min(abs(vx) * VEL_ACCEL, VEL_MAX);
    }
    vy = 5 * sin(ang);
  }
}

// ── Puntos ───────────────────────────────────────────────
function verificarPuntos() {
  if (pelotaX - diam / 2 < 0) {
    ptC++;
    flashFrames = 20;
    if (ptC >= PUNTOS_WIN) terminar(modoJuego === '2p' ? 'J2' : 'CPU');
    else iniciarSaque(false);  // CPU anotó → pelota va hacia CPU (el ganador del punto)
  } else if (pelotaX + diam / 2 > width) {
    ptJ++;
    flashFrames = 20;
    if (ptJ >= PUNTOS_WIN) terminar(modoJuego === '2p' ? 'J1' : 'Jugador');
    else iniciarSaque(true);   // Jugador anotó → pelota va hacia Jugador (el ganador del punto)
  }
}

function terminar(quien) {
  ganador = quien;
  estado  = 'fin';
  sndFin.play();
  guardarHistorial(quien);
}

// ── Historial localStorage ────────────────────────────────
function guardarHistorial(quien) {
  try {
    let hist = JSON.parse(localStorage.getItem('pong_hist') || '[]');
    hist.unshift({ ptJ, ptC, ganador: quien, modo: modoJuego });
    localStorage.setItem('pong_hist', JSON.stringify(hist.slice(0, 5)));
  } catch (e) {}
}

function obtenerHistorial() {
  try { return JSON.parse(localStorage.getItem('pong_hist') || '[]'); }
  catch (e) { return []; }
}

// ── Utilidades ───────────────────────────────────────────
function setLineDash(list) { drawingContext.setLineDash(list); }

function dentroDeBtn(b) {
  return mouseX > b.x && mouseX < b.x + b.w &&
         mouseY > b.y && mouseY < b.y + b.h;
}

// ── Input ────────────────────────────────────────────────
function mousePressed() {
  if (estado !== 'inicio') return;
  if (dentroDeBtn(btns.modo1p))  modoJuego  = '1p';
  if (dentroDeBtn(btns.modo2p))  modoJuego  = '2p';
  if (modoJuego === '1p') {
    if (dentroDeBtn(btns.facil))   dificultad = 'facil';
    if (dentroDeBtn(btns.normal))  dificultad = 'normal';
    if (dentroDeBtn(btns.dificil)) dificultad = 'dificil';
  }
  if (dentroDeBtn(btns.jugar)) reiniciarJuego();
}

function keyPressed() {
  teclas[keyCode] = true;
  if (estado === 'inicio' && keyCode === ENTER) { reiniciarJuego(); return; }
  if (key === 'p' || key === 'P') {
    if (estado === 'jugando') estado = 'pausado';
    else if (estado === 'pausado') estado = 'jugando';
  }
  if ((key === 'r' || key === 'R') && estado === 'fin') reiniciarJuego();
}

function keyReleased() { teclas[keyCode] = false; }
