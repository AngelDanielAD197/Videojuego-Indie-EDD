// Dimensiones de la Matriz del Sector Estelar
const FILAS = 5;
const COLS = 5;

// Matrices del juego
let mapaSectores = [];   // Biomas estelares ([fila][columna])
let mapaEventos = [];    // Eventos ocultos (exoplanetas, agujero negro real, impostores)
let mapaRevelado = [];   // Niebla de guerra
let sondaFila = 0;
let sondaCol = 0;
let exoplanetasEncontrados = 0;
let juegoTerminado = false;

const tiposBioma = ["vacio", "nebulosa", "asteroides"];

document.addEventListener("DOMContentLoaded", () => {
    iniciarJuego();
});

function iniciarJuego() {
    sondaFila = 0;
    sondaCol = 0;
    exoplanetasEncontrados = 0;
    juegoTerminado = false;

    const modal = document.getElementById('game-modal');
    if (modal) modal.classList.add('hidden');

    // 1. Inicializar matrices 5x5
    mapaSectores = Array(FILAS).fill().map(() => Array(COLS).fill("vacio"));
    mapaEventos = Array(FILAS).fill().map(() => Array(COLS).fill(""));
    mapaRevelado = Array(FILAS).fill().map(() => Array(COLS).fill(false));

    mapaRevelado[0][0] = true; // Inicio seguro

    // 2. Rellenar biomas estelares al azar
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            let randomIndex = Math.floor(Math.random() * tiposBioma.length);
            mapaSectores[f][c] = tiposBioma[randomIndex];
        }
    }

    // 3. Colocar 3 Exoplanetas
    colocarEnMatriz("exoplaneta", 3);

    // 4. Tu idea genial: 3 candidatos a agujero negro (1 real, 2 estrellas impostoras)
    colocarEnMatriz("agujero_negro_real", 1);
    colocarEnMatriz("estrella_impostora", 2);

    logTelemetria("Sonda desplegada en sector [0][0]. ¡Busca los 3 Exoplanetas!");
    renderizarMapa();
}

// Función auxiliar para posicionar elementos evitando [0][0]
function colocarElemento(tipo, f, c) {
    mapaEventos[f][c] = tipo;
}

function colocarEnMatriz(tipo, cantidad) {
    let colocados = 0;
    while (colocados < cantidad) {
        let f = Math.floor(Math.random() * FILAS);
        let c = Math.floor(Math.random() * COLS);
        if (!(f === 0 && c === 0) && mapaEventos[f][c] === "") {
            mapaEventos[f][c] = tipo;
            colocados++;
        }
    }
}

// Renderizado de la Matriz 5x5
function renderizarMapa() {
    const contenedor = document.getElementById('star-map');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celda = document.createElement('div');
            const esJugador = (f === sondaFila && c === sondaCol);
            const estaRevelado = mapaRevelado[f][c];
            const bioma = mapaSectores[f][c];

            celda.id = `sector-${f}-${c}`;
            celda.className = `sector ${bioma}`;

            let contenidoHTML = `<span class="coords">[${f}][${c}]</span>`;

            if (esJugador) {
                celda.classList.add('probe-here');
                contenidoHTML += `<span class="probe-icon">🛰️</span>`;
            } else if (!estaRevelado) {
                celda.classList.add('no-explorado');
            } else {
                let evento = mapaEventos[f][c];
                if (evento === "exoplaneta") {
                    contenidoHTML += `<span>🪐</span>`;
                } else if (evento === "agujero_negro_real" && juegoTerminado) {
                    contenidoHTML += `<span>🕳️</span>`;
                } else if (evento === "estrella_impostora" && juegoTerminado) {
                    contenidoHTML += `<span>✨</span>`;
                } else {
                    contenidoHTML += `<span style="color: #475569;">·</span>`;
                }
            }

            celda.innerHTML = contenidoHTML;
            contenedor.appendChild(celda);
        }
    }

    const coordsVal = document.getElementById('coords-val');
    const scoreVal = document.getElementById('score-val');
    if (coordsVal) coordsVal.innerText = `[${sondaFila}][${sondaCol}]`;
    if (scoreVal) scoreVal.innerText = `${exoplanetasEncontrados} / 3 Encontrados`;
}

// Movimiento en la matriz con validación de límites
function moverSonda(df, dc) {
    if (juegoTerminado) return;

    let nuevaFila = sondaFila + df;
    let nuevaCol = sondaCol + dc;

    if (nuevaFila >= 0 && nuevaFila < FILAS && nuevaCol >= 0 && nuevaCol < COLS) {
        sondaFila = nuevaFila;
        sondaCol = nuevaCol;
        mapaRevelado[sondaFila][sondaCol] = true;

        let eventoActual = mapaEventos[sondaFila][sondaCol];
        logTelemetria(`Salto a sector [${sondaFila}][${sondaCol}]`);

        if (eventoActual === "agujero_negro_real") {
            juegoTerminado = true;
            revelarTodoElMapa();
            mostrarModal("💥 ¡Destrucción Total!", "¡Caíste en el Agujero Negro verdadero! La sonda ha colapsado.");
        } else if (eventoActual === "estrella_impostora") {
            logTelemetria(`⚠️ Era una Estrella Impostora. Sin peligro crítico, pero falsa señal.`);
        } else if (eventoActual === "exoplaneta") {
            mapaEventos[sondaFila][sondaCol] = "recolectado";
            exoplanetasEncontrados++;
            logTelemetria(`<b>¡Exoplaneta descubierto en [${sondaFila}][${sondaCol}]! (${exoplanetasEncontrados}/3)</b>`);

            if (exoplanetasEncontrados === 3) {
                juegoTerminado = true;
                revelarTodoElMapa();
                mostrarModal("🎉 ¡Misión Exitosa!", "¡Has recolectado los 3 Exoplanetas y completado el mapeo del sector!");
            }
        }

        renderizarMapa();
    } else {
        logTelemetria(`⚠️ Límite del sector estelar alcanzado.`);
    }
}

// Algoritmo de Búsqueda 2D Global (Radar con ciclos for anidados)
async function ejecutarEscaneoRadar2D() {
    if (juegoTerminado) return;
    logTelemetria(`<b>Iniciando escaneo de radar 2D (Ciclos anidados)...</b>`);

    let candidatosDetectados = 0;

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celdaDOM = document.getElementById(`sector-${f}-${c}`);
            if (celdaDOM) celdaDOM.classList.add('scanning');

            await new Promise(res => setTimeout(res, 50));

            // Si el radar pasa por uno de los candidatos (agujero negro o impostor), da una pista
            let evento = mapaEventos[f][c];
            if (evento === "agujero_negro_real" || evento === "estrella_impostora") {
                candidatosDetectados++;
            }

            if (celdaDOM) celdaDOM.classList.remove('scanning');
        }
    }

    logTelemetria(`📡 Radar detectó ${candidatosDetectados} anomalías sospechosas en el cuadrante.`);
}

function revelarTodoElMapa() {
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            mapaRevelado[f][c] = true;
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
