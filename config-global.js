/**
 * CONFIGURACIÓN GLOBAL - EL CONTINENTAL
 * =====================================================
 * LOGOS: Crea carpeta "logos/" junto a los HTML
 * Nombre de cada logo = ID del clan + .jpg
 * Ej: logos/2026001.jpg, logos/2026002.jpg
 * Si no hay logo → logos/default.jpg
 * =====================================================
 * PUNTOS: Solo salas (Alcatraz, Zona Guerra, etc.)
 * TROFEOS: Oro/Plata/Bronce = decorativos, NO suman puntos
 */

const CONFIG = {
    SHEET_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa9VQLs3q_CXPQ_14S9SZ0snUA3AGmpYijAaUzbqut5LkSFepscbaLWvGb_AFt-24utnbdA4K02XEg/pub?gid=1070970565&single=true&output=csv',

    // ══════════════════════════════════════════════
    // HOJA DEL TORNEO (bracket dinámico)
    // 1. Abre tu nuevo Google Sheet del torneo
    // 2. Ve a Archivo → Publicar en la web
    // 3. Elige la pestaña del torneo → formato CSV → Publicar
    // 4. Copia el enlace y pégalo aquí
    // Formato de la hoja:  Ronda | Equipo1 | Puntos1 | Equipo2 | Puntos2
    // ══════════════════════════════════════════════
    TORNEO_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa9VQLs3q_CXPQ_14S9SZ0snUA3AGmpYijAaUzbqut5LkSFepscbaLWvGb_AFt-24utnbdA4K02XEg/pub?gid=876119716&single=true&output=csv',

    // Hoja de asistencia: columna A = Clanes, columnas B-AF = días 1-31
    ASISTENCIA_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRa9VQLs3q_CXPQ_14S9SZ0snUA3AGmpYijAaUzbqut5LkSFepscbaLWvGb_AFt-24utnbdA4K02XEg/pub?gid=1400235060&single=true&output=csv',

    // ══════════════════════════════════════════════
    // HOJA DE CONTACTOS (solo visible para el CEO)
    // 1. Ve a tu Google Sheet del formulario de registro
    // 2. Archivo → Publicar en la web → la pestaña del form → CSV → Publicar
    // 3. Pega el enlace aquí
    //
    // Formato esperado (respuestas del Google Form):
    //   Col A (0) → Timestamp
    //   Col B (1) → Nombre del clan
    //   Col C (2) → Tag del clan
    //   Col D (3) → Logo del clan
    //   Col E (4) → Nombre del líder
    //   Col F (5) → Número de teléfono (líder)
    //   Col G (6) → Nombre del co-líder 1
    //   Col H (7) → Número de teléfono co-líder 1
    //   Col I (8) → Nombre del co-líder 2
    //   Col J (9) → Número de teléfono co-líder 2
    //   Col K (10) → Modo de juego
    // ══════════════════════════════════════════════
    CONTACTO_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRokGDiYpw_QV0WtS7dqPXdZFsBRrQWawAH5kzK9Jodgun6Cy2lNalOhRiE6XIZ69pwtJFwHWmZBRTP/pub?gid=2010911080&single=true&output=csv',

    CONTACTO_COLUMNS: {
        NOMBRE_CLAN:      1,
        TAG_CLAN:         2,
        LOGO:             3,
        NOMBRE_LIDER:     4,
        TELEFONO_LIDER:   5,
        NOMBRE_COLIDER1:  6,
        TELEFONO_COLIDER1:7,
        NOMBRE_COLIDER2:  8,
        TELEFONO_COLIDER2:9,
        MODO_JUEGO:       10,
    },

    LOGO_FOLDER:   'logo',
    LOGO_EXTENSION: 'jpg',
    LOGO_DEFAULT:   'logo/default.jpg',

    CACHE_DURATION: 5 * 60 * 1000,

    COLUMNS: {
        TIMESTAMP:        0,
        NOMBRE_DE_CLAN:   1,
        TAG_DEL_CLAN:     2,
        LOGO:             3,
        ID:               4,
        ORO:              5,
        PLATA:            6,
        BRONCE:           7,
        ALCATRAZ:         8,
        ALCATRAZ_2_0:      9,
        ZONA_DE_GUERRA:   10,
        ZONA_LETAL:       11,
        ZONA_XTREME:      12,
        puntos:           13,
        PUNTOS_TOTAL:     14,
        // ─────────────────────────────────────────────────────────────
        // MEDALLAS ESPECIALES — Columnas O, P, Q de tu Google Sheet
        // Para ACTIVAR: escribe cualquier valor (1, SI, ✓, GANADOR...)
        // Para DESACTIVAR: deja la celda vacía o pon 0
        //   Columna O (índice 14) → RUBI        → Torneo
        //   Columna P (índice 15) → ORO_DIAMANTE → Torneo entre comunidades
        //   Columna Q (índice 16) → ESMERALDA   → Torneo de MJ
        // ─────────────────────────────────────────────────────────────
        RUBI:             14,
        ORO_DIAMANTE:     15,
        ESMERALDA:        16,
        // Los datos de contacto (líder, teléfonos, co-líderes, modo de juego)
        // se leen desde CONFIG.CONTACTO_URL (hoja separada del form de registro).
        // Ver CONTACTO_COLUMNS más abajo.
    },

    SALAS: {
        ALCATRAZ:     'Alcatraz',
        ALCATRAZ_2_0: 'Alcatraz2.0',
        ZONA_DE_GUERRA:  'Zona de Guerra',
        ZONA_LETAL:   'Zona Letal',
        ZONA_XTREME:  'Zona Xtreme'
    },

    // ══════════════════════════════════════════════
    // STREAMERS DE TIKTOK
    // Para marcar que está EN VIVO: pon vivo: true
    // Para offline:                   pon vivo: false
    // ══════════════════════════════════════════════
    STREAMERS: [
        {
            nombre: 'Toxii',
            handle: '@toxii',
            url:    'https://www.tiktok.com/@toxii',
            vivo:   true   // ← cambia a true cuando esté en directo
        }
    ],

    // ══════════════════════════════════════════════
    // 2 NIVELES DE ACCESO
    // ══════════════════════════════════════════════
    USERS: [
        {
            usuario:  'HOST',
            password: 'HOST2025',
            rol:      'viewer',
            sheetUrl: '' // vacío → usa SHEET_URL principal
        },
        {
            usuario:  'CEO',
            password: 'ceo2026',
            rol:      'master',
            sheetUrl: '' // vacío → usa SHEET_URL principal
        }
    ]
};

/* Logo: usa URL de la hoja si existe, si no usa carpeta local por ID */
function getLogoUrl(clanId, logoUrl) {
    // Si viene una URL directa de la hoja de cálculo, usarla
    if (logoUrl && String(logoUrl).trim() !== '' && String(logoUrl).trim() !== '—') {
        const url = String(logoUrl).trim();
        // Convertir links de Google Drive al formato de descarga directa
        if (url.includes('drive.google.com')) {
            // Formatos posibles:
            // https://drive.google.com/file/d/FILE_ID/view
            // https://drive.google.com/open?id=FILE_ID
            const matchFile = url.match(/\/file\/d\/([a-zA-Z0-9_\-]+)/);
            const matchOpen = url.match(/[?&]id=([a-zA-Z0-9_\-]+)/);
            const fileId = (matchFile && matchFile[1]) || (matchOpen && matchOpen[1]);
            if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
        }
        // Si es otra URL directa (http/https), usarla tal cual
        if (url.startsWith('http')) return url;
    }
    // Fallback: carpeta local por ID
    if (!clanId || String(clanId).trim() === '' || String(clanId).trim() === '—') return CONFIG.LOGO_DEFAULT;
    const cleanId = String(clanId).trim().replace(/[^a-zA-Z0-9_\-]/g, '');
    if (!cleanId) return CONFIG.LOGO_DEFAULT;
    return `${CONFIG.LOGO_FOLDER}/${cleanId}.${CONFIG.LOGO_EXTENSION}`;
}

/* Puntos SOLO de salas (trofeos no suman) */
function calcularPuntos(row) {
    return (parseInt(row[CONFIG.COLUMNS.ALCATRAZ])     || 0)
         + (parseInt(row[CONFIG.COLUMNS.ALCATRAZ_2_0]) || 0)
         + (parseInt(row[CONFIG.COLUMNS.ZONA_DE_GUERRA])  || 0)
         + (parseInt(row[CONFIG.COLUMNS.ZONA_LETAL])   || 0)
         + (parseInt(row[CONFIG.COLUMNS.ZONA_XTREME])  || 0);
}

/* CSV Parser */
function parseCSV(text) {
    const lines = text.split('\n'), result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = [];
        let current = '', inQuotes = false;
        for (let c = 0; c < line.length; c++) {
            if (line[c] === '"') { inQuotes = !inQuotes; }
            else if (line[c] === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
            else { current += line[c]; }
        }
        values.push(current.trim());
        if (values.length > 1) result.push(values);
    }
    return result;
}

/* Fetch con caché — acepta URL opcional por usuario */
async function fetchSheetData(url) {
    url = url || CONFIG.SHEET_URL;
    const keyId = url.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
    const KEY   = 'elcontinental_data_' + keyId;
    const TS    = 'elcontinental_time_' + keyId;
    const cached = localStorage.getItem(KEY), ts = localStorage.getItem(TS);
    if (cached && ts && (Date.now() - parseInt(ts)) < CONFIG.CACHE_DURATION) return JSON.parse(cached);
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = parseCSV(await res.text());
        localStorage.setItem(KEY, JSON.stringify(data));
        localStorage.setItem(TS, Date.now().toString());
        return data;
    } catch (err) {
        if (cached) return JSON.parse(cached);
        throw err;
    }
}

function filterActiveClans(data) {
    return data;
}

function clearCache() {
    Object.keys(localStorage)
        .filter(k => k.startsWith('elcontinental_'))
        .forEach(k => localStorage.removeItem(k));
}

/* Hamburger compartido */
function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    if (!hamburger || !navLinks) return;
    hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('active'); });
    document.querySelectorAll('.nav-links a').forEach(l => l.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('active'); }));
    document.addEventListener('click', e => { if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) { hamburger.classList.remove('active'); navLinks.classList.remove('active'); } });
}

window.CONFIG            = CONFIG;
window.fetchSheetData    = fetchSheetData;
window.getLogoUrl        = getLogoUrl;
window.filterActiveClans = filterActiveClans;
window.calcularPuntos    = calcularPuntos;
window.clearCache        = clearCache;
window.initHamburger     = initHamburger;

// ══════════════════════════════════════════════════════════════════════
// MEDALLAS ESPECIALES — funciones compartidas en TODAS las páginas
// ══════════════════════════════════════════════════════════════════════
/**
 * Definición visual de los 3 tipos de medalla.
 * Usada en index.html, clanes.html, ranking.html y admin.html.
 */
const TIPOS_MEDALLA = [
    { col: 'RUBI',         label: 'Rubí',        desc: 'Torneo',                   clase: 'rubi',         icono: '💎' },
    { col: 'ORO_DIAMANTE', label: 'Oro+Diamante', desc: 'Torneo entre comunidades', clase: 'oro-diamante', icono: '🔷' },
    { col: 'ESMERALDA',    label: 'Esmeralda',    desc: 'Torneo de MJ',             clase: 'esmeralda',   icono: '💚' },
];

/**
 * Devuelve true si la celda de la hoja tiene un valor que activa la medalla.
 * Activa: cualquier texto o número distinto de vacío / 0 / no / false.
 */
function tieneMedalla(valor) {
    if (valor === undefined || valor === null) return false;
    const v = String(valor).trim().toLowerCase();
    return v !== '' && v !== '0' && v !== 'no' && v !== 'false' && v !== '—';
}

/**
 * Devuelve divs estilo medal-item (igual que 🥇🥈🥉) para inyectar
 * DENTRO de .clan-medals / .medals-display.
 * El número viene de la celda: 3 → muestra 3; texto activo → muestra 1.
 */
function getBadgesHtml(row) {
    return TIPOS_MEDALLA
        .filter(m => tieneMedalla(row[CONFIG.COLUMNS[m.col]]))
        .map(m => {
            const raw      = row[CONFIG.COLUMNS[m.col]];
            const num      = parseInt(raw);
            const cantidad = (!isNaN(num) && num > 0) ? num : 1;
            return `<div class="medal-item ${m.clase}" title="${m.desc}"><span class="medal-icon">${m.icono}</span><span class="medal-count">${cantidad}</span></div>`;
        })
        .join('');
}

/**
 * Versión inline para ranking (ej: "💎2 🔷1 💚3").
 */
function getBadgesInline(row) {
    return TIPOS_MEDALLA
        .filter(m => tieneMedalla(row[CONFIG.COLUMNS[m.col]]))
        .map(m => {
            const raw      = row[CONFIG.COLUMNS[m.col]];
            const num      = parseInt(raw);
            const cantidad = (!isNaN(num) && num > 0) ? num : 1;
            return `${m.icono}${cantidad}`;
        })
        .join(' ');
}

window.TIPOS_MEDALLA   = TIPOS_MEDALLA;
window.tieneMedalla    = tieneMedalla;
window.getBadgesHtml   = getBadgesHtml;
window.getBadgesInline = getBadgesInline;