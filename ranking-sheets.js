// ============================================================
// CONFIGURACIÓN DE GOOGLE SHEETS PARA RANKING
// ============================================================
// INSTRUCCIONES:
// 1. Crea una hoja de cálculo en Google Sheets
// 2. Haz clic en "Archivo" > "Compartir" > "Publicar en la web"
// 3. Selecciona tu pestaña de rankings
// 4. En formato, elige "CSV"
// 5. Copia el enlace que te da
// 6. Pégalo abajo reemplazando 'TU_ID_AQUI'
// ============================================================

const SHEET_CONFIG = {
    // URL de tu hoja de Google Sheets publicada (formato CSV)
    RANKING_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu_gcz23fcAOkUznNZV1F-J2pnbe0wq3yeFFF5l1eYqZ1eMZuZIk-umF2OB1_sc6NDlHjkqwpYIazJ/pub?gid=0&single=true&output=csv'
};

// ============================================================
// FUNCIÓN PARA LEER GOOGLE SHEETS
// ============================================================

async function fetchGoogleSheet(url) {
    try {
        console.log('📊 Cargando rankings desde Google Sheets...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('✅ Datos cargados correctamente');
        return parseCSV(csvText);
    } catch (error) {
        console.error('❌ Error al cargar Google Sheets:', error);
        return [];
    }
}

// Función para convertir CSV a array de objetos
function parseCSV(csv) {
    csv = csv.replace(/^\uFEFF/, ''); // Eliminar BOM
    
    const lines = csv.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim().replace(/"/g, '') : '';
        });
        
        if (row[headers[0]] && row[headers[0]] !== '') {
            data.push(row);
        }
    }
    
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    
    return result;
}

// ============================================================
// FUNCIÓN PARA CONVERTIR DATOS A FORMATO DE RANKING
// ============================================================

function convertSheetToRankings(sheetData) {
    console.log(`🏆 Procesando ${sheetData.length} entradas de ranking...`);
    
    const rankings = {
        'alcatraz': [],
        'alcatraz2.0': [],
        'Guerra': [],
        'Letal': [],
        'Xtreme': []
    };

    sheetData.forEach(row => {
        const sala = (row.sala || row.Sala || '').trim();
        const nombre = (row.nombre || row.Nombre || row.clan || row.Clan || '').trim();
        const rank = parseInt(row.rank || row.Rank || row.posicion || row.Posicion || 0);
        const score = parseInt(row.score || row.Score || row.puntos || row.Puntos || 0);
        const logo = (row.logo || row.Logo || '').trim() || 'logo de sala/logo de pagina .png';
        const suspendido = (row.suspendido || row.Suspendido || '').toLowerCase() === 'si' || 
                          (row.suspendido || row.Suspendido || '').toLowerCase() === 'sí';

        if (sala && nombre && rank) {
            if (rankings[sala]) {
                rankings[sala].push({ 
                    nombre, 
                    rank, 
                    score,
                    logo,
                    suspendido
                });
            } else {
                console.warn(`⚠️ Sala desconocida: "${sala}". Usa: alcatraz, alcatraz2.0, Guerra, Letal, o Xtreme`);
            }
        }
    });

    // Ordenar cada sala por rank
    Object.keys(rankings).forEach(sala => {
        rankings[sala].sort((a, b) => a.rank - b.rank);
        if (rankings[sala].length > 0) {
            console.log(`✅ ${sala}: ${rankings[sala].length} equipos`);
        }
    });

    return rankings;
}

// ============================================================
// FUNCIÓN PARA CREAR ITEM DE RANKING
// ============================================================

function createRankingItem(team, roomKey) {
    const suspendedClass = team.suspendido ? 'suspended' : '';
    const suspendedBadge = team.suspendido ? '<span class="suspended-badge">SUSPENDIDO</span>' : '';
    
    return `
        <div class="ranking-item ${suspendedClass}" data-rank="${team.rank}" data-room="${roomKey}">
            <div class="rank-number">${team.rank}</div>
            <div class="player-avatar-small">
                <img src="${team.logo}" alt="${team.nombre}" loading="lazy" onerror="this.src='logo de sala/logo de pagina .png'">
            </div>
            <div class="player-info">
                <div class="player-name">
                    ${team.nombre}
                    ${suspendedBadge}
                </div>
                <div class="room-badge ${roomKey.toLowerCase().replace('.', '')}">${getRoomDisplayName(roomKey)}</div>
            </div>
            <div class="score-value">${team.score}</div>
        </div>
    `;
}

// ============================================================
// NOMBRES DE VISUALIZACIÓN DE SALAS
// ============================================================

function getRoomDisplayName(roomKey) {
    const names = {
        'alcatraz': 'Alcatraz',
        'alcatraz2.0': 'Alcatraz 2.0',
        'Guerra': 'Zona de Guerra',
        'Letal': 'Zona Letal',
        'Xtreme': 'Zona Xtreme'
    };
    return names[roomKey] || roomKey;
}

// ============================================================
// CARGAR Y MOSTRAR RANKINGS
// ============================================================

async function loadRankings() {
    try {
        const container = document.getElementById('rankingsList');
        
        // Verificar configuración
        if (SHEET_CONFIG.RANKING_URL.includes('TU_ID_AQUI')) {
            container.innerHTML = `
                <div class="error-message">
                    ⚠️ <strong>Configuración Pendiente</strong><br><br>
                    Por favor, configura la URL de Google Sheets en el archivo <code>ranking-sheets.js</code><br>
                    Revisa la guía <code>GUIA-RANKING.md</code> para instrucciones detalladas.
                </div>
            `;
            return;
        }
        
        // Cargar datos
        const sheetData = await fetchGoogleSheet(SHEET_CONFIG.RANKING_URL);
        const rankings = convertSheetToRankings(sheetData);
        
        // Guardar en variable global
        window.rankingsData = rankings;
        
        // Generar HTML para todos los equipos
        let allItemsHTML = '';
        for (const [roomKey, teams] of Object.entries(rankings)) {
            teams.forEach(team => {
                allItemsHTML += createRankingItem(team, roomKey);
            });
        }
        
        if (allItemsHTML) {
            container.innerHTML = allItemsHTML;
            
            // Mostrar solo Alcatraz por defecto
            filterByRoom('alcatraz');
            
            console.log('✅ Rankings cargados correctamente desde Google Sheets');
            console.log('📍 Funcionando con GitHub Pages');
        } else {
            container.innerHTML = `
                <div class="error-message">
                    ❌ <strong>No se encontraron datos</strong><br><br>
                    Verifica que:<br>
                    • La hoja de Google Sheets esté publicada como CSV<br>
                    • La hoja tenga datos<br>
                    • Las columnas tengan los nombres correctos<br>
                    • La URL en ranking-sheets.js sea correcta
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ Error al cargar rankings:', error);
        document.getElementById('rankingsList').innerHTML = `
            <div class="error-message">
                ❌ <strong>Error al cargar datos</strong><br><br>
                ${error.message}<br><br>
                <small>Abre la consola del navegador (F12) para más detalles</small>
            </div>
        `;
    }
}

// ============================================================
// FILTRADO POR SALA
// ============================================================

function filterByRoom(selectedRoom) {
    const rankingItems = document.querySelectorAll('.ranking-item');
    
    rankingItems.forEach(item => {
        const itemRoom = item.getAttribute('data-room');
        
        if (itemRoom === selectedRoom) {
            item.classList.remove('hidden');
        } else {
            item.classList.add('hidden');
        }
    });
}

// ============================================================
// CONFIGURAR FILTROS
// ============================================================

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remover clase active de todos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar clase active al clickeado
            button.classList.add('active');
            
            // Obtener sala seleccionada
            const selectedRoom = button.getAttribute('data-room');
            
            // Filtrar
            filterByRoom(selectedRoom);
        });
    });
}

// ============================================================
// MENÚ HAMBURGUESA
// ============================================================

function setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// ============================================================
// ANIMACIÓN DE ENTRADA
// ============================================================

function setupAnimations() {
    const rankingItems = document.querySelectorAll('.ranking-item');
    
    rankingItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = 'all 0.4s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 50);
        }, index * 30);
    });
}

// ============================================================
// INICIALIZAR
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando carga de rankings...');
    console.log('📍 Hosting: GitHub Pages');
    
    setupHamburgerMenu();
    setupFilters();
    
    loadRankings().then(() => {
        setupAnimations();
    });
});
