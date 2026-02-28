/**
 * TORNEO.JS — El Continental
 * ══════════════════════════════════════════════════════
 * Lee el bracket del torneo desde una hoja de Google Sheets (CSV).
 *
 * FORMATO DE LA HOJA (sin encabezado, o con encabezado en fila 1):
 *   Columna A → Ronda    (ej: Octavos, Cuartos, Semifinales, Final)
 *   Columna B → Equipo 1 (nombre del clan)
 *   Columna C → Puntos 1 (puntuación del equipo 1)
 *   Columna D → Equipo 2 (nombre del clan)
 *   Columna E → Puntos 2 (puntuación del equipo 2)
 *
 * EJEMPLO de filas en la hoja:
 *   Octavos,Clan Alpha,3,Clan Beta,1
 *   Octavos,Clan Gamma,2,Clan Delta,3
 *   Cuartos,Clan Alpha,3,Clan Delta,2
 *   Semifinales,Clan Alpha,3,Clan Iota,1
 *   Final,Clan Alpha,3,Clan Nu,2
 *
 * - Deja Puntos en blanco = partido pendiente (se muestra "–")
 * - El ganador se detecta automáticamente por el puntaje mayor
 * - El campeón del torneo = ganador de la ronda "Final"
 * ══════════════════════════════════════════════════════
 */

// ─── ORDEN en que se muestran las rondas (de izquierda a derecha) ───
const ROUND_ORDER = [
    'Fase de Grupos',
    'Grupos',
    'Play-In',
    'Octavos',
    'Cuartos',
    'Semifinales',
    'Tercer puesto',
    'Final'
];

document.addEventListener('DOMContentLoaded', function () {
    initHamburger();
    loadTorneo();
});

async function loadTorneo() {
    const container = document.getElementById('bracketContainer');
    if (!container) return;

    container.innerHTML = '<div class="loading-torneo">⏳ Cargando torneo...</div>';

    // ── URL del Google Sheet del torneo ──────────────────────────────
    // 1. Ve a tu hoja → Archivo → Publicar en la web → CSV → Copiar enlace
    // 2. Pega la URL en CONFIG.TORNEO_URL (config-global.js)
    // ────────────────────────────────────────────────────────────────
    const url = (typeof CONFIG !== 'undefined' && CONFIG.TORNEO_URL) ? CONFIG.TORNEO_URL : null;

    if (!url || url === 'PEGA_AQUI_TU_URL_CSV') {
        container.innerHTML = `
            <div class="error-torneo">
                ⚙️ Configura la URL de tu hoja en <code>config-global.js</code>
                → <code>TORNEO_URL</code>
            </div>`;
        return;
    }

    try {
        const data = await fetchSheetData(url);
        if (!data || data.length === 0) {
            container.innerHTML = '<div class="error-torneo">No hay datos en la hoja de torneo aún.</div>';
            return;
        }
        renderBracket(data, container);
    } catch (err) {
        console.error('[Torneo]', err);
        container.innerHTML = '<div class="error-torneo">❌ Error al cargar el torneo. Verifica la URL de la hoja.</div>';
    }
}

// ── Detecta si la primera fila es encabezado ──────────────────────
function isHeader(row) {
    const val = (row[0] || '').trim().toLowerCase();
    return val === 'ronda' || val === 'round' || val === 'fase';
}

// ── Construye y renderiza el bracket ──────────────────────────────
function renderBracket(rows, container) {
    // Saltar fila de encabezado si existe
    const dataRows = isHeader(rows[0]) ? rows.slice(1) : rows;

    // Agrupar partidos por ronda
    const rounds = {}; // { nombreRonda: [ {equipo1, puntos1, equipo2, puntos2}, ... ] }

    dataRows.forEach(row => {
        const ronda = (row[0] || '').trim();
        if (!ronda) return;
        if (!rounds[ronda]) rounds[ronda] = [];
        rounds[ronda].push({
            equipo1: (row[1] || '').trim(),
            puntos1: row[2] !== undefined ? String(row[2]).trim() : '',
            equipo2: (row[3] || '').trim(),
            puntos2: row[4] !== undefined ? String(row[4]).trim() : ''
        });
    });

    const roundNames = Object.keys(rounds);
    if (roundNames.length === 0) {
        container.innerHTML = '<div class="error-torneo">No se encontraron partidos. Revisa el formato de la hoja.</div>';
        return;
    }

    // Ordenar rondas según ROUND_ORDER; las desconocidas van al final en el orden en que aparecen
    const sortedNames = roundNames.sort((a, b) => {
        const ia = ROUND_ORDER.findIndex(r => r.toLowerCase() === a.toLowerCase());
        const ib = ROUND_ORDER.findIndex(r => r.toLowerCase() === b.toLowerCase());
        const oa = ia === -1 ? 999 : ia;
        const ob = ib === -1 ? 999 : ib;
        return oa - ob;
    });

    let html = '<div class="bracket">';

    sortedNames.forEach(ronda => {
        const matches   = rounds[ronda];
        const isFinal   = ronda.toLowerCase() === 'final';
        let champion    = null;

        html += `<div class="round${isFinal ? ' final' : ''}">`;
        html += `<div class="round-title">${ronda}</div>`;
        html += '<div class="round-matches">';

        matches.forEach(match => {
            const p1       = parseFloat(match.puntos1);
            const p2       = parseFloat(match.puntos2);
            const played   = match.puntos1 !== '' && match.puntos2 !== ''
                             && !isNaN(p1) && !isNaN(p2);
            const team1win = played && p1 > p2;
            const team2win = played && p2 > p1;

            if (isFinal && played) {
                champion = team1win ? match.equipo1 : (team2win ? match.equipo2 : null);
            }

            const score1 = match.puntos1 !== '' ? match.puntos1 : '–';
            const score2 = match.puntos2 !== '' ? match.puntos2 : '–';

            html += `
                    <div class="match">
                        <div class="team${team1win ? ' winner' : ''}">
                            <span class="team-name">${match.equipo1 || '?'}</span>
                            <span class="team-score">${score1}</span>
                        </div>
                        <div class="team${team2win ? ' winner' : ''}">
                            <span class="team-name">${match.equipo2 || '?'}</span>
                            <span class="team-score">${score2}</span>
                        </div>
                    </div>`;
        });

        html += '</div>'; // .round-matches

        if (isFinal && champion) {
            html += `
                <div class="champion-banner">
                    <h3>🏆 CAMPEÓN</h3>
                    <div class="champion-name">${champion.toUpperCase()}</div>
                </div>`;
        }

        html += '</div>'; // .round
    });

    html += '</div>'; // .bracket

    container.innerHTML = html;
}
