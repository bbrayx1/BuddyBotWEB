// ==========================================
// REFERENCIAS DEL DOM
// ==========================================
const searchInput = document.getElementById('searchInput');
const clearSearch = document.getElementById('clearSearch');
const searchDropdown = document.getElementById('searchDropdown');

const addCoordsMenuBtn = document.getElementById('addCoordsMenuBtn');
const getCoordsMenuBtn = document.getElementById('getCoordsMenuBtn');

let searchTimeout = null;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initMap();
    setupEventListeners();
});

// ==========================================
// LÓGICA DE VISTAS Y NAVEGACIÓN
// ==========================================
function navigate(viewId) {
    // Oculta todas las vistas
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
        section.classList.remove('active');
    });
    // Muestra la vista solicitada
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }
}

// ==========================================
// LÓGICA DEL BUSCADOR (DEBOUNCE 3 SEGUNDOS)
// ==========================================
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearSearch.style.display = query.length > 0 ? 'block' : 'none';
    
    clearTimeout(searchTimeout);
    
    if (query.length === 0) {
        searchDropdown.style.display = 'none';
        return;
    }

    // Espera exactamente 3 segundos de inactividad al teclear
    searchTimeout = setTimeout(async () => {
        const players = await api.searchPlayers(query);
        renderSearchDropdown(players);
    }, 3000);
});

clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.style.display = 'none';
    searchDropdown.style.display = 'none';
    clearTimeout(searchTimeout);
});

function renderSearchDropdown(players) {
    searchDropdown.innerHTML = '';
    
    if (players.length === 0) {
        searchDropdown.innerHTML = '<div class="dropdown-item">No se encontraron jugadores</div>';
        searchDropdown.style.display = 'block';
        return;
    }

    players.slice(0, 8).forEach(player => {
        const item = document.createElement('div');
        item.className = 'dropdown-item';
        const avatarSrc = player.Avatar ? player.Avatar : 'assets/backgrounds/galaxy.png';
        
        item.innerHTML = `
            <img src="${avatarSrc}" class="dropdown-avatar" onerror="this.src='assets/backgrounds/galaxy.png'">
            <div>
                <div style="font-size: 0.95rem; color: #fff;">${player.Name}</div>
                <div style="font-size: 0.75rem; color: #aaa;">Lvl: ${player.Level} | ${player.AllianceId || 'Sin Alianza'}</div>
            </div>
        `;
        
        item.addEventListener('click', () => {
            searchDropdown.style.display = 'none';
            searchInput.value = player.Name;
            loadPlayerView(player.Name); // Cargar vista del jugador
        });
        
        searchDropdown.appendChild(item);
    });
    
    searchDropdown.style.display = 'block';
}

// ==========================================
// CARGAR VISTAS: JUGADOR Y ALIANZA
// ==========================================
async function loadPlayerView(playerName) {
    const player = await api.getPlayer(playerName);
    if (!player) return alert("No se pudo cargar la información del jugador.");

    const header = document.getElementById('playerDetailHeader');
    const avatarSrc = player.Avatar ? player.Avatar : 'assets/backgrounds/galaxy.png';
    
    header.innerHTML = `
        <img src="${avatarSrc}" onerror="this.src='assets/backgrounds/galaxy.png'">
        <div>
            <h2 style="margin: 0; color: #00d2ff;">${player.Name}</h2>
            <p style="margin: 5px 0 0 0; color: #aaa;">Nivel: ${player.Level} | Alianza: ${player.AllianceId || 'Ninguna'} | Exp: ${player.Experience.toLocaleString()}</p>
        </div>
    `;

    const grid = document.getElementById('playerPlanetsGrid');
    grid.innerHTML = '';

    const colonyColors = ['Planet_blue.png', 'Planet_green.png', 'Planet_red.png', 'Planet_violet.png', 'Planet_white.png', 'Planet_yellow.png'];

    player.Planets.slice(0, 12).forEach((planet, index) => {
        const isMain = index === 0;
        const planetTitle = isMain ? 'Main' : `Colonia ${index}`;
        const planetImg = isMain ? 'Main.png' : colonyColors[(index - 1) % colonyColors.length];
        
        // Lógica de imágenes de bases
        let baseImg = 'assets/bases/starbase_colony_1to3.png';
        if (isMain) {
            const level = Math.max(4, Math.min(9, planet.HQLevel));
            baseImg = `assets/bases/starbase_${level}.png`;
        } else {
            if (planet.HQLevel > 3 && planet.HQLevel <= 5) baseImg = 'assets/bases/starbase_colony_4to5.png';
            else if (planet.HQLevel > 5) baseImg = 'assets/bases/starbase_colony_6to9.png';
        }

        const card = document.createElement('div');
        card.className = 'planet-card';
        card.innerHTML = `
            <button class="add-coord-planet-btn" title="Añadir coordenadas">+</button>
            <div style="margin-bottom: 10px; color: #FFD700;">${planetTitle} (HQ ${planet.HQLevel})</div>
            <div class="planet-visual">
                <img class="planet-bg" src="assets/planets/${planetImg}" alt="Planeta">
                <img class="base-img" src="${baseImg}" alt="Base">
            </div>
        `;

        // Evento para el botón '+'
        card.querySelector('.add-coord-planet-btn').addEventListener('click', () => {
            document.getElementById('addCoordTargetInfo').innerText = `Jugador: ${player.Name} | Planeta: ${planetTitle}`;
            openModal('modalAddCoord');
        });

        grid.appendChild(card);
    });

    navigate('view-player-detail');
}

async function loadAllianceView(allianceName) {
    const alliance = await api.getAlliance(allianceName);
    if (!alliance) return alert("No se pudo cargar la alianza.");

    document.getElementById('allianceTitle').innerText = `Alianza: ${alliance.Name} (Nivel ${alliance.Level})`;
    const list = document.getElementById('allianceList');
    list.innerHTML = '';

    // Renderizar miembros en horizontal (Mockup visual adaptable)
    alliance.Members.forEach(member => {
        const item = document.createElement('div');
        item.style = "display: flex; align-items: center; gap: 20px; background: rgba(0,0,0,0.5); padding: 15px; margin-bottom: 15px; border: 1px solid #1a5b75; border-radius: 8px; overflow-x: auto;";
        
        // Perfil a la izquierda
        item.innerHTML = `
            <div style="min-width: 150px; text-align: center; border-right: 1px solid #1a5b75; padding-right: 15px;">
                <h4 style="margin: 0; color: #00d2ff;">${member.Name}</h4>
                <small style="color: #aaa;">Rol: ${member.Role}</small>
            </div>
            <div style="display: flex; gap: 15px; padding-bottom: 5px;">
                <!-- Aquí idealmente se inyectan los planetas, requiriendo un fetch por jugador -->
                <button class="action-btn" style="width: auto;" onclick="loadPlayerView('${member.Name}')">Ver Planetas y Coordenadas</button>
            </div>
        `;
        list.appendChild(item);
    });

    navigate('view-alliance-detail');
    closeModal('modalGetCoords');
}

// ==========================================
// MODALES Y EVENTOS
// ==========================================
function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
}

function setupEventListeners() {
    getCoordsMenuBtn.addEventListener('click', () => {
        openModal('modalGetCoords');
    });

    document.getElementById('btnFetchCoords').addEventListener('click', () => {
        const type = document.getElementById('getCoordsType').value;
        const name = document.getElementById('getCoordsInput').value.trim();
        
        if (!name) return;

        if (type === 'alliance') {
            loadAllianceView(name);
        } else {
            loadPlayerView(name);
            closeModal('modalGetCoords');
        }
    });

    // Simulación de guardado en Google Sheets
    document.getElementById('btnSaveCoord').addEventListener('click', () => {
        const x = document.getElementById('coordX').value;
        const y = document.getElementById('coordY').value;
        const target = document.getElementById('addCoordTargetInfo').innerText;
        
        if(!x || !y) return alert("Por favor ingresa X e Y");
        
        console.log(`Guardando en Google Sheets -> ${target} | X: ${x}, Y: ${y}`);
        alert("Coordenada enviada a Google Sheets exitosamente.");
        closeModal('modalAddCoord');
        document.getElementById('coordX').value = '';
        document.getElementById('coordY').value = '';
    });
}

// ==========================================
// CHART.JS (Gráfico de Bases)
// ==========================================
function initChart() {
    const ctx = document.getElementById('basesChart').getContext('2d');
    
    // Datos de ejemplo para las barras (SB4 a SB9)
    const data = [120, 150, 90, 60, 30, 10]; 

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['SB4', 'SB5', 'SB6', 'SB7', 'SB8', 'SB9'],
            datasets: [{
                label: 'Cantidad de Bases Registradas',
                data: data,
                backgroundColor: 'rgba(0, 210, 255, 0.6)',
                borderColor: '#00d2ff',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } },
                x: { grid: { display: false }, ticks: { display: false } } // Ocultamos texto en X para poner las imágenes debajo en el HTML
            }
        }
    });
}

// ==========================================
// PANZOOM (Mapa de la Galaxia)
// ==========================================
function initMap() {
    const elem = document.getElementById('galaxyMap');
    const panzoom = Panzoom(elem, {
        maxScale: 3,
        minScale: 0.3,
        startScale: 0.5,
        cursor: 'grab'
    });

    elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

    setTimeout(() => panzoom.pan(-1000, -1000), 100);
}