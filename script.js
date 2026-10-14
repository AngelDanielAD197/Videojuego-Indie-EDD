// =========================================================================
// VARIABLES GLOBALES Y CONFIGURACIÓN DEL JUEGO
// =========================================================================
const FILAS = 5;
const COLS = 5;

let mapaSectores = [];   
let mapaEventos = [];    
let mapaRevelado = [];   
let sondaFila = 0;
let sondaCol = 0;
let exoplanetasEncontrados = 0;
let juegoTerminado = false;

let agujeroNegroFila = 0;
let agujeroNegroCol = 0;

const tiposBioma = ["vacio", "nebulosa", "asteroides", "estrellas"];

const descripcionesCientificas = {
    vacio: { text: "🌌 Vacío cósmico: Región de baja densidad de materia, fría y silenciosa.", type: "normal" },
    nebulosa: { text: "🟣 Nebulosa estelar: Cúmulo masivo de gas ionizado y polvo cósmico en expansión.", type: "normal" },
    asteroides: { text: "🪨 Cinturón de asteroides: Fragmentos rocosos primordiales y remanentes planetesimales.", type: "normal" },
    estrellas: { text: "✨ Cúmulo estelar: Región densa con protoestrellas jóvenes y alta emisión lumínica.", type: "normal" },
    exoplaneta: { text: "🪐 ¡EXOPLANETA DESCUBIERTO! Mundo rocoso con potencial de albergar vida :).", type: "planet" },
    agujero_negro: { text: "⚠️ ¡PELIGRO CRÍTICO! Señales de singularidad altas", type: "danger" }
};


// =========================================================================
// LORE / HISTORIA INICIAL
// =========================================================================
function cargarLoreInicial() {
    const anioFuturo = 2326;
    const mision = "I.S.A.A.C VI";
    const constelacion = "Sector Orion-D";
    const agujero = "HALO-X";

    const textoLore = `Estamos en el año <b>${anioFuturo}</b>. Te encuentras al mando de la misión espacial <b>${mision}</b>. ` +
                      `Tu sonda ha sido desplegada en las profundidades de la constelación <b>${constelacion}</b> con un objetivo crítico: ` +
                      `rescatar <b>3 exoplanetas</b> habitables en este sector del espacio.<br><br>` +
                      `Sin embargo, los sensores detectan la presencia de la anomalía gravitacional <b>${agujero}</b>, un agujero negro que lo absorbe todo a su paso. ` +
                      `Su ubicación exacta es desconocida, pero cuentas con un <b>radar de escaneo</b> para calcular la proximidad de ese agujero antes de que sea demasiado tarde.`;

    const loreTextEl = document.getElementById('lore-text');
    if (loreTextEl) loreTextEl.innerHTML = textoLore;
}

function cerrarLoreYEmpezar() {
    const loreModal = document.getElementById('lore-modal');
    if (loreModal) loreModal.classList.add('hidden');
}

// Asegúrate de llamarla correctamente en el evento de carga:
document.addEventListener("DOMContentLoaded", () => {
    initSpaceBackground();
    cargarLoreInicial();
    iniciarJuego();
});


// =========================================================================
// FONDO DE ESPACIO PROFUNDO CON THREE.JS (PARTÍCULAS ESTELARES)
// =========================================================================
let scene, camera, renderer, starsParticles;

function initSpaceBackground() {
    const canvas = document.getElementById('space-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const starsCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starsCount * 3);

    for (let i = 0; i < starsCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 50;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.12,
        transparent: true,
        opacity: 0.8
    });

    starsParticles = new THREE.Points(geometry, material);
    scene.add(starsParticles);

    window.addEventListener('resize', onWindowResize);
    animateSpace();
}

function animateSpace() {
    requestAnimationFrame(animateSpace);
    if (starsParticles) {
        starsParticles.rotation.x += 0.0003;
        starsParticles.rotation.y += 0.0005;
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


// =========================================================================
// LÓGICA DEL JUEGO (BUSCAMINAS ESPACIAL)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initSpaceBackground();
    generarLoreAleatorio();
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

    for (let f = 0; f < FILAS; f++) {
        for (let c = 0; c < COLS; c++) {
            let randomIndex = Math.floor(Math.random() * tiposBioma.length);
            mapaSectores[f][c] = tiposBioma[randomIndex];
        }
    }

    do {
        agujeroNegroFila = Math.floor(Math.random() * FILAS);
        agujeroNegroCol = Math.floor(Math.random() * COLS);
    } while (agujeroNegroFila === 0 && agujeroNegroCol === 0);

    mapaEventos[agujeroNegroFila][agujeroNegroCol] = "agujero_negro";

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
                
                if (evento === "exoplaneta" || evento === "recolectado") {
                    contenidoHTML += `<span>🪐</span>`;
                } else if (evento === "agujero_negro" && juegoTerminado) {
                    contenidoHTML += `<span>🕳️</span>`;
                } else {
                    if (bioma === "nebulosa") contenidoHTML += `<span style="opacity:0.6;">🟣</span>`;
                    else if (bioma === "asteroides") contenidoHTML += `<span style="opacity:0.6;">🪨</span>`;
                    else if (bioma === "estrellas") contenidoHTML += `<span style="opacity:0.6;">✨</span>`;
                    else contenidoHTML += `<span style="color: #475569;">·</span>`;
                }
            }

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
            mapaEventos[sondaFila][sondaCol] = "recolectado";
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
    const containerBox = document.getElementById('science-container');
    const descBox = document.getElementById('science-desc');
    
    if (!descBox || !containerBox) return;

    let info = descripcionesCientificas[clave];
    if (info) {
        descBox.innerText = info.text;
        
        containerBox.classList.remove('science-planet', 'science-danger');

        if (info.type === "planet") {
            containerBox.classList.add('science-planet');
        } else if (info.type === "danger") {
            containerBox.classList.add('science-danger');
        }
    }
}

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
        logTelemetria(`🚨 ¡PELIGRO MÁXIMO! Esta respirandote en la nuca Coyeye.`);
    } else if (distanciaTotal <= 1) {
        logTelemetria(`⚠️ ¡Alerta Roja! El Agujero Negro está extremadamente cerca Coyeye.`);
    } else if (distanciaTotal <= 2) {
        logTelemetria(`⚠️ Radar: El agujero esta a ${distanciaTotal} sectores.`);
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