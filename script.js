const FILAS = 5;
const COLS = 5;

let mapaSectores = [];   // Biomas variados ([fila][columna])
let mapaEventos = [];    // Eventos ocultos
let mapaRevelado = [];   // Niebla de guerra
let sondaFila = 0;
let sondaCol = 0;
let exoplanetasEncontrados = 0;
let juegoTerminado = false;

let agujeroNegroFila = 0;
let agujeroNegroCol = 0;

const tiposBioma = ["vacio", "nebulosa", "asteroides", "estrellas"];

const descripcionesCientificas = {
    vacio: "Vacío cósmico: Región de baja densidad de materia, fría y silenciosa.",
    nebulosa: "Nebulosa estelar: Cúmulo masivo de gas ionizado y polvo cósmico interestelar en expansión.",
    asteroides: "Cinturón de asteroides: Fragmentos rocosos primordiales y remanentes planetesimales.",
    estrellas: "Cúmulo estelar: Región densa con protoestrellas jóvenes y alta emisión lumínica.",
    exoplaneta: "Exoplaneta confirmado: Mundo rocoso con potencial biológico y datos estelares únicos.",
    agujero_negro: "⚠️ ¡ADVERTENCIA! Singularidad gravitacional de masa estelar detectada."
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

    mapaSectores = Array(FILAS).fill().map(() => Array(COLS).fill("vacio"));
    mapaEventos = Array(FILAS).fill().map(() => Array(COLS).fill(""));
    mapaRevelado = Array(FILAS).fill().map(() => Array(COLS).fill(false));

    mapaRevelado[0][0] = true;

    // Generar biomas variados para que el mapa no se sienta vacío
    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            let randomIndex = Math.floor(Math.random() * tiposBioma.length);
            mapaSectores[f][c] = tiposBioma[randomIndex];
        }
    }

    // Ubicar Agujero Negro lejos de [0][0]
    do {
        agujeroNegroFila = Math.floor(Math.random() * FILAS);
        agujeroNegroCol = Math.floor(Math.random() * COLS);
    } while (agujeroNegroFila === 0 && agujeroNegroCol === 0);

    mapaEventos[agujeroNegroFila][agujeroNegroCol] = "agujero_negro";

    // Colocar 3 Exoplanetas
    colocarEnMatriz("exoplaneta", 3);

    logTelemetria("Misión iniciada. Explora el cuadrante estelar.");
    actualizarPanelCientifico(mapaSectores[0][0]);
    renderizarMapa();
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

            if (!estaRevelado) {
                celda.classList.add('no-explorado');
            } else {
                let evento = mapaEventos[f][c];
                
                // Iconos visuales según el bioma o el evento descubierto
                if (evento === "exoplaneta" || evento === "recolectado") {
                    contenidoHTML += `<span>🪐</span>`; // Muestra el exoplaneta descubierto o ya recolectado
                } else if (evento === "agujero_negro" && juegoTerminado) {
                    contenidoHTML += `<span>🕳️</span>`;
                } else {
                    // Mostrar un icono ambiental sutil según el bioma si no hay evento especial
                    if (bioma === "nebulosa") contenidoHTML += `<span style="opacity:0.6;">🌌</span>`;
                    else if (bioma === "asteroides") contenidoHTML += `<span style="opacity:0.6;">🪨</span>`;
                    else if (bioma === "estrellas") contenidoHTML += `<span style="opacity:0.6;">✨</span>`;
                    else contenidoHTML += `<span style="color: #475569;">·</span>`;
                }
            }

            // Si la sonda está en esta casilla, se dibuja su icono sin tapar el contenido de fondo
            if (esJugador) {
                celda.classList.add('probe-here');
                contenidoHTML += `<span style="position: absolute; font-size: 15px; bottom: 2px; right: 2px;">🛰️</span>`;
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
        let biomaActual = mapaSectores[sondaFila][sondaCol];
        logTelemetria(`Movimiento a [${sondaFila}][${sondaCol}]`);

        if (eventoActual === "agujero_negro") {
            juegoTerminado = true;
            revelarTodoElMapa();
            actualizarPanelCientifico("agujero_negro");
            mostrarModal("💥 ¡Destrucción Total!", "La sonda fue tragada por la singularidad del Agujero Negro.");
        } else if (eventoActual === "exoplaneta") {
            mapaEventos[sondaFila][sondaCol] = "recolectado"; // Marca como encontrado pero mantiene el icono en el mapa
            exoplanetasEncontrados++;
            logTelemetria(`<b>¡Exoplaneta 🪐 rescatado! (${exoplanetasEncontrados}/3)</b>`);
            actualizarPanelCientifico("exoplaneta");

            if (exoplanetasEncontrados === 3) {
                juegoTerminado = true;
                revelarTodoElMapa();
                mostrarModal("🎉 ¡Misión Exitosa!", "¡Has recolectado todos los exoplanetas y analizado el cuadrante!");
            }
        } else {
            actualizarPanelCientifico(biomaActual);
        }

        renderizarMapa();
    } else {
        logTelemetria(`⚠️ Límite del sector alcanzado.`);
    }
}

function actualizarPanelCientifico(clave) {
    const descBox = document.getElementById('science-desc');
    if (descBox && descripcionesCientificas[clave]) {
        descBox.innerText = descripcionesCientificas[clave];
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
        logTelemetria(`📡 Radar: Sector despejado. Agujero negro a ${distanciaTotal} sectores.`);
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
