// 1. Definición de la matriz de 5x5 para el mapa estelar
const FILAS = 5;
const COLS = 5;

// Matriz principal de biomas/tipos de sectores
const mapaSectores = [
    ["vacio", "nebulosa", "vacio", "asteroides", "vacio"],
    ["vacio", "vacio", "asteroides", "nebulosa", "pulser"],
    ["nebulosa", "pulser", "vacio", "vacio", "asteroides"],
    ["asteroides", "vacio", "nebulosa", "nebulosa", "vacio"],
    ["vacio", "vacio", "vacio", "pulser", "vacio"]
];

// Matriz secundaria de contenidos ocultos (Señales / Exoplanetas / Anomalías)
const mapaAnomalias = [
    ["", "", "", "🪐 Exoplaneta", ""],
    ["", "", "", "", ""],
    ["", "✨ Pulsar Activo", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", "🚀 Nave Perdida"]
];

// Matriz de visibilidad (Niebla estelar)
let mapaRevelado = Array(FILAS).fill().map(() => Array(COLS).fill(false));

// Posición inicial de la Sonda en la matriz [fila][columna]
let sondaFila = 0;
let sondaCol = 0;

const iconosSector = {
    vacio: '🌌',
    nebulosa: '🟣',
    pulser: '🟢',
    asteroides: '🪨'
};

function logTelemetria(mensaje) {
    const box = document.getElementById('telemetry-log');
    box.innerHTML = `> ${mensaje}<br>` + box.innerHTML;
}

// Renderizar la matriz en el HTML de forma sistemática
function renderizarMapa() {
    const contenedor = document.getElementById('star-map');
    contenedor.innerHTML = '';

    for (let fila = 0; fila < FILAS; fila++) {
        for (let col = 0; col < COLS; col++) {
            const celda = document.createElement('div');
            const esPosicionSonda = (fila === sondaFila && col === sondaCol);
            const estaRevelado = mapaRevelado[fila][col];
            const tipoSector = mapaSectores[fila][col]; // Acceso matriz[fila][columna]
            const objetoOculto = mapaAnomalias[fila][col];

            celda.id = `sector-${fila}-${col}`;
            celda.className = `sector ${tipoSchClase(tipoSector)}`;

            if (!estaRevelado && !esPosicionSonda) {
                celda.classList.add('no-explorado');
            }

            if (esPosicionSonda) {
                celda.classList.add('probe-here');
            }

            // Construcción interna de la celda con sus coordenadas de indexación
            let contenidoHTML = `<span class="coords">[${fila}][${col}]</span>`;

            if (esPosicionSonda) {
                contenidoHTML += `<span class="probe-icon">🛰️</span>`;
            } else if (estaRevelado) {
                contenidoHTML += `<span>${objetoOculto !== "" ? '⭐' : iconosSector[tipoSector]}</span>`;
            }

            celda.innerHTML = contenidoHTML;
            contenedor.appendChild(celda);
        }
    }

    // Actualizar datos de panel
    document.getElementById('coords-val').innerText = `[fila: ${sondaFila}][col: ${sondaCol}]`;
    document.getElementById('sector-val').innerText = mapaSectores[sondaFila][sondaCol].toUpperCase();
}

function tipoSchClase(tipo) {
    return tipo;
}

// Movimiento de la sonda respetando los límites de la matriz 5x5
function moverSonda(df, dc) {
    let nuevaFila = sondaFila + df;
    let nuevaCol = sondaCol + dc;

    // Verificación de límites de la matriz bidimensional
    if (nuevaFila >= 0 && nuevaFila < FILAS && nuevaCol >= 0 && nuevaCol < COLS) {
        sondaFila = nuevaFila;
        sondaCol = nuevaCol;
        
        // Revelar sector actual
        mapaRevelado[sondaFila][sondaCol] = true;

        logTelemetria(`Salto a sector [${sondaFila}][${sondaCol}]`);
        renderizarMapa();

        // Detectar si hay algo oculto en esta coordenada
        if (mapaAnomalias[sondaFila][sondaCol] !== "") {
            logTelemetria(`¡Anomalía detectada: ${mapaAnomalias[sondaFila][sondaCol]}!`);
        }
    } else {
        logTelemetria(`⚠️ Alerta: Límite del sector estelar alcanzado.`);
    }
}

// 2. Algoritmo de Búsqueda en 2D (Recorrido Sistemático con ciclos anidados)
async function ejecutarBusqueda2D() {
    logTelemetria(`<b>Iniciando escaneo de largo alcance (Búsqueda 2D)...</b>`);
    let hallazgo = false;

    // Recorrido sistemático fila por fila, columna por columna
    for (let fila = 0; fila < FILAS; fila++) {
        for (let col = 0; col < COLS; col++) {
            const celdaDOM = document.getElementById(`sector-${fila}-${col}`);
            celdaDOM.classList.add('scanning');

            // Pausa de animación para simular el procesamiento del escáner
            await new Promise(resolve => setTimeout(resolve, 80));

            // Comprobación de condición de búsqueda en la matriz secundaria
            if (mapaAnomalias[fila][col] !== "") {
                mapaRevelado[fila][col] = true;
                renderizarMapa();
                document.getElementById(`sector-${fila}-${col}`).classList.add('signal-found');
                logTelemetria(`<b>¡Señal localizada en [${fila}][${col}] (${mapaAnomalias[fila][col]})!</b>`);
                hallazgo = true;
            }

            celdaDOM.classList.remove('scanning');
        }
    }

    if (!hallazgo) {
        logTelemetria(`Escaneo completado. Sin anomalías en este cuadrante.`);
    }
}

function reiniciarMision() {
    sondaFila = 0;
    sondaCol = 0;
    mapaRevelado = Array(FILAS).fill().map(() => Array(COLS).fill(false));
    mapaRevelado[0][0] = true;
    logTelemetria("Misión reiniciada. Sonda en base [0][0].");
    renderizarMapa();
}

// Control por teclado (WASD y Flechas direccionales)
window.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': moverSonda(-1, 0); break;
        case 's': case 'arrowdown': moverSonda(1, 0); break;
        case 'a': case 'arrowleft': moverSonda(0, -1); break;
        case 'd': case 'arrowright': moverSonda(0, 1); break;
    }
});

// Inicializar misión
mapaRevelado[0][0] = true;
renderizarMapa();
