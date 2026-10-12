const FILAS = 5;
const COLS = 5;

let mapaEventos = [];    // Almacena lo que hay en cada [fila][columna]
let mapaRevelado = [];   // Niebla de guerra
let sondaFila = 0;
let sondaCol = 0;
let exoplanetasEncontrados = 0;
let juegoTerminado = false;

// Coordenadas fijas del Agujero Negro y descripciones científicas
let agujeroNegroFila = 0;
let agujeroNegroCol = 0;

const descripcionesCientificas = {
    vacio: "Sector de vacío cósmico estable. Radiación de fondo normal.",
    nebulosa: "Nebulosa de alta densidad. Interferencias iónicas detectadas.",
    asteroides: "Cinturón de fragmentos rocosos. Precaución en la navegación.",
    exoplaneta: "¡Planeta rocoso detectado! Atmósfera rica en datos científicos.",
    agujero_negro: "⚠️ ¡ADVERTENCIA! Singularidad gravitacional detectada."
};

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

    mapaEventos = Array(FILAS).fill().map(() => Array(COLS).fill("vacio"));
    mapaRevelado = Array(FILAS).fill().map(() => Array(COLS).fill(false));

    mapaRevelado[0][0] = true;

    // Colocar el Agujero Negro en una posición aleatoria (lejos de [0][0])
    do {
        agujeroNegroFila = Math.floor(Math.random() * FILAS);
        agujeroNegroCol = Math.floor(Math.random() * COLS);
    } while (agujeroNegroFila === 0 && agujeroNegroCol === 0);

    mapaEventos[agujeroNegroFila][agujeroNegroCol] = "agujero_negro";

    // Colocar 3 Exoplanetas
    colocarEnMatriz("exoplaneta", 3);

    logTelemetria("Misión iniciada. Escanea el sector para calcular peligros.");
    actualizarPanelCientifico("vacio");
    renderizarMapa();
}

function colocarEnMatriz(tipo, cantidad) {
    let colocados = 0;
    while (colocados < cantidad) {
        let f = Math.floor(Math.random() * FILAS);
        let c = Math.floor(Math.random() * COLS);
        if (!(f === 0 && c === 0) && mapaEventos[f][c] === "vacio") {
            mapaEventos[f][c] = tipo;
            colocados++;
        }
    }
}

function renderizarMapa() {
    const contenedor = document.getElementById('star-map');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celda = document.createElement('div');
            const esJugador = (f === sondaFila && c === sondaCol);
            const estaRevelado = mapaRevelado[f][c];

            celda.id = `sector-${f}-${c}`;
            celda.className = 'sector';

            let contenidoHTML = `<span class="coords">[${f}][${c}]</span>`;

            if (!estaRevelado) {
                celda.classList.add('no-explorado');
            } else {
                let evento = mapaEventos[f][c];
                if (evento === "exoplaneta") {
                    contenidoHTML += `<span>🪐</span>`;
                } else if (evento === "agujero_negro" && juegoTerminado) {
                    contenidoHTML += `<span>🕳️</span>`;
                } else {
                    contenidoHTML += `<span style="color: #475569;">·</span>`;
                }
            }

            // Si la sonda está aquí, agregamos el icono encima sin borrar el fondo
            if (esJugador) {
                celda.classList.add('probe-here');
                contenidoHTML += `<span style="position: absolute; font-size: 16px; bottom: 2px; right: 2px;">🛰️</span>`;
            }

            celda.innerHTML = contenidoHTML;
            contenedor.appendChild(celda);
        }
    }

    document.getElementById('coords-val').innerText = `[${sondaFila}][${sondaCol}]`;
    document.getElementById('score-val').innerText = `${exoplanetasEncontrados} / 3 Encontrados`;
}

function moverSonda(df, dc) {
    if (juegoTerminado) return;

    let nuevaFila = sondaFila + df;
    let nuevaCol = sondaCol + dc;

    if (nuevaFila >= 0 && nuevaFila < FILAS && nuevaCol >= 0 && nuevaCol < COLS) {
        sondaFila = nuevaFila;
        sondaCol = nuevaCol;
        mapaRevelado[sondaFila][sondaCol] = true;

        let eventoActual = mapaEventos[sondaFila][sondaCol];
        logTelemetria(`Movimiento a [${sondaFila}][${sondaCol}]`);

        if (eventoActual === "agujero_negro") {
            juegoTerminado = true;
            revelarTodoElMapa();
            actualizarPanelCientifico("agujero_negro");
            mostrarModal("💥 ¡Destrucción Total!", "La sonda fue tragada por la singularidad del Agujero Negro.");
        } else if (eventoActual === "exoplaneta") {
            mapaEventos[sondaFila][sondaCol] = "vacio";
            exoplanetasEncontrados++;
            logTelemetria(`<b>¡Exoplaneta 🪐 rescatado! (${exoplanetasEncontrados}/3)</b>`);
            actualizarPanelCientifico("exoplaneta");

            if (exoplanetasEncontrados === 3) {
                juegoTerminado = true;
                revelarTodoElMapa();
                mostrarModal("🎉 ¡Misión Exitosa!", "¡Has recolectado todos los exoplanetas y analizado el cuadrante!");
            }
        } else {
            actualizarPanelCientifico("vacio");
        }

        renderizarMapa();
    } else {
        logTelemetria(`⚠️ Límite del sector alcanzado.`);
    }
}

function actualizarPanelCientifico(tipo) {
    const descBox = document.getElementById('science-desc');
    if (descBox && descripcionesCientificas[tipo]) {
        descBox.innerText = descripcionesCientificas[tipo];
    }
}

// Algoritmo de Búsqueda 2D (Calcula la distancia Manhattan al Agujero Negro)
async function ejecutarEscaneoRadar2D() {
    if (juegoTerminado) return;
    logTelemetria(`<b>Escaneando matriz [5x5]...</b>`);

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            const celdaDOM = document.getElementById(`sector-${f}-${c}`);
            if (celdaDOM) celdaDOM.classList.add('scanning');
            await new Promise(res => setTimeout(res, 40));
            if (celdaDOM) celdaDOM.classList.remove('scanning');
        }
    }

    // Cálculo matemático de distancia (Distancia Manhattan: |x1 - x2| + |y1 - y2|)
    let distanciaFila = Math.abs(sondaFila - agujeroNegroFila);
    let distanciaCol = Math.abs(sondaCol - agujeroNegroCol);
    let distanciaTotal = distanciaFila + distanciaCol;

    if (distanciaTotal === 0) {
        logTelemetria(`🚨 ¡PELIGRO MÁXIMO! Estás sobre la singularidad.`);
    } else if (distanciaTotal <= 1) {
        logTelemetria(`⚠️ ¡Alerta Roja! El Agujero Negro está extremadamente cerca.`);
    } else if (distanciaTotal <= 2) {
        logTelemetria(`⚠️ Radar: Radiación gravitacional moderada a ${distanciaTotal} sectores.`);
    } else {
        logTelemetria(`📡 Radar: Sector despejado. Agujero negro a ${distanciaTotal} sectores de distancia.`);
    }
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

window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': moverSonda(-1, 0); break;
        case 's': case 'arrowdown': moverSonda(1, 0); break;
        case 'a': case 'arrowleft': moverSonda(0, -1); break;
        case 'd': case 'arrowright': moverSonda(0, 1); break;
    }
});
