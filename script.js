// Dimensiones de la Matriz del Buscaminas Espacial
const FILAS = 5;
const COLS = 5;

// Estado del juego
let matrizTablero = []; 
let matrizRevelada = []; 
let sondaFila = 0;
let sondaCol = 0;
let exoplanetasRestantes = 3;
let juegoTerminado = false;

// Inicializar al cargar el DOM de forma segura
document.addEventListener("DOMContentLoaded", () => {
    iniciarJuego();
});

function iniciarJuego() {
    sondaFila = 0;
    sondaCol = 0;
    exoplanetasRestantes = 3;
    juegoTerminado = false;
    
    const modal = document.getElementById('game-modal');
    if (modal) modal.classList.add('hidden');

    // 1. Crear matriz vacía 5x5
    matrizTablero = Array(FILAS).fill().map(() => Array(COLS).fill("vacio"));
    matrizRevelada = Array(FILAS).fill().map(() => Array(COLS).fill(false));

    // El punto de partida [0][0] siempre está seguro y explorado
    matrizRevelada[0][0] = true;

    // 2. Colocar elementos clave asegurando que no caigan en [0][0]
    colocarElementoAleatorio("agujero_negro", 1);
    colocarElementoAleatorio("impostor", 2);
    colocarElementoAleatorio("exoplaneta", 3);

    logTelemetria("Nueva misión lista. Coordenadas [0][0] seguras.");
    renderizarMapa();
}

function colocarElementoAleatorio(tipo, cantidad) {
    let colocados = 0;
    while (colocados < cantidad) {
        let f = Math.floor(Math.random() * FILAS);
        let c = Math.floor(Math.random() * COLS);

        if (!(f === 0 && c === 0) && matrizTablero[f][c] === "vacio") {
            matrizTablero[f][c] = tipo;
            colocados++;
        }
    }
}

function contarPeligrosVecinos(f, c) {
    let contador = 0;
    for (let df = -1; df <= 1; df++) {
        for (let dc = -1; dc <= 1; dc++) {
            let vecF = f + df;
            let vecC = c + dc;
            if (vecF >= 0 && vecF < FILAS && vecC >= 0 && vecC < COLS) {
                if (matrizTablero[vecF][vecC] === "agujero_negro" || matrizTablero[vecF][vecC] === "impostor") {
                    contador++;
                }
            }
        }
    }
    return contador;
}

function renderizarMapa() {
    const contenedor = document.getElementById('star-map');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celda = document.createElement('div');
            const esJugador = (f === sondaFila && c === sondaCol);
            const estaRevelado = matrizRevelada[f][c];

            celda.id = `sector-${f}-${c}`;
            celda.className = 'sector';

            let contenidoHTML = `<span class="coords">[${f}][${c}]</span>`;

            if (esJugador) {
                celda.classList.add('probe-here');
                contenidoHTML += `<span class="probe-icon">🛰️</span>`;
            } else if (!estaRevelado) {
                celda.classList.add('no-explorado');
            } else {
                celda.classList.add('explorado');
                let contenido = matrizTablero[f][c];

                if (contenido === "exoplaneta") {
                    contenidoHTML += `<span>🪐</span>`;
                } else if (contenido === "agujero_negro" && juegoTerminado) {
                    contenidoHTML += `<span>🕳️</span>`;
                } else {
                    let peligros = contarPeligrosVecinos(f, c);
                    if (peligros > 0) {
                        contenidoHTML += `<span class="danger-clue">${peligros}</span>`;
                    } else {
                        contenidoHTML += `<span style="color: #475569;">·</span>`;
                    }
                }
            }

            celda.innerHTML = contenidoHTML;
            contenedor.appendChild(celda);
        }
    }

    const coordsVal = document.getElementById('coords-val');
    const scoreVal = document.getElementById('score-val');
    if (coordsVal) coordsVal.innerText = `[${sondaFila}][${sondaCol}]`;
    if (scoreVal) scoreVal.innerText = `${3 - exoplanetasRestantes} / 3 Encontrados`;
}

function moverSonda(df, dc) {
    if (juegoTerminado) return;

    let nuevaFila = sondaFila + df;
    let nuevaCol = sondaCol + dc;

    if (nuevaFila >= 0 && nuevaFila < FILAS && nuevaCol >= 0 && nuevaCol < COLS) {
        sondaFila = nuevaFila;
        sondaCol = nuevaCol;
        matrizRevelada[sondaFila][sondaCol] = true;

        let contenidoCelda = matrizTablero[sondaFila][sondaCol];
        logTelemetria(`Salto a coordenada [${sondaFila}][${sondaCol}]`);

        if (contenidoCelda === "agujero_negro") {
            juegoTerminado = true;
            revelarTodoElMapa();
            mostrarModal("💥 ¡Destrucción Total!", "Tu sonda cayó en el Agujero Negro del sector. Fin de la misión.");
        } else if (contenidoCelda === "exoplaneta") {
            matrizTablero[sondaFila][sondaCol] = "vacio"; 
            exoplanetasRestantes--;
            logTelemetria(`<b>¡Exoplaneta recolectado en [${sondaFila}][${sondaCol}]!</b>`);

            if (exoplanetasRestantes === 0) {
                juegoTerminado = true;
                revelarTodoElMapa();
                mostrarModal("🎉 ¡Misión Exitosa!", "Has recolectado los 3 Exoplanetas y salvado la expedición.");
            }
        } else if (contenidoCelda === "impostor") {
            logTelemetria(`⚠️ Alerta: Señal falsa detectada en este sector.`);
        }

        renderizarMapa();
    } else {
        logTelemetria(`⚠️ Límite del sector estelar alcanzado.`);
    }
}

async function ejecutarEscaneoRadar2D() {
    if (juegoTerminado) return;
    logTelemetria(`<b>Iniciando escaneo global de la matriz [5x5]...</b>`);

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celdaDOM = document.getElementById(`sector-${f}-${c}`);
            if (celdaDOM) celdaDOM.classList.add('scanning');

            await new Promise(res => setTimeout(res, 50));

            if (celdaDOM) celdaDOM.classList.remove('scanning');
        }
    }

    logTelemetria(`Escaneo sistemático finalizado. Analiza los números de peligro cercanos.`);
}

function revelarTodoElMapa() {
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            matrizRevelada[f][c] = true;
        }
    }
}

function mostrarModal(titulo, desc) {
    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const modalEl = document.getElementById('game-modal');
    if (titleEl) titleEl.innerText = titulo;
    if (descEl) descEl.innerText = desc;
    if (modalEl) modalEl.classList.remove('hidden');
}

function reiniciarJuego() {
    iniciarJuego();
}

function logTelemetria(mensaje) {
    const box = document.getElementById('telemetry-log');
    if (box) {
        box.innerHTML = `> ${mensaje}<br>` + box.innerHTML;
    }
}

// Control por teclado (WASD / Flechas)
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': moverSonda(-1, 0); break;
        case 's': case 'arrowdown': moverSonda(1, 0); break;
        case 'a': case 'arrowleft': moverSonda(0, -1); break;
        case 'd': case 'arrowright': moverSonda(0, 1); break;
    }
});
