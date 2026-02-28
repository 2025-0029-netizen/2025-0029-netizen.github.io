/**
 * RANKING.JS
 * PUNTOS = solo salas. Trofeos = decorativos (se muestran en general, no suman).
 */

document.addEventListener('DOMContentLoaded', function () { initRanking(); initHamburger(); });

async function initRanking() {
    const container  = document.getElementById('rankingContainer');
    const filterBtns = document.querySelectorAll('.filtro-btn');
    try {
        const data     = await fetchSheetData();
        const active   = filterActiveClans(data);
        if (active.length === 0) { container.innerHTML = '<div class="error-message">No hay clanes registrados aún</div>'; return; }
        const rankings = prepareRankings(active);
        displayRanking(rankings, 'general', container);
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                displayRanking(rankings, btn.getAttribute('data-sala'), container);
            });
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<div class="error-message">❌ Error al cargar los datos</div>`;
    }
}

function prepareRankings(clans) {
    const R = { 'general': [], 'Alcatraz': [], 'Alcatraz 2.0': [], 'Zona Guerra': [], 'Zona Letal': [], 'Zona Xtreme': [] };
    clans.forEach(row => {
        const base = {
            nombre: row[CONFIG.COLUMNS.NOMBRE_DE_CLAN],
            tag:    row[CONFIG.COLUMNS.TAG_DEL_CLAN],
            logo:   getLogoUrl(row[CONFIG.COLUMNS.ID], row[CONFIG.COLUMNS.LOGO])
        };
        const oro    = parseInt(row[CONFIG.COLUMNS.ORO])    || 0;
        const plata  = parseInt(row[CONFIG.COLUMNS.PLATA])  || 0;
        const bronce = parseInt(row[CONFIG.COLUMNS.BRONCE]) || 0;
        const alc    = parseInt(row[CONFIG.COLUMNS.ALCATRAZ])     || 0;
        const alc2   = parseInt(row[CONFIG.COLUMNS.ALCATRAZ_2_0]) || 0;
        const zg     = parseInt(row[CONFIG.COLUMNS.ZONA_DE_GUERRA])  || 0;
        const zl     = parseInt(row[CONFIG.COLUMNS.ZONA_LETAL])   || 0;
        const zx     = parseInt(row[CONFIG.COLUMNS.ZONA_XTREME])  || 0;
        const total = calcularPuntos(row); // SOLO SALAS

        const logrosInline = getBadgesInline(row) || null;

        // General: puntos de salas. Trofeos e info extra separados de los logros
        R['general'].push({
            ...base, puntos: total, sala: 'General',
            extra:  (oro || plata || bronce) ? `🥇${oro} 🥈${plata} 🥉${bronce}` : null,
            logros: logrosInline
        });

        if (alc  > 0) R['Alcatraz'].push({     ...base, puntos: alc,  sala: 'Alcatraz',     extra: null, logros: logrosInline });
        if (alc2 > 0) R['Alcatraz 2.0'].push({ ...base, puntos: alc2, sala: 'Alcatraz 2.0', extra: null, logros: logrosInline });
        if (zg   > 0) R['Zona Guerra'].push({   ...base, puntos: zg,   sala: 'Zona Guerra',  extra: null, logros: logrosInline });
        if (zl   > 0) R['Zona Letal'].push({    ...base, puntos: zl,   sala: 'Zona Letal',   extra: null, logros: logrosInline });
        if (zx   > 0) R['Zona Xtreme'].push({   ...base, puntos: zx,   sala: 'Zona Xtreme',  extra: null, logros: logrosInline });
    });
    Object.keys(R).forEach(k => R[k].sort((a, b) => b.puntos - a.puntos));
    return R;
}

function displayRanking(rankings, sala, container) {
    const items = rankings[sala];
    if (!items || items.length === 0) {
        container.innerHTML = `<div class="error-message">No hay clanes con puntos en ${sala}</div>`; return;
    }
    let html = '';
    items.forEach((clan, i) => {
        const pos = i + 1;
        const topCl   = pos <= 3 ? `top-${pos}` : '';
        const posLabel = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : pos;
        html += `
        <div class="ranking-item ${topCl}">
            <div class="ranking-posicion">${posLabel}</div>
            <img src="${clan.logo}" alt="${clan.nombre}" class="ranking-logo"
                 onerror="this.src='logo/default.jpg'">
            <div class="ranking-info">
                <div class="ranking-nombre">${clan.nombre}</div>
                <div class="ranking-tag">${clan.tag}</div>
                <div class="ranking-sala">${clan.sala}${clan.extra ? ' · ' + clan.extra : ''}</div>
                ${clan.logros ? `<div class="ranking-logros"><span class="ranking-logros-label">🏆 Logros:</span> ${clan.logros}</div>` : ''}
            </div>
            <div class="ranking-puntos">
                <div class="ranking-score">${clan.puntos}</div>
                <div class="ranking-label">puntos</div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}