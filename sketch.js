// Variables para la pelota
let pelotaX, pelotaY, velocidadPelotaX, velocidadPelotaY, diametroPelota;
let anguloRotacion = 0; // Ángulo de rotación para el efecto de giro
let velocidadRotacion = 0; // Velocidad de rotación que se ajustará según la velocidad de la pelota

// Variables para las raquetas
let raquetaJugadorX, raquetaJugadorY, anchoRaqueta, altoRaqueta;
let raquetaComputadorX, raquetaComputadorY;

// Puntuación
let puntosJugador = 0;
let puntosComputadora = 0;

// Estado del juego
let juegoPausado = false;

// Variables para las imágenes
let fondo;
let barraJugador;
let barraComputador;
let bola;

// Sonido
let sonidoRebote;

function preload() {
    // Cargar las imágenes
    fondo = loadImage('fondo1.png'); // Imagen de fondo
    barraJugador = loadImage('barra1.png'); // Raqueta del jugador
    barraComputador = loadImage('barra2.png'); // Raqueta de la computadora
    bola = loadImage('bola.png'); // Pelota
    
    // Cargar el sonido de rebote
    sonidoRebote = loadSound('bounce.wav'); // Asegúrate de que el archivo bounce.wav esté en la carpeta correcta
}

function setup() {
    createCanvas(800, 400); // Crea un canvas de 800x400

    // Posición inicial de la pelota
    pelotaX = width / 2;
    pelotaY = height / 2;
    diametroPelota = 20; // Ajusta este valor según el tamaño de bola.png

    // Velocidad inicial de la pelota
    velocidadPelotaX = 10;
    velocidadPelotaY = 3;

    // Tamaño de las raquetas (ajustar según el tamaño de barra1.png y barra2.png)
    anchoRaqueta = 10; // Cambia esto si las imágenes son más anchas
    altoRaqueta = 70; // Cambia esto si las imágenes son más altas

    // Posición inicial de las raquetas
    raquetaJugadorX = 10;
    raquetaJugadorY = height / 2 - altoRaqueta / 2;

    raquetaComputadorX = width - anchoRaqueta - 10;
    raquetaComputadorY = height / 2 - altoRaqueta / 2;
}

function draw() {
    // Mostrar la imagen de fondo
    image(fondo, 0, 0, width, height); // Dibuja la imagen de fondo

    // Si el juego está pausado, no actualizamos la lógica del juego
    if (juegoPausado) {
        fill(255);
        textSize(32);
        textAlign(CENTER);
        text("Juego Pausado", width / 2, height / 2);
        return; // Salimos de la función draw
    }

    // Dibujar marco superior e inferior
    fill(color("blue"));
    rect(0, 0, width, 10); // Marco superior
    rect(0, height - 10, width, 10); // Marco inferior

    // Dibujar y rotar la pelota
    push();
    translate(pelotaX, pelotaY); // Trasladar el sistema de coordenadas al centro de la pelota
    rotate(anguloRotacion); // Aplicar la rotación

    // Dibujar la imagen de la pelota
    imageMode(CENTER);
    image(bola, 0, 0, diametroPelota, diametroPelota); // Dibuja la imagen de la pelota
    pop();

    // Ajustar el ángulo de rotación según la velocidad de la pelota
    let velocidadTotal = sqrt(velocidadPelotaX * velocidadPelotaX + velocidadPelotaY * velocidadPelotaY); // Magnitud de la velocidad
    velocidadRotacion = velocidadTotal * 0.05; // Escalar la velocidad de rotación
    anguloRotacion += velocidadRotacion; // Incrementar el ángulo de rotación

    // Dibujar raquetas
    image(barraJugador, raquetaJugadorX, raquetaJugadorY, anchoRaqueta, altoRaqueta); // Raqueta del jugador
    image(barraComputador, raquetaComputadorX, raquetaComputadorY, anchoRaqueta, altoRaqueta); // Raqueta del computador

    // Movimiento de la pelota
    pelotaX += velocidadPelotaX;
    pelotaY += velocidadPelotaY;

    // Rebote en los marcos superior e inferior
    if (pelotaY - diametroPelota / 2 < 10 || pelotaY + diametroPelota / 2 > height - 10) {
        velocidadPelotaY *= -1;
    }

    // Movimiento de la raqueta del jugador con el ratón
    raquetaJugadorY = constrain(mouseY - altoRaqueta / 2, 10, height - altoRaqueta - 10);

    // Movimiento automático de la raqueta del computador (IA)
    if (pelotaY > raquetaComputadorY + altoRaqueta / 2) {
        raquetaComputadorY += 2.85; // Mover hacia abajo (5% más lento)
    } else {
        raquetaComputadorY -= 2.85; // Mover hacia arriba (5% más lento)
    }
    
    // Evitar que la raqueta de la computadora salga de los límites
    raquetaComputadorY = constrain(raquetaComputadorY, 10, height - altoRaqueta - 10);

    // Colisiones con las raquetas
    if (pelotaX - diametroPelota / 2 < raquetaJugadorX + anchoRaqueta &&
        pelotaY > raquetaJugadorY &&
        pelotaY < raquetaJugadorY + altoRaqueta) {
        
        // Reproducir sonido de rebote
        sonidoRebote.play();

        // Calcular el punto de colisión en la raqueta del jugador
        let posicionColision = pelotaY - (raquetaJugadorY + altoRaqueta / 2);
        let anguloImpacto = map(posicionColision, -altoRaqueta / 2, altoRaqueta / 2, -PI / 3, PI / 3); // Rango de -60 a 60 grados

        velocidadPelotaX *= -1; // Invertir dirección en X
        velocidadPelotaY = 5 * sin(anguloImpacto); // Ajustar velocidad en Y
    }

    if (pelotaX + diametroPelota / 2 > raquetaComputadorX &&
        pelotaY > raquetaComputadorY &&
        pelotaY < raquetaComputadorY + altoRaqueta) {
        
        // Reproducir sonido de rebote
        sonidoRebote.play();

        // Calcular el punto de colisión en la raqueta de la computadora
        let posicionColision = pelotaY - (raquetaComputadorY + altoRaqueta / 2);
        let anguloImpacto = map(posicionColision, -altoRaqueta / 2, altoRaqueta / 2, -PI / 3, PI / 3); // Rango de -60 a 60 grados

        velocidadPelotaX *= -1; // Invertir dirección en X
        velocidadPelotaY = 5 * sin(anguloImpacto); // Ajustar velocidad en Y
    }

    // Puntuación y reinicio de la pelota si sale de los bordes laterales
    if (pelotaX - diametroPelota / 2 < 0) {
        puntosComputadora++;
        reiniciarPelota();
    } else if (pelotaX + diametroPelota / 2 > width) {
        puntosJugador++;
        reiniciarPelota();
    }

    // Mostrar puntuación
    textSize(32);
    fill(255);
    textAlign(LEFT);
    text(puntosJugador, width / 4, 50);
    textAlign(RIGHT);
    text(puntosComputadora, width - width / 4, 50);
    
    // Mostrar instrucciones de pausa y autor
    textSize(16);
    fill(255);
    textAlign(LEFT);
    text("Presiona 'P' para pausar", 10, height - 20);
    textAlign(RIGHT);
    text("Autor: SERGIO MM", width - 10, height - 20);
}

// Función para reiniciar la pelota al centro
function reiniciarPelota() {
    pelotaX = width / 2;
    pelotaY = height / 2;
    velocidadPelotaX *= -1;
}

// Control de pausa del juego
function keyPressed() {
    if (key === 'p' || key === 'P') {
        juegoPausado = !juegoPausado; // Alternar el estado de pausa
    }
}
