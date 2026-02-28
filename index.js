/**
 * INDEX.JS - Página Principal
 * PUNTOS = solo salas. Trofeos son decorativos, no suman.
 */

document.addEventListener('DOMContentLoaded', function () { initIndex(); initHamburger(); renderStreamers(); });

async function initIndex() {
    try {
        const data = await fetchSheetData();
        const allClans = filterActiveClans(data);

        if (allClans.length === 0) {
            document.getElementById('clanesDestacados').innerHTML =
                '<p style="text-align:center;color:rgba(255,255,255,0.5);padding:3rem">Aún no hay clanes activos registrados.</p>';
            return;
        }

        const processed = processAndSort(allClans);
        // Ordenar por total de medallas (oro+plata+bronce), desempate por puntos de salas
        const byMedallero = [...processed].sort((a, b) =>
            (b.oro + b.plata + b.bronce) - (a.oro + a.plata + a.bronce)
            || b.total - a.total
        );
        document.getElementById('statClanes').textContent    = processed.length + '+';
        document.getElementById('statJugadores').textContent = (processed.length * 4) + '+';
        document.getElementById('contadorClanes').textContent =
            `${processed.length} clanes compitiendo — estos lideran en el medallero`;
        renderDestacados(byMedallero.slice(0, 6));

    } catch (err) {
        console.error('Error en index:', err);
        document.getElementById('clanesDestacados').innerHTML =
            '<p style="text-align:center;color:#ff4d4d;padding:3rem">❌ No se pudieron cargar los datos.</p>';
    }
}

function processAndSort(clans) {
    return clans.map(row => {
        const oro    = parseInt(row[CONFIG.COLUMNS.ORO])    || 0;
        const plata  = parseInt(row[CONFIG.COLUMNS.PLATA])  || 0;
        const bronce = parseInt(row[CONFIG.COLUMNS.BRONCE]) || 0;
        // PUNTOS = solo salas
        const total = calcularPuntos(row);
        return {
            nombre: row[CONFIG.COLUMNS.NOMBRE_DE_CLAN],
            tag:    row[CONFIG.COLUMNS.TAG_DEL_CLAN],
            logo:   getLogoUrl(row[CONFIG.COLUMNS.ID], row[CONFIG.COLUMNS.LOGO]),
            id:     row[CONFIG.COLUMNS.ID],
            oro, plata, bronce,
            medallas: oro + plata + bronce,
            total,
            // Medallas especiales desde la hoja
            badges: getBadgesHtml(row)
        };
    }).sort((a, b) => b.total - a.total);
}

function renderDestacados(clans) {
    const container = document.getElementById('clanesDestacados');
    let html = '<div class="clanes-grid">';
    clans.forEach((clan, i) => {
        const rank   = i + 1;
        const rankCl = rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : '';
        const esLider = rank === 1;
        html += `
        <div class="clan-card-mini${esLider ? ' clan-card-oro-lider' : ''}">
            ${esLider ? '<div class="corona-oro">👑 LÍDER EN TROFEOS</div>' : ''}
            <div class="clan-rank-badge ${rankCl}">#${rank}</div>
            <img src="${clan.logo}" alt="${clan.nombre}" class="clan-logo-mini"
                 onerror="this.src='logo/default.jpg'">
            <div class="clan-name-mini">${clan.nombre}</div>
            <div class="clan-tag-mini">${clan.tag}</div>
            <div class="clan-stats">
                <div class="clan-stat destacado-medallero">
                    <div class="stat-value" style="font-size:1.5em;font-weight:900">🏅 ${clan.medallas}</div>
                    <div class="stat-label">Medallas</div>
                </div>
                <div class="clan-stat" style="font-size:0.85em;opacity:0.75">
                    <div class="stat-value">🥇${clan.oro} &nbsp;🥈${clan.plata} &nbsp;🥉${clan.bronce}</div>
                    <div class="stat-label">Desglose</div>
                </div>
                <div class="clan-stat">
                    <div class="stat-value" style="color:#e6f702">${clan.total}</div>
                    <div class="stat-label">Pts Salas</div>
                </div>
            </div>
            ${clan.badges ? `
            <div class="clan-logros">
                <div class="clan-logros-titulo">🏆 Logros</div>
                <div class="clan-logros-items">${clan.badges}</div>
            </div>` : ''}
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// Scroll suave para links internos
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

function renderStreamers() {
    const grid = document.getElementById('streamersGrid');
    if (!grid || !CONFIG.STREAMERS || CONFIG.STREAMERS.length === 0) return;
    grid.innerHTML = CONFIG.STREAMERS.map(s => `
        <a class="streamer-card" href="${s.url}" target="_blank" rel="noopener">
            <div class="streamer-avatar-placeholder">🎮</div>
            <div class="streamer-nombre">${s.nombre}</div>
            <div class="streamer-handle">${s.handle}</div>
            ${
                s.vivo
                ? `<div class="streamer-live-badge"><span class="streamer-live-dot"></span> EN VIVO</div>`
                : `<div class="streamer-offline">Offline</div>`
            }
            <span class="streamer-ver-btn">${s.vivo ? '📡 Ver Stream' : '👍 Ver Perfil'}</span>
        </a>
    `).join('');
}