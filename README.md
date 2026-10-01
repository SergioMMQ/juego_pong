# Pong

Juego clásico de Pong construido con p5.js. Disponible como demo jugable.

## Demo

Abre `index.html` en un servidor local, o despliega en GitHub Pages (ver más abajo).

## Características

- **Modo 1 jugador** — vs IA con 3 niveles: Fácil, Normal, Difícil
- **Modo 2 jugadores** — en el mismo equipo (J1: ratón · J2: ↑↓)
- **Aceleración progresiva** — la pelota gana velocidad en cada rebote
- **Cuenta regresiva** — 3-2-1 antes de cada saque
- **Flash visual** al anotar
- **Historial de partidas** guardado en localStorage (últimas 5)
- **Responsive** — se adapta al ancho de pantalla

## Controles

| Acción | J1 | J2 |
|--------|----|----|
| Mover raqueta | Ratón | ↑ ↓ |
| Pausar | P | P |
| Reiniciar (al terminar) | R | R |

## Tecnologías

- [p5.js](https://p5js.org/) v1.4.0
- p5.sound
- HTML5 / CSS3 / JavaScript

## Correr localmente

```bash
# Opción 1 — extensión Live Server en VS Code
# Clic derecho en index.html → "Open with Live Server"

# Opción 2 — Python
python -m http.server 8000
# Abrir http://localhost:8000
```

> Los sonidos requieren un servidor local por política CORS del navegador.

## Deploy en GitHub Pages

1. Sube el repositorio a GitHub
2. Ve a **Settings → Pages**
3. Selecciona la rama `main` y carpeta `/root`
4. El juego estará en `https://tu-usuario.github.io/juego_pong`
