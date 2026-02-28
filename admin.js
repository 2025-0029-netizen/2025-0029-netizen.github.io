/**
 * ADMIN.JS - 2 Niveles de Acceso
 *
 * VIEWER  → Logo (descargable), nombre, tag, trofeos, pts totales salas
 * MASTER  → Todo completo: pts desglosados, contactos, líderes, teléfonos, estado, exportar CSV
 *
 * Nota: el rol "editor" está reservado para uso futuro (ver renderTabla).
 */

let currentUser  = null;
let allData      = [];
let filteredData = [];
let contactMap   = {}; // { nombreClanNormalizado: {lider, tel, colider1, ...} } solo CEO

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnLogin').addEventListener('click', handleLogin);
    ['username','password'].forEach(id =>
        document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); })
    );
    const saved = sessionStorage.getItem('adminUser');
    if (saved) { currentUser = JSON.parse(saved); showDashboard(); }
});

/* ── LOGIN ── */
function handleLogin() {
    const user  = document.getElementById('username').value.trim();
    const pass  = document.getElementById('password').value;
    const err   = document.getElementById('loginError');
    const found = CONFIG.USERS.find(u => u.usuario === user && u.password === pass);
    if (found) {
        currentUser = { usuario: found.usuario, rol: found.rol, sheetUrl: found.sheetUrl };
        sessionStorage.setItem('adminUser', JSON.stringify(currentUser));
        err.style.display = 'none';
        showDashboard();
    } else {
        err.style.display = 'block';
        document.getElementById('password').value = '';
    }
}

/* ── DASHBOARD ── */
function showDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('adminContainer').style.display = 'block';

    // Badge de rol
    const rolBadge = document.getElementById('rolBadge');
    const icons = { viewer: '👁️ Host de Sala', master: '👑 CEO' };
    rolBadge.textContent = icons[currentUser.rol] || currentUser.rol;
    rolBadge.className   = 'rol-badge rol-' + currentUser.rol;

    // Ocultar secciones según rol
    document.querySelectorAll('.only-master').forEach(el => {
        el.style.display = currentUser.rol === 'master' ? '' : 'none';
    });

    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('adminUser'); location.reload();
    });
    document.getElementById('btnRefresh').addEventListener('click', () => {
        clearCache(); loadAdminData();
    });
    document.getElementById('btnRefreshAsistencia')?.addEventListener('click', () => {
        loadAsistencia(true);
    });
    document.getElementById('searchInput').addEventListener('input', applyFilter);
    document.getElementById('filterEstado')?.addEventListener('change', applyFilter);
    document.getElementById('btnExportContacts')?.addEventListener('click', exportContacts);
    document.getElementById('btnExportPuntos')?.addEventListener('click', exportPuntos);

    // ── PESTAÑAS ──
    let asistenciaCargada = false;
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.admin-panel').forEach(p => p.style.display = 'none');
            tab.classList.add('active');
            const panel = document.getElementById('panel-' + tab.dataset.tab);
            if (panel) panel.style.display = 'block';
            // Carga lazy de asistencia: solo la primera vez que se abre esa pestaña
            if (tab.dataset.tab === 'asistencia' && !asistenciaCargada) {
                asistenciaCargada = true;
                loadAsistencia();
            }
            if (tab.dataset.tab === 'contactos') renderContactos();
        });
    });

    loadAdminData();
}

/* ── CARGAR DATOS ── */
async function loadAdminData() {
    try {
        // Si es CEO y hay URL de contactos, cargar ambas hojas en paralelo
        const isCEO = currentUser.rol === 'master';
        const promises = [fetchSheetData(currentUser.sheetUrl)];
        if (isCEO && CONFIG.CONTACTO_URL && CONFIG.CONTACTO_URL !== 'PEGA_AQUI_URL_CSV_DEL_FORM_DE_REGISTRO') {
            promises.push(fetchSheetData(CONFIG.CONTACTO_URL));
        }

        const [mainData, contactData] = await Promise.all(promises);
        allData = mainData;

        // Construir mapa de contactos: clave = nombre de clan en minúsculas
        contactMap = {};
        if (contactData) {
            const CC = CONFIG.CONTACTO_COLUMNS;
            contactData.forEach(row => {
                const key = (row[CC.NOMBRE_CLAN] || '').trim().toLowerCase();
                if (!key) return;
                // Guardar solo la fila más reciente (el array viene en orden, la última gana)
                contactMap[key] = {
                    lider:     row[CC.NOMBRE_LIDER]      || '',
                    telLider:  row[CC.TELEFONO_LIDER]    || '',
                    colider1:  row[CC.NOMBRE_COLIDER1]   || '',
                    telCo1:    row[CC.TELEFONO_COLIDER1]  || '',
                    colider2:  row[CC.NOMBRE_COLIDER2]   || '',
                    telCo2:    row[CC.TELEFONO_COLIDER2]  || '',
                    modo:      row[CC.MODO_JUEGO]         || '',
                };
            });
        }

        const active = filterActiveClans(allData);

        let trofeos = 0;
        allData.forEach(r => {
            trofeos += (parseInt(r[CONFIG.COLUMNS.ORO])    || 0)
                     + (parseInt(r[CONFIG.COLUMNS.PLATA])  || 0)
                     + (parseInt(r[CONFIG.COLUMNS.BRONCE]) || 0);
        });

        document.getElementById('totalClanes').textContent    = allData.length;
        document.getElementById('clanesActivos').textContent  = active.length;
        document.getElementById('totalJugadores').textContent = active.length * 4 + '+';
        document.getElementById('totalTrofeos').textContent   = trofeos;

        applyFilter();
    } catch (err) {
        console.error(err);
        document.getElementById('tablaBody').innerHTML =
            `<tr><td colspan="20" class="loading-cell" style="color:#ff4d4d">❌ Error al cargar datos</td></tr>`;
    }
}

/* ── ASISTENCIA ── */
async function loadAsistencia(forceRefresh = false) {
    const wrapper = document.getElementById('asistenciaWrapper');
    if (!wrapper) return;
    if (forceRefresh) {
        // Limpiar caché solo para la URL de asistencia
        const keyId = CONFIG.ASISTENCIA_URL.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
        localStorage.removeItem('elcontinental_data_' + keyId);
        localStorage.removeItem('elcontinental_time_' + keyId);
    }
    wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⏳ Cargando asistencia...</p>';
    try {
        const data = await fetchSheetData(CONFIG.ASISTENCIA_URL);
        renderAsistencia(data, wrapper);
    } catch (err) {
        console.error('Asistencia error:', err);
        wrapper.innerHTML = '<p style="color:#ff4d4d;text-align:center;padding:2rem">❌ No se pudo cargar la hoja de asistencia.</p>';
    }
}

function renderAsistencia(data, wrapper) {
    if (!data || data.length === 0) {
        wrapper.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ La hoja de asistencia está vacía.</p>';
        return;
    }

    // parseCSV ya saltó la fila 1 (cabecera), así que TODAS las filas son clanes.
    // Generamos los números de día según la cantidad de columnas que tenga la primera fila.
    const rows = data.filter(r => r[0] && r[0].trim() !== '');
    const maxCols = Math.max(...rows.map(r => r.length)) - 1; // columnas de días
    const diasHeaders = Array.from({ length: maxCols }, (_, i) => i + 1); // [1, 2, ..., N]

    // Calcular resumen por clan
    const hoy = new Date();
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const mesLabel = `${meses[hoy.getMonth()]} ${hoy.getFullYear()}`;

    let thead = `<thead><tr>
        <th class="asist-th-clan">Clan</th>`;
    diasHeaders.forEach(d => {
        const n = parseInt(d);
        const esHoy = n === hoy.getDate();
        thead += `<th class="asist-th-dia${esHoy ? ' asist-hoy' : ''}">${isNaN(n) ? d : n}</th>`;
    });
    thead += `<th class="asist-th-total">Total</th></tr></thead>`;

    let tbody = '<tbody>';
    rows.forEach(row => {
        const clan   = row[0] || '—';
        const celdas = row.slice(1);
        let total = 0;
        let tds = '';
        diasHeaders.forEach((d, i) => {
            const val = (celdas[i] || '').trim();
            const presente = val !== '' && val !== '0' && val.toLowerCase() !== 'no' && val.toLowerCase() !== 'false';
            if (presente) total++;
            const hoyIdx = parseInt(d) === new Date().getDate();
            tds += `<td class="asist-celda ${presente ? 'asist-presente' : 'asist-ausente'}${hoyIdx ? ' asist-hoy-col' : ''}" title="${presente ? val : 'Ausente'}">${presente ? '✓' : ''}</td>`;
        });
        const pct = diasHeaders.length > 0 ? Math.round(total / diasHeaders.length * 100) : 0;
        tbody += `<tr>
            <td class="asist-td-clan">${clan}</td>
            ${tds}
            <td class="asist-td-total">${total}<span class="asist-pct">${pct}%</span></td>
        </tr>`;
    });
    tbody += '</tbody>';

    wrapper.innerHTML = `
        <div class="asistencia-mes">📅 ${mesLabel}</div>
        <div class="asistencia-scroll">
            <table class="asistencia-tabla">${thead}${tbody}</table>
        </div>`;
}

/* ── FILTRO ── */
function applyFilter() {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const estado = document.getElementById('filterEstado')?.value || 'all';

    filteredData = allData.filter(r => {
        const nombre   = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').toLowerCase();
        const tag      = (r[CONFIG.COLUMNS.TAG_DEL_CLAN]    || '').toLowerCase();
        const id       = (r[CONFIG.COLUMNS.ID]          || '').toLowerCase();
        const activo   = (r[CONFIG.COLUMNS.ACTIVO]      || '').toLowerCase().trim();
        const isActive = activo === 'activo' || activo === 'si' || activo === 'sí';
        const matchSearch = !search || nombre.includes(search) || tag.includes(search) || id.includes(search);
        const matchEstado = estado === 'all'
            || (estado === 'active'   && isActive)
            || (estado === 'inactive' && !isActive);
        return matchSearch && matchEstado;
    });

    filteredData.sort((a, b) => calcPts(b) - calcPts(a));
    renderTabla(filteredData);
}

/* Alias local para puntos de salas */
const calcPts = calcularPuntos;

/* ── RENDERIZAR TABLA (dinámico según rol) ── */
function renderTabla(rows) {
    const tbody = document.getElementById('tablaBody');
    const rol   = currentUser.rol;

    // Cabeceras según rol
    let headers = `<tr>
        <th>#</th>
        <th>Logo</th>
        <th>Clan</th>
        <th>Tag</th>
        <th>Trofeos</th>
        <th>Pts Salas</th>`;
    if (rol === 'editor' || rol === 'master') {
        headers += `<th>Alcatraz</th><th>Alc 2.0</th><th>Z. Guerra</th><th>Z. Letal</th><th>Z. Xtreme</th>`;
    }
    if (rol === 'master') {
        headers += `<th>Líder</th><th>📞 Tel. Líder</th><th>Co-Líder 1</th><th>📞 Tel. Co1</th><th>Co-Líder 2</th><th>📞 Tel. Co2</th><th>Modo de Juego</th><th>Estado</th>`;
    }
    headers += `</tr>`;
    document.getElementById('tablaHead').innerHTML = headers;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="20" class="loading-cell">No se encontraron clanes</td></tr>`;
        return;
    }

    let html = '';
    rows.forEach((r, i) => {
        const pts    = calcPts(r);
        const oro    = parseInt(r[CONFIG.COLUMNS.ORO])          || 0;
        const plata  = parseInt(r[CONFIG.COLUMNS.PLATA])        || 0;
        const bronce = parseInt(r[CONFIG.COLUMNS.BRONCE])       || 0;
        const alc    = parseInt(r[CONFIG.COLUMNS.ALCATRAZ])     || 0;
        const alc2   = parseInt(r[CONFIG.COLUMNS.ALCATRAZ_2_0]) || 0;
        const zg     = parseInt(r[CONFIG.COLUMNS.ZONA_DE_GUERRA])  || 0;
        const zl     = parseInt(r[CONFIG.COLUMNS.ZONA_LETAL])   || 0;
        const zx     = parseInt(r[CONFIG.COLUMNS.ZONA_XTREME])  || 0;
        const activo   = (r[CONFIG.COLUMNS.ACTIVO] || '').toLowerCase().trim();
        const isActive = activo === 'activo' || activo === 'si' || activo === 'sí';
        const clanId   = r[CONFIG.COLUMNS.ID]          || '';
        const nombre   = r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '—';
        const tag      = r[CONFIG.COLUMNS.TAG_DEL_CLAN]    || '—';
        const logoUrl  = getLogoUrl(clanId, r[CONFIG.COLUMNS.LOGO]);

        const sc = (v, col) => v > 0
            ? `<td style="color:${col};font-weight:bold;text-align:center">${v}</td>`
            : `<td style="color:rgba(255,255,255,0.25);text-align:center">—</td>`;

        let row = `<tr>
            <td style="color:var(--gold);font-weight:bold;text-align:center">${i + 1}</td>
            <td>
                <div class="logo-cell">
                    <img src="${logoUrl}" alt="${nombre}" class="clan-logo-small"
                         onerror="this.src='logo/default.jpg'">
                    <button class="btn-dl" title="Descargar logo"
                        onclick="descargarLogo('${logoUrl}', '${(clanId || nombre).replace(/'/g, '')}')">⬇</button>
                </div>
            </td>
            <td style="font-weight:bold">${nombre}</td>
            <td style="color:var(--yellow-accent);font-weight:bold">${tag}</td>
            <td>
                <div class="medals-display">
                    <span style="color:#FFD700">🥇${oro}</span>
                    <span style="color:#C0C0C0">🥈${plata}</span>
                    <span style="color:#CD7F32">🥉${bronce}</span>
                    ${getBadgesHtml(r)}
                </div>
            </td>
            <td style="color:var(--gold);font-weight:bold;font-size:1.15rem;text-align:center">${pts}</td>`;

        if (rol === 'editor' || rol === 'master') {
            row += sc(alc,  '#e6f702');
            row += sc(alc2, '#e6f702');
            row += sc(zg,   '#e6f702');
            row += sc(zl,   '#e6f702');
            row += sc(zx,   '#e6f702');
        }

        if (rol === 'master') {
            // Buscar en el mapa de contactos por nombre de clan (insensible a mayúsculas)
            const cKey = nombre.trim().toLowerCase();
            const c    = contactMap[cKey] || {};
            const tel  = (t) => t ? `<a href="tel:${t}" style="color:rgba(255,255,255,0.7);font-size:0.85rem;text-decoration:none">${t}</a>` : '<span style="color:rgba(255,255,255,0.25)">—</span>';
            row += `
            <td>${c.lider    || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telLider)}</td>
            <td>${c.colider1 || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telCo1)}</td>
            <td>${c.colider2 || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>${tel(c.telCo2)}</td>
            <td style="color:var(--accent);font-weight:600">${c.modo || '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            <td>
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? '✅ Activo' : '⏳ Pendiente'}
                </span>
            </td>`;
        }

        row += `</tr>`;
        html += row;
    });
    tbody.innerHTML = html;
    // Renderizar la sección de gestión de medallas cada vez que se actualiza la tabla
    renderMedallasSection(rows);
}

/* ── CONTACTOS (solo CEO) ── */
function renderContactos(filtro) {
    const grid = document.getElementById('contactosGrid');
    if (!grid) return;

    // Si no hay URL configurada
    if (!CONFIG.CONTACTO_URL || CONFIG.CONTACTO_URL === 'PEGA_AQUI_URL_CSV_DEL_FORM_DE_REGISTRO') {
        grid.innerHTML = `<div class="contactos-aviso">⚙️ Configura <code>CONTACTO_URL</code> en <code>config-global.js</code> para ver los contactos.</div>`;
        return;
    }

    // Buscar sobre allData cruzado con contactMap
    const q = (filtro || document.getElementById('contactosSearch')?.value || '').toLowerCase();

    const clanes = allData
        .map(r => {
            const nombre = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').trim();
            const cKey   = nombre.toLowerCase();
            const c      = contactMap[cKey] || {};
            return { nombre, tag: r[CONFIG.COLUMNS.TAG_DEL_CLAN] || '', logo: getLogoUrl(r[CONFIG.COLUMNS.ID], r[CONFIG.COLUMNS.LOGO]), ...c };
        })
        .filter(c => !q
            || c.nombre.toLowerCase().includes(q)
            || (c.lider    || '').toLowerCase().includes(q)
            || (c.colider1 || '').toLowerCase().includes(q)
            || (c.colider2 || '').toLowerCase().includes(q)
            || (c.modo     || '').toLowerCase().includes(q)
        );

    if (!clanes.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">No se encontraron coincidencias.</p>';
        return;
    }

    // Bind del buscador (primera vez)
    const input = document.getElementById('contactosSearch');
    if (input && !input._bound) {
        input._bound = true;
        input.addEventListener('input', () => renderContactos(input.value));
    }

    const tel = (t, label) => t
        ? `<div class="cto-field"><span class="cto-lbl">${label}</span><a href="tel:${t}" class="cto-tel">📞 ${t}</a></div>`
        : `<div class="cto-field"><span class="cto-lbl">${label}</span><span class="cto-empty">—</span></div>`;
    const txt = (v, label) => `<div class="cto-field"><span class="cto-lbl">${label}</span><span class="cto-val">${v || '<span class="cto-empty">—</span>'}</span></div>`;

    grid.innerHTML = clanes.map(c => `
        <div class="cto-card">
            <div class="cto-card-top">
                <img src="${c.logo}" alt="${c.nombre}" class="cto-logo" onerror="this.src='logo/default.jpg'">
                <div class="cto-clan-info">
                    <span class="cto-nombre">${c.nombre}</span>
                    <span class="cto-tag">${c.tag}</span>
                    ${c.modo ? `<span class="cto-modo">${c.modo}</span>` : ''}
                </div>
            </div>
            <div class="cto-divider"></div>
            <div class="cto-contactos">
                <div class="cto-persona">
                    <span class="cto-rol">👑 Líder</span>
                    ${txt(c.lider, 'Nombre')}
                    ${tel(c.telLider, 'Teléfono')}
                </div>
                ${(c.colider1 || c.telCo1) ? `
                <div class="cto-persona">
                    <span class="cto-rol">⭐ Co-Líder 1</span>
                    ${txt(c.colider1, 'Nombre')}
                    ${tel(c.telCo1, 'Teléfono')}
                </div>` : ''}
                ${(c.colider2 || c.telCo2) ? `
                <div class="cto-persona">
                    <span class="cto-rol">⭐ Co-Líder 2</span>
                    ${txt(c.colider2, 'Nombre')}
                    ${tel(c.telCo2, 'Teléfono')}
                </div>` : ''}
            </div>
        </div>`).join('');
}
function exportContacts() {
    let csv = 'Pos,Clan,Tag,ID,Líder,Tel Líder,Co-Líder 1,Tel Co1,Co-Líder 2,Tel Co2,Modo de Juego,Estado,Pts Salas\n';
    filteredData.forEach((r, i) => {
        const actv = (r[CONFIG.COLUMNS.ACTIVO] || '').toLowerCase().trim();
        const a    = (actv === 'activo' || actv === 'si' || actv === 'sí' || actv === 'yes') ? 'Activo' : 'Pendiente';
        const cKey = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '').trim().toLowerCase();
        const c    = contactMap[cKey] || {};
        csv += [i+1,
            `"${r[CONFIG.COLUMNS.NOMBRE_DE_CLAN]||''}"`,
            `"${r[CONFIG.COLUMNS.TAG_DEL_CLAN]||''}"`,
            r[CONFIG.COLUMNS.ID]||'',
            `"${c.lider    ||''}"`, `"${c.telLider||''}"`,
            `"${c.colider1 ||''}"`, `"${c.telCo1  ||''}"`,
            `"${c.colider2 ||''}"`, `"${c.telCo2  ||''}"`,
            `"${c.modo     ||''}"`,
            a, calcPts(r)].join(',') + '\n';
    });
    downloadCSV(csv, 'contactos_clanes.csv');
}

function exportPuntos() {
    let csv = 'Pos,Clan,Tag,Trofeos Oro,Trofeos Plata,Trofeos Bronce,Alcatraz,Alc2.0,Z.Guerra,Z.Letal,Z.Xtreme,Pts Total Salas\n';
    filteredData.forEach((r, i) => {
        csv += [i+1, `"${r[CONFIG.COLUMNS.NOMBRE_DE_CLAN]||''}"`, `"${r[CONFIG.COLUMNS.TAG_DEL_CLAN]||''}"`,
            parseInt(r[CONFIG.COLUMNS.ORO])||0, parseInt(r[CONFIG.COLUMNS.PLATA])||0, parseInt(r[CONFIG.COLUMNS.BRONCE])||0,
            parseInt(r[CONFIG.COLUMNS.ALCATRAZ])||0, parseInt(r[CONFIG.COLUMNS.ALCATRAZ_2_0])||0,
            parseInt(r[CONFIG.COLUMNS.ZONA_DE_GUERRA])||0, parseInt(r[CONFIG.COLUMNS.ZONA_LETAL])||0,
            parseInt(r[CONFIG.COLUMNS.ZONA_XTREME])||0, calcPts(r)].join(',') + '\n';
    });
    downloadCSV(csv, 'puntos_clanes.csv');
}

function downloadCSV(content, filename) {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
}

// ══════════════════════════════════════════════════════════════════════
// MEDALLAS ESPECIALES — leídas desde Google Sheets
// TIPOS_MEDALLA, tieneMedalla y getBadgesHtml viven en config-global.js
// y están disponibles en todas las páginas.
// ══════════════════════════════════════════════════════════════════════

/**
 * Renderiza la sección de medallas especiales (lectura desde hoja).
 * Solo muestra los clanes que tienen al menos una medalla activa.
 * Es solo de lectura — para cambiar medallas, edita Google Sheets.
 */
function renderMedallasSection(rows) {
    const grid = document.getElementById('medallasGrid');
    if (!grid) return;

    if (!rows || !rows.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">Carga los datos primero.</p>';
        return;
    }

    // Filtrar solo clanes con al menos una medalla activa en la hoja
    const conMedallas = rows.filter(r =>
        TIPOS_MEDALLA.some(m => tieneMedalla(r[CONFIG.COLUMNS[m.col]]))
    );

    if (!conMedallas.length) {
        grid.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">⚠️ Ningún clan tiene medallas especiales aún. Agrega valores en las columnas P, Q o R de Google Sheets.</p>';
        return;
    }

    let html = '';
    conMedallas.forEach(r => {
        const id     = (r[CONFIG.COLUMNS.ID]             || '').trim();
        const nombre = (r[CONFIG.COLUMNS.NOMBRE_DE_CLAN] || '—').trim();
        const tag    = (r[CONFIG.COLUMNS.TAG_DEL_CLAN]   || '').trim();
        const logo   = getLogoUrl(id, r[CONFIG.COLUMNS.LOGO]);

        // Badges activos de este clan
        const badgesHtml = TIPOS_MEDALLA
            .filter(m => tieneMedalla(r[CONFIG.COLUMNS[m.col]]))
            .map(m => `<span class="badge-medalla ${m.clase}">${m.label}<br><small style="font-size:0.6rem;opacity:0.8">${m.desc}</small></span>`)
            .join('');

        html += `
        <div class="medalla-clan-card tiene-medallas">
            <img src="${logo}" alt="${nombre}" class="medalla-logo"
                 onerror="this.src='logo/default.jpg'">
            <div class="medalla-clan-info">
                <span class="medalla-clan-nombre">${nombre}</span>
                <span class="medalla-clan-tag">${tag}</span>
            </div>
            <div class="medalla-botones">${badgesHtml}</div>
        </div>`;
    });

    grid.innerHTML = html;
}

/* Descarga de logo compatible con CORS (fetch → blob) */
async function descargarLogo(logoUrl, nombreArchivo) {
    try {
        const resp = await fetch(logoUrl);
        if (!resp.ok) throw new Error('fetch failed');
        const blob = await resp.blob();
        const ext  = blob.type.includes('png') ? 'png' : 'jpg';
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${nombreArchivo}.${ext}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 300);
    } catch {
        // Si falla CORS, abrir en nueva pestaña para que el usuario guarde manualmente
        window.open(logoUrl, '_blank');
    }
}