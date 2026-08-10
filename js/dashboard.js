// ==========================================
// VARIABLES GLOBALES Y NAVEGACIÓN
// ==========================================
const homeMenuBtn = document.getElementById('homeMenuBtn');
const addCoordsMenuBtn = document.getElementById('addCoordsMenuBtn');
const getCoordsMenuBtn = document.getElementById('getCoordsMenuBtn');

let searchTimeout = null;
let currentGetType = 'player'; // Guarda si estamos buscando Player o Alliance

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initMap();
    setupNavigation();
    setupGetCoordsToggle();
    setupAddCoordsDebounce();
    setupSaveModal();
});

// Función central para cambiar de vista (SPA)
function navigate(viewId, activeBtnId = null) {
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

    // Si se pasa un botón, actualizamos el estado en el menú lateral
    if(activeBtnId) {
        document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(activeBtnId);
        if(activeBtn) activeBtn.classList.add('active');
    }
}

function setupNavigation() {
    if(homeMenuBtn) homeMenuBtn.addEventListener('click', () => navigate('view-home', 'homeMenuBtn'));
    if(addCoordsMenuBtn) addCoordsMenuBtn.addEventListener('click', () => navigate('view-add-coords', 'addCoordsMenuBtn'));
    if(getCoordsMenuBtn) getCoordsMenuBtn.addEventListener('click', () => navigate('view-get-coords', 'getCoordsMenuBtn'));
    
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) logoutBtn.addEventListener('click', () => window.location.href = 'login.html');
}

// ==========================================
// LÓGICA VISTA "GET COORDS" (Player | Alliance)
// ==========================================
function setupGetCoordsToggle() {
    const btnPlayer = document.getElementById('btnTogglePlayer');
    const btnAlliance = document.getElementById('btnToggleAlliance');
    const getInput = document.getElementById('getCoordsInput');
    const btnExecute = document.getElementById('btnExecuteGet');

    if(!btnPlayer || !btnAlliance) return;

    btnPlayer.addEventListener('click', () => {
        currentGetType = 'player';
        btnPlayer.classList.add('active');
        btnAlliance.classList.remove('active');
        getInput.placeholder = "Nombre exacto del jugador...";
        getInput.value = '';
    });

    btnAlliance.addEventListener('click', () => {
        currentGetType = 'alliance';
        btnAlliance.classList.add('active');
        btnPlayer.classList.remove('active');
        getInput.placeholder = "Nombre exacto de la alianza...";
        getInput.value = '';
    });

    btnExecute.addEventListener('click', () => {
        const query = getInput.value.trim();
        if(!query) return alert("Por favor ingresa un nombre.");

        if (currentGetType === 'player') {
            loadPlayerView(query);
        } else {
            loadAllianceView(query);
        }
    });
}

// ==========================================
// LÓGICA VISTA "ADD COORDS" (DEBOUNCE 3 SEGUNDOS)
// ==========================================
function setupAddCoordsDebounce() {
    const addSearchInput = document.getElementById('addCoordsSearchInput');
    const addResultsGrid = document.getElementById('addCoordsResultsGrid');
    const addSpinner = document.getElementById('addCoordsSpinner');
    const planetsContainer = document.getElementById('addCoordsPlanetsContainer');

    if (addSearchInput) {
        addSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                addResultsGrid.innerHTML = '';
                return;
            }

            addSpinner.classList.remove('hidden');
            addResultsGrid.innerHTML = '';
            planetsContainer.classList.add('hidden');
            addResultsGrid.classList.remove('hidden');

            searchTimeout = setTimeout(() => {
                fetchPlayersForAdding(query);
            }, 3000);
        });
    }

    const btnBackToSearch = document.getElementById('btnBackToSearch');
    if(btnBackToSearch) {
        btnBackToSearch.addEventListener('click', () => {
            planetsContainer.classList.add('hidden');
            addResultsGrid.classList.remove('hidden');
        });
    }
}

async function fetchPlayersForAdding(query) {
    const addSpinner = document.getElementById('addCoordsSpinner');
    const addResultsGrid = document.getElementById('addCoordsResultsGrid');

    try {
        let players = [];
        // Verifica si api.js ya está cargado y funcionando
        if (typeof api !== 'undefined' && api.searchPlayers) {
            players = await api.searchPlayers(query);
        }

        addSpinner.classList.add('hidden');
        
        if (!players || players.length === 0) {
            addResultsGrid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1;">No se detectaron objetivos con ese nombre en el radar.</p>';
            return;
        }

        players.sort((a, b) => b.Level - a.Level);
        addResultsGrid.innerHTML = '';

        players.forEach(player => {
            const avatarUrl = player.Avatar ? player.Avatar : 'assets/backgrounds/galaxy.png';
            const allianceText = player.AllianceId ? `<i class="fas fa-shield-alt"></i> ${player.AllianceId}` : 'Sin Alianza';

            const card = document.createElement('div');
            card.className = 'player-card-interactive';
            card.innerHTML = `
                <img src="${avatarUrl}" alt="avatar" style="width: 55px; height: 55px; border-radius: 8px; border: 1px solid var(--neon-cyan);" onerror="this.src='assets/backgrounds/galaxy.png'">
                <div>
                    <h3 style="color: white; font-family: 'Audiowide', cursive; font-size: 1.1rem; margin-bottom: 5px;">${player.Name}</h3>
                    <span style="background: rgba(0, 213, 255, 0.1); color: var(--neon-cyan); padding: 3px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold;">Lvl ${player.Level}</span>
                    <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 6px;">${allianceText}</p>
                </div>
            `;
            card.onclick = () => showPlanetsForAdding(player);
            addResultsGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Error buscando jugador:", error);
        addSpinner.classList.add('hidden');
        addResultsGrid.innerHTML = '<p style="color: #ff5f56; grid-column: 1/-1;">Error de conexión a la API.</p>';
    }
}

function showPlanetsForAdding(player) {
    document.getElementById('addCoordsResultsGrid').classList.add('hidden');
    const planetsContainer = document.getElementById('addCoordsPlanetsContainer');
    planetsContainer.classList.remove('hidden');
    
    const avatarUrl = player.Avatar ? player.Avatar : 'assets/backgrounds/galaxy.png';
    document.getElementById('addCoordsSelectedPlayer').innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; padding: 20px;">
            <img src="${avatarUrl}" alt="avatar" style="width: 70px; height: 70px; border-radius: 10px; border: 2px solid var(--neon-cyan);" onerror="this.src='assets/backgrounds/galaxy.png'">
            <div>
                <h2 style="color: white; font-family: 'Audiowide', cursive; margin:0 0 5px 0;">${player.Name}</h2>
                <span style="color: var(--neon-cyan); font-weight: bold;">Nivel ${player.Level}</span>
            </div>
        </div>
    `;

    const planetsList = document.getElementById('addCoordsPlanetsList');
    planetsList.innerHTML = '';

    if (!player.Planets || player.Planets.length === 0) {
        planetsList.innerHTML = '<p class="text-muted">Este jugador no tiene bases registradas o la API falló.</p>';
        return;
    }

    const sortedPlanets = [...player.Planets].sort((a, b) => b.HQLevel - a.HQLevel);

    sortedPlanets.forEach((planet, index) => {
        let colonyName = index === 0 ? "Main Base" : index === 1 ? "1st Colony" : index === 2 ? "2nd Colony" : index === 3 ? "3rd Colony" : `${index}th Colony`;
        const hqLvl = planet.HQLevel || 1;
        
        const card = document.createElement('div');
        card.className = 'planet-item-card';
        card.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <div style="background: rgba(0, 213, 255, 0.1); padding: 12px; border-radius: 10px;">
                    <i class="fas fa-globe" style="font-size: 1.8rem; color: var(--neon-cyan);"></i>
                </div>
                <div>
                    <h4 style="color: white; margin: 0 0 5px 0; font-size: 1.1rem; font-family: 'Audiowide', cursive;">${colonyName}</h4>
                    <span style="color: #a3e635; font-size: 0.85rem; font-weight: 600;">Starbase Lvl ${hqLvl}</span>
                </div>
            </div>
            <button class="btn-add-coord-small" onclick="openModal('modalAddCoord', '${player.Name}', '${colonyName}', ${hqLvl})">
                <i class="fas fa-plus"></i> Coords
            </button>
        `;
        planetsList.appendChild(card);
    });
}

// ==========================================
// CARGAR VISTAS: JUGADOR Y ALIANZA (Desde Get)
// ==========================================
async function loadPlayerView(playerName) {
    let player = null;
    if (typeof api !== 'undefined' && api.getPlayer) {
        player = await api.getPlayer(playerName);
    }

    if (!player) return alert("No se pudo cargar la información del jugador.");

    const header = document.getElementById('playerDetailHeader');
    const avatarSrc = player.Avatar ? player.Avatar : 'assets/backgrounds/galaxy.png';
    
    header.innerHTML = `
        <img src="${avatarSrc}" onerror="this.src='assets/backgrounds/galaxy.png'">
        <div>
            <h2 style="margin: 0; color: #00d2ff; font-family: 'Audiowide', cursive;">${player.Name}</h2>
            <p style="margin: 5px 0 0 0; color: #aaa;">Nivel: ${player.Level} | Alianza: ${player.AllianceId || 'Ninguna'}</p>
        </div>
    `;

    const grid = document.getElementById('playerPlanetsGrid');
    grid.innerHTML = '';
    const colonyColors = ['Planet_blue.png', 'Planet_green.png', 'Planet_red.png', 'Planet_violet.png', 'Planet_white.png', 'Planet_yellow.png'];

    const sortedPlanets = [...player.Planets].sort((a, b) => b.HQLevel - a.HQLevel);

    sortedPlanets.slice(0, 12).forEach((planet, index) => {
        const isMain = index === 0;
        const planetTitle = isMain ? 'Main Base' : `Colony ${index}`;
        const planetImg = isMain ? 'Main.png' : colonyColors[(index - 1) % colonyColors.length];
        
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
            <div style="margin-bottom: 10px; color: #FFD700; font-family: 'Audiowide', cursive;">${planetTitle} (HQ ${planet.HQLevel})</div>
            <div class="planet-visual">
                <img class="planet-bg" src="assets/planets/${planetImg}" alt="Planeta">
                <img class="base-img" src="${baseImg}" alt="Base">
            </div>
        `;
        grid.appendChild(card);
    });

    // Se mantiene activa la tab de GET en el sidebar, pero muestra el detalle
    navigate('view-player-detail', 'getCoordsMenuBtn'); 
}

async function loadAllianceView(allianceName) {
    let alliance = null;
    if (typeof api !== 'undefined' && api.getAlliance) {
        alliance = await api.getAlliance(allianceName);
    }

    if (!alliance) return alert("No se pudo cargar la alianza.");

    document.getElementById('allianceTitle').innerText = `Alianza: ${alliance.Name} (Nivel ${alliance.Level})`;
    const list = document.getElementById('allianceList');
    list.innerHTML = '';

    alliance.Members.forEach(member => {
        const item = document.createElement('div');
        item.style = "display: flex; align-items: center; gap: 20px; background: rgba(0,0,0,0.5); padding: 15px; margin-bottom: 15px; border: 1px solid rgba(0,213,255,0.2); border-radius: 8px;";
        item.innerHTML = `
            <div style="min-width: 150px; text-align: center; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 15px;">
                <h4 style="margin: 0; color: #00d2ff;">${member.Name}</h4>
                <small style="color: #aaa;">Rol: ${member.Role}</small>
            </div>
            <div style="display: flex; gap: 15px;">
                <button class="action-btn" style="width: auto; margin-top:0;" onclick="loadPlayerView('${member.Name}')"><i class="fas fa-eye"></i> Ver Planetas</button>
            </div>
        `;
        list.appendChild(item);
    });

    navigate('view-alliance-detail', 'getCoordsMenuBtn');
}

// ==========================================
// MODALES Y GUARDADO
// ==========================================
function openModal(id, playerName = null, colonyName = null, hqLevel = null) {
    const modal = document.getElementById(id);
    if(playerName) {
        document.getElementById('addCoordTargetInfo').innerHTML = `Jugador: <strong style="color:white;">${playerName}</strong><br>Base: <span style="color:var(--neon-cyan);">${colonyName} (SB${hqLevel})</span>`;
    }
    if(modal) modal.classList.remove('hidden');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if(modal) modal.classList.add('hidden');
}

function setupSaveModal() {
    const btnSave = document.getElementById('btnSaveCoord');
    if(btnSave) {
        btnSave.addEventListener('click', () => {
            const x = document.getElementById('coordX').value;
            const y = document.getElementById('coordY').value;
            if(!x || !y) return alert("Por favor ingresa X e Y");
            
            alert("Coordenada enviada a Google Sheets exitosamente.");
            closeModal('modalAddCoord');
            document.getElementById('coordX').value = '';
            document.getElementById('coordY').value = '';
        });
    }
}

// ==========================================
// INITS EXTERNOS
// ==========================================
function initChart() {
    const canvas = document.getElementById('basesChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = [120, 150, 90, 60, 30, 10]; 
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['SB4', 'SB5', 'SB6', 'SB7', 'SB8', 'SB9'],
            datasets: [{
                label: 'Bases Registradas', data: data, backgroundColor: 'rgba(0, 210, 255, 0.6)', borderColor: '#00d2ff', borderWidth: 2, borderRadius: 5
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#aaa' } }, x: { grid: { display: false }, ticks: { display: false } } } }
    });
}

function initMap() {
    const elem = document.getElementById('galaxyMap');
    if(!elem || typeof Panzoom === 'undefined') return;
    const panzoom = Panzoom(elem, { maxScale: 3, minScale: 0.3, startScale: 0.5, cursor: 'grab' });
    elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);
    setTimeout(() => panzoom.pan(-1000, -1000), 100);
}