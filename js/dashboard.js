// CONSTANTES Y RECURSOS OFICIALES
const DEFAULT_AVATAR = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Favatars.phoenixnetwork.net%2Fdefault.png&w=128&q=75";
const LEVEL_ICON = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Ficon_level.png&w=32&q=75";
const LEVEL_ICON_ALLIANCE = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Ficon_allianceLevel.png&w=32&q=75"
const STARBASE_ICON = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstarbase.png&w=64&q=75";

// VARIABLES GLOBALES Y NAVEGACIÓN
const homeMenuBtn = document.getElementById("homeMenuBtn");
const addCoordsMenuBtn = document.getElementById("addCoordsMenuBtn");
const getCoordsMenuBtn = document.getElementById("getCoordsMenuBtn");

let searchTimeout = null;
let currentGetType = "player";

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    initChart();
    initMap();
    setupNavigation();
    setupGetCoordsToggle();
    setupAddCoordsDebounce();
    setupSaveModal();
    setupMobileMenu();
});

// Función central para cambiar de vista (SPA)
// Función central para cambiar de vista (SPA)
function navigate(viewId, activeBtnId = null) {
    document.querySelectorAll(".view-section").forEach(section => {
        section.classList.add("hidden");
        section.classList.remove("active");
    });

    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove("hidden");
        target.classList.add("active");
    }

    if (activeBtnId) {
        document.querySelectorAll(".sidebar-btn").forEach(btn => btn.classList.remove("active"));
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) activeBtn.classList.add("active");
    }

    // ==========================================
    // METAMORFOSIS DEL LOGO MÓVIL (APP HEADER)
    // ==========================================
    const mobileLogo = document.getElementById("mobileLogo");
    if (mobileLogo) {
        // Si entramos a ver los STATS de un jugador o una alianza
        if (viewId === "view-player-detail" || viewId === "view-alliance-detail") {
            mobileLogo.classList.add("is-back-btn");
            mobileLogo.innerHTML = `<i class="fas fa-arrow-left"></i> <span>Volver</span>`;
            
            // Su nueva función será regresar al Get Coords
            mobileLogo.onclick = () => {
                navigate("view-get-coords", "getCoordsMenuBtn");
            };
        } 
        // Si estamos en cualquier otra pestaña normal (Home, Add, Get)
        else {
            mobileLogo.classList.remove("is-back-btn");
            mobileLogo.innerHTML = `
                <img src="https://cdn.discordapp.com/avatars/1297733983169417216/742eb2a97534c732c9efd5e9019e9aae.png?size=64" alt="BuddyBot">
                <span>BuddyBot</span>
            `;
            mobileLogo.onclick = null; // Pierde la acción de clic
        }
    }
}

function setupNavigation() {
    if (homeMenuBtn) homeMenuBtn.addEventListener("click", () => navigate("view-home", "homeMenuBtn"));
    if (addCoordsMenuBtn) addCoordsMenuBtn.addEventListener("click", () => navigate("view-add-coords", "addCoordsMenuBtn"));
    if (getCoordsMenuBtn) getCoordsMenuBtn.addEventListener("click", () => navigate("view-get-coords", "getCoordsMenuBtn"));

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => window.location.href = "login.html");
}   

// LÓGICA VISTA "GET COORDS" (Spotlight + Debounce)
let getSearchTimeout = null;

function setupGetCoordsToggle() {
    const btnPlayer = document.getElementById("btnTogglePlayer");
    const btnAlliance = document.getElementById("btnToggleAlliance");
    const getInput = document.getElementById("getCoordsInput");

    const overlay = document.getElementById("spotlightOverlay");
    const wrapper = document.getElementById("spotlightWrapper");
    const statusBox = document.getElementById("spotlightStatus");
    const statusText = document.getElementById("spotlightText");
    const resultsGrid = document.getElementById("getCoordsResultsGrid");

    if (!btnPlayer || !btnAlliance || !getInput) return;

    // BOTONES MODO PLAYER / ALLIANCE
    btnPlayer.addEventListener("click", () => {
        currentGetType = "player";
        btnPlayer.classList.add("active");
        btnAlliance.classList.remove("active");
        getInput.placeholder = "Nombre exacto del jugador...";
        resetSpotlight(getInput, resultsGrid, statusBox, statusText);
    });

    btnAlliance.addEventListener("click", () => {
        currentGetType = "alliance";
        btnAlliance.classList.add("active");
        btnPlayer.classList.remove("active");
        getInput.placeholder = "Nombre exacto de la alianza...";
        resetSpotlight(getInput, resultsGrid, statusBox, statusText);
    });

    // ACTIVAR SPOTLIGHT AL HACER CLIC EN EL BUSCADOR
    getInput.addEventListener("focus", () => {
        overlay.classList.remove("hidden");
        setTimeout(() => overlay.classList.add("active"), 10);
        wrapper.classList.add("active");

        if (getInput.value.trim() === "") {
            statusBox.classList.remove("hidden");
            statusText.innerText = "Escribe para iniciar el escaneo del radar...";
            resultsGrid.classList.add("hidden");
        }
    });

    // CERRAR SPOTLIGHT AL HACER CLIC FUERA DEL RECUADRO
    overlay.addEventListener("click", () => {
        closeSpotlight(overlay, wrapper);
    });

    // ===================================================
    // BÚSQUEDA EN VIVO (DEBOUNCE 3S + SKELETON LOADING)
    // ===================================================
    getInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        clearTimeout(getSearchTimeout);

        if (query.length < 2) {
            resultsGrid.classList.add("hidden");
            resultsGrid.innerHTML = "";
            statusBox.classList.remove("hidden");
            statusText.innerText = "Escribe para iniciar el escaneo del radar...";
            return;
        }

        // 1. Ocultar Starling
        statusBox.classList.add("hidden");
        
        // 2. Mostrar la grilla
        resultsGrid.classList.remove("hidden");

        // 3. Inyectar "Skeleton Cards" (Tarjetas fantasma cargando)
        resultsGrid.innerHTML = Array(8).fill(`
            <div class="player-card-interactive" style="pointer-events: none; cursor: default;">
                <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <div class="skeleton-avatar"></div>
                    <div style="display: flex; flex-direction: column; justify-content: center; flex: 1; gap: 10px;">
                        <div class="skeleton-line" style="width: 60%; height: 16px;"></div>
                        <div style="display: flex; gap: 10px;">
                            <div class="skeleton-line" style="width: 35%; height: 14px;"></div>
                            <div class="skeleton-line" style="width: 25%; height: 14px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // 4. Iniciar conteo de 3 segundos para buscar en la API
        getSearchTimeout = setTimeout(() => {
            fetchGetCoordsLive(query);
        }, 3000);
    });
}

function resetSpotlight(input, grid, statusBox, statusText) {
    input.value = "";
    grid.innerHTML = "";
    grid.classList.add("hidden");
    statusBox.classList.remove("hidden");
    statusText.innerText = "Escribe para iniciar el escaneo del radar...";
}

function closeSpotlight(overlay, wrapper) {
    overlay.classList.remove("active");
    setTimeout(() => overlay.classList.add("hidden"), 300);
    wrapper.classList.remove("active");
}

// BÚSQUEDA A LA API EN VIVO PARA GET COORDS
async function fetchGetCoordsLive(query) {
    const statusBox = document.getElementById("spotlightStatus");
    const statusText = document.getElementById("spotlightText");
    const resultsGrid = document.getElementById("getCoordsResultsGrid");
    const overlay = document.getElementById("spotlightOverlay");
    const wrapper = document.getElementById("spotlightWrapper");

    try {
        let results = [];
        
        // 1. Busca usando api.js
        if (currentGetType === "player") {
            if (typeof api !== "undefined" && api.searchPlayers) {
                results = await api.searchPlayers(query);
            }
        } else {
            if (typeof api !== "undefined" && api.searchAlliances) {
                results = await api.searchAlliances(query);
            }
        }

        if (!results || results.length === 0) {
            statusBox.classList.remove("hidden");
            statusText.innerText = "No se encontraron objetivos con ese nombre.";
            resultsGrid.classList.add("hidden");
            return;
        }

        // Ocultar Starling, mostrar resultados
        statusBox.classList.add("hidden");
        resultsGrid.innerHTML = "";
        resultsGrid.classList.remove("hidden");

        // RENDERIZAR JUGADORES
        if (currentGetType === "player") {
            results.sort((a, b) => (b.Level || 0) - (a.Level || 0));
            
            results.forEach(player => {
                const avatarUrl = player.Avatar ? player.Avatar : DEFAULT_AVATAR;
                const allianceText = player.AllianceId 
                    ? `<span style="display: flex; align-items: center; gap: 5px; color:#a1a1aa; font-size:0.85rem; text-transform: capitalize;">
                        <i class="fas fa-shield-alt"></i> ${player.AllianceId}
                    </span>` 
                    : "";

                const card = document.createElement("div");
                card.className = "player-card-interactive";

                // NUEVO CONTENEDOR: Agrupa avatar y estadísticas
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                        <img src="${avatarUrl}" alt="Avatar" style="width:55px; height:55px; border-radius:8px; border:1px solid #d8fdfc; object-fit:cover; flex-shrink: 0;" onerror="this.src='${DEFAULT_AVATAR}'">
                        <div style="display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0;">
                            <h3 style="color:white; font-family:'Nasalization', sans-serif; font-size:1.1rem; margin:0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.Name || "Jugador"}</h3>
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                
                                <!-- NIVEL ALINEADO, SIN FONDO Y CON FUENTE NASALIZATION -->
                                <span style="display: flex; align-items: center; gap: 5px; color: #00d5ff; font-size: 0.9rem; font-family: 'Nasalization', sans-serif;">
                                    <img src="${LEVEL_ICON}" style="width:14px; object-fit: contain;"> ${player.Level || 0}
                                </span>
                                
                                <!-- TEXTO DE ALIANZA (Solo se renderiza si tiene alianza) -->
                                ${allianceText}
                                
                            </div>
                        </div>
                    </div>
                `;
                
                // Acción al dar click
                card.addEventListener("click", () => {
                    closeSpotlight(overlay, wrapper);
                    document.getElementById("getCoordsInput").value = player.Name;
                    loadPlayerView(player.Name);
                });
                resultsGrid.appendChild(card);
            });
        } 
        // RENDERIZAR ALIANZAS
        else {
            results.sort((a, b) => (b.AllianceLevel || 0) - (a.AllianceLevel || 0));
            
            results.forEach(alliance => {
                let logoUrl = "https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_1_1_1.png";
                if (alliance.Emblem) {
                    logoUrl = `https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_${alliance.Emblem.Shape}_${alliance.Emblem.Pattern}_${alliance.Emblem.Icon}.png`;
                }

                const card = document.createElement("div");
                card.className = "player-card-interactive";
                
                // INYECCIÓN TÁCTICA: Cambiamos el fondo para que use su PROPIO LOGO
                card.style.setProperty("--bg-watermark", `url('${logoUrl}')`);
                
                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                        <img src="${logoUrl}" alt="Logo" style="width:55px; height:55px; object-fit:contain; filter: drop-shadow(0 0 5px rgba(0, 213, 255, 0.4)); flex-shrink: 0;">
                        <div style="display: flex; flex-direction: column; justify-content: center; flex: 1; min-width: 0;">
                            <h3 style="color:white; font-family:'Nasalization', sans-serif; font-size:1.1rem; margin:0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${alliance.Name || "Alianza"}</h3>
                            <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                                
                                <!-- NIVEL ALINEADO Y SIN FONDO AZUL -->
                                <span style="display: flex; align-items: center; gap: 5px; color: #ffd900; font-size: 0.85rem; font-weight: bold;">
                                    <img src="${LEVEL_ICON_ALLIANCE}" style="width:14px; object-fit: contain;"> ${alliance.AllianceLevel || 0}
                                </span>
                                
                                <!-- MIEMBROS ALINEADOS -->
                                <span style="display: flex; align-items: center; gap: 5px; color:#a1a1aa; font-size:0.85rem;">
                                    <i class="fas fa-users"></i> ${alliance.Members ? alliance.Members.length : "?"}
                                </span>
                                
                            </div>
                        </div>
                    </div>
                `;
                
                // Acción al dar click
                card.addEventListener("click", () => {
                    closeSpotlight(overlay, wrapper);
                    document.getElementById("getCoordsInput").value = alliance.Name;
                    loadAllianceView(alliance.Name);
                });
                resultsGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error("Error buscando:", error);
        statusBox.classList.remove("hidden");
        statusText.innerText = "Error de conexión a la API.";
    }
}

// ==========================================
// LÓGICA VISTA "ADD COORDS" (DEBOUNCE 3 SEGUNDOS)
// ==========================================
function setupAddCoordsDebounce() {
    const addSearchInput = document.getElementById("addCoordsSearchInput");
    const addResultsGrid = document.getElementById("addCoordsResultsGrid");
    const addSpinner = document.getElementById("addCoordsSpinner");
    const planetsContainer = document.getElementById("addCoordsPlanetsContainer");

    if (addSearchInput) {
        addSearchInput.addEventListener("input", event => {
            const query = event.target.value.trim();
            clearTimeout(searchTimeout);

            if (query.length < 2) {
                addResultsGrid.innerHTML = "";
                if (addSpinner) addSpinner.classList.add("hidden");
                return;
            }

            if (addSpinner) addSpinner.classList.remove("hidden");
            addResultsGrid.innerHTML = "";
            planetsContainer.classList.add("hidden");
            addResultsGrid.classList.remove("hidden");

            searchTimeout = setTimeout(() => {
                fetchPlayersForAdding(query);
            }, 3000);
        });
    }

    const btnBackToSearch = document.getElementById("btnBackToSearch");
    if (btnBackToSearch) {
        btnBackToSearch.addEventListener("click", () => {
            planetsContainer.classList.add("hidden");
            addResultsGrid.classList.remove("hidden");
        });
    }
}

async function fetchPlayersForAdding(query) {
    const addSpinner = document.getElementById("addCoordsSpinner");
    const addResultsGrid = document.getElementById("addCoordsResultsGrid");

    try {
        let players = [];
        if (typeof api !== "undefined" && api.searchPlayers) {
            players = await api.searchPlayers(query);
        }

        if (addSpinner) addSpinner.classList.add("hidden");

        if (!players || players.length === 0) {
            addResultsGrid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1;">No se detectaron objetivos con ese nombre en el radar.</p>`;
            return;
        }

        players.sort((a, b) => (b.Level || 0) - (a.Level || 0));
        addResultsGrid.innerHTML = "";

        players.forEach(player => {
            const avatarUrl = player.Avatar || DEFAULT_AVATAR;
            const allianceText = player.AllianceId ? `<i class="fas fa-shield-alt"></i> ${player.AllianceId}` : "Sin Alianza";
            const card = document.createElement("div");
            card.className = "player-card-interactive";
            card.innerHTML = `
                <img src="${avatarUrl}" alt="Avatar" style="width:55px; height:55px; border-radius:8px; border:1px solid #00d5ff; object-fit:cover;" onerror="this.src='${DEFAULT_AVATAR}'">
                <div>
                    <h3 style="color:white; font-family:'Audiowide', cursive; font-size:1.1rem; margin-bottom:5px;">${player.Name || "Jugador"}</h3>
                    <span style="background:rgba(0,213,255,0.1); color:#00d5ff; padding:3px 8px; border-radius:12px; font-size:0.8rem; font-weight:bold; display:inline-flex; align-items:center; gap:5px;">
                        <img src="${LEVEL_ICON}" style="width:14px;"> Lvl ${player.Level || 0}
                    </span>
                    <p style="color:#a1a1aa; font-size:0.8rem; margin-top:6px;">${allianceText}</p>
                </div>
            `;
            card.addEventListener("click", () => {
                document.getElementById("addCoordsResultsGrid").classList.add("hidden");
                document.getElementById("addCoordsPlanetsContainer").classList.remove("hidden");
                document.getElementById("addCoordsSelectedPlayer").innerHTML = buildPlayerHeaderHtml(player);
                renderPlanetsGrid(player, "addCoordsPlanetsList");

                // Metamorfosis móvil para Add Coords
                const mobileLogo = document.getElementById("mobileLogo");
                if (mobileLogo && window.innerWidth <= 900) {
                    mobileLogo.classList.add("is-back-btn");
                    mobileLogo.innerHTML = `<i class="fas fa-arrow-left"></i> <span>Volver</span>`;
                    mobileLogo.onclick = () => {
                        document.getElementById("addCoordsPlanetsContainer").classList.add("hidden");
                        document.getElementById("addCoordsResultsGrid").classList.remove("hidden");
                        
                        // Restaurar Logo
                        mobileLogo.classList.remove("is-back-btn");
                        mobileLogo.innerHTML = `<img src="https://cdn.discordapp.com/avatars/1297733983169417216/742eb2a97534c732c9efd5e9019e9aae.png?size=64" alt="BuddyBot"> <span>BuddyBot</span>`;
                        mobileLogo.onclick = null;
                    };
                }
            });
            addResultsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error buscando jugador:", error);
        if (addSpinner) addSpinner.classList.add("hidden");
        addResultsGrid.innerHTML = `<p style="color:#ff5f56; grid-column:1/-1;">Error de conexión a la API.</p>`;
    }
}

function buildPlayerHeaderHtml(player) {
    const avatarUrl = player.Avatar || DEFAULT_AVATAR;
    return `
        <div style="display:flex; align-items:center; gap:20px; padding:20px;">
            <img src="${avatarUrl}" alt="Avatar" style="width:80px; height:80px; border-radius:12px; border:2px solid #00d5ff; object-fit:cover;" onerror="this.src='${DEFAULT_AVATAR}'">
            <div>
                <h2 style="color:white; font-family:'Audiowide', cursive; font-size:1.8rem; margin:0 0 8px 0;">${player.Name || "Jugador"}</h2>
                <div style="display:flex; align-items:center; gap:15px;">
                    <span style="color:white; font-weight:bold; display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.1); padding:5px 12px; border-radius:8px;">
                        <img src="${LEVEL_ICON}" style="width:18px;"> Nivel ${player.Level || 0}
                    </span>
                    <span style="color:#a1a1aa;"><i class="fas fa-shield-alt"></i> ${player.AllianceId || "Ninguna"}</span>
                </div>
            </div>
        </div>
    `;
}

function renderPlanetsGrid(player, gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = "";

    if (!player.Planets || player.Planets.length === 0) {
        grid.innerHTML = `<p class="text-muted">Este jugador no tiene bases registradas o la API falló.</p>`;
        return;
    }

    const colonyColors = ["Planet_blue.png", "Planet_green.png", "Planet_red.png", "Planet_violet.png", "Planet_white.png", "Planet_yellow.png"];
    const sortedPlanets = [...player.Planets].sort((a, b) => (b.HQLevel || 0) - (a.HQLevel || 0));

    sortedPlanets.slice(0, 12).forEach((planet, index) => {
        const isMain = index === 0;
        const planetTitle = isMain ? "Main Base" : `Colony ${index}`;
        const hqLvl = planet.HQLevel || 1;
        const randomColor = colonyColors[Math.floor(Math.random() * colonyColors.length)];
        const planetImg = isMain ? "Main.png" : randomColor;
        
        let baseImg = "assets/bases/starbase_colony_1to3.png";
        if (isMain) {
            const level = Math.max(4, Math.min(9, hqLvl));
            baseImg = `assets/bases/starbase_${level}.png`;
        } else {
            if (hqLvl > 3 && hqLvl <= 5) baseImg = "assets/bases/starbase_colony_4to5.png";
            else if (hqLvl > 5) baseImg = "assets/bases/starbase_colony_6to9.png";
        }

        const card = document.createElement("div");
        card.className = "planet-card glass-panel";
        card.addEventListener("click", () => openModal("modalAddCoord", player.Name, planetTitle, hqLvl));

        card.innerHTML = `
            <div style="margin-bottom:15px; color:#00d5ff; font-family:'Audiowide', cursive; font-size:1.1rem; letter-spacing:1px;">${planetTitle}</div>
            <div class="planet-visual">
                <img src="assets/planets/${planetImg}" alt="Planeta" class="planet-bg">
                <img src="${baseImg}" alt="Base" class="base-img">
                <div style="position:absolute; top:-10px; right:-10px; background:rgba(0,0,0,0.8); border:2px solid #c80ab4; color:white; font-family:'Audiowide', cursive; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px #c80ab4; z-index:10; font-size:0.9rem;">${hqLvl}</div>
            </div>
            <div style="margin-top:25px; font-size:0.85rem; color:#a1a1aa; background:rgba(255,255,255,0.05); padding:8px; border-radius:8px;">
                <i class="fas fa-crosshairs"></i> Clic para añadir
            </div>
        `;
        grid.appendChild(card);
    });
}

// ==========================================
// CARGAR PERFIL DE JUGADOR (ELITE REESTRUCTURADO)
// ==========================================
async function loadPlayerView(playerName) {

    // 1. Obtener Elementos del DOM de la Cartilla
    const epcName = document.getElementById("epcName");
    const epcAvatar = document.getElementById("epcAvatar");
    const epcLevelTxt = document.getElementById("epcLevelTxt");
    const epcId = document.getElementById("epcId");
    const epcFarm = document.getElementById("epcFarm");
    
    const epcAllianceLogo = document.getElementById("epcAllianceLogo");
    const epcAllianceIcon = document.getElementById("epcAllianceIcon");
    const epcAllianceName = document.getElementById("epcAllianceName");
    const epcAllianceStats = document.getElementById("epcAllianceStats");
    const epcAllianceLvl = document.getElementById("epcAllianceLvl");
    const epcAllianceMembers = document.getElementById("epcAllianceMembers");
    const epcAllianceWars = document.getElementById("epcAllianceWars");
    
    const planetsGrid = document.getElementById("playerPlanetsGrid");

    if (!epcName || !planetsGrid) {
        console.error("Faltan IDs del HTML en el Perfil Élite.");
        return;
    }

    // 2. Estado de Carga UI
    epcName.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Cargando...`;
    planetsGrid.innerHTML = "";

    try {
        let player = null;
        if (typeof api !== "undefined" && api.getPlayer) {
            player = await api.getPlayer(playerName);
        }

        if (!player) {
            alert("No se pudo cargar la información del jugador.");
            epcName.innerText = "Error";
            return;
        }

        // 3. Poblar Datos Básicos
        epcName.innerText = player.Name || playerName;
        epcAvatar.src = player.Avatar || DEFAULT_AVATAR;
        epcLevelTxt.innerText = player.Level || 0;
        epcId.innerText = player.Id || "---";

        // 4. Calcular Farm Potencial
        const farmValues = { 1: 100, 2: 200, 3: 300, 4: 400, 5: 600, 6: 1000, 7: 1500, 8: 2000, 9: 2500 };
        let totalFarm = 0;
        if (player.Planets) {
            player.Planets.forEach(planet => {
                const hq = Math.max(1, Math.min(9, planet.HQLevel || 1));
                totalFarm += farmValues[hq] || 0;
            });
        }
        epcFarm.innerText = `+${totalFarm.toLocaleString()}`;

        // 5. Poblar Datos de Alianza
        if (player.AllianceId) {
            epcAllianceName.innerText = "Analizando...";
            epcAllianceStats.classList.add("hidden"); // Ocultar mientras carga
            epcAllianceIcon.className = "fas fa-circle-notch fa-spin epc-alliance-icon";
            epcAllianceLogo.classList.add("hidden");

            try {
                const allianceData = await api.getAlliance(player.AllianceId);
                
                if (allianceData) {
                    epcAllianceName.innerText = allianceData.Name || player.AllianceId;
                    epcAllianceLvl.innerText = allianceData.AllianceLevel || 0;
                    epcAllianceMembers.innerText = allianceData.Members ? allianceData.Members.length : 0;
                    epcAllianceWars.innerText = (allianceData.WarsWon || 0) + (allianceData.WarsLost || 0);
                    
                    // Logo
                    if (allianceData.Emblem) {
                        const { Shape, Pattern, Icon } = allianceData.Emblem;
                        epcAllianceLogo.src = `https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_${Shape}_${Pattern}_${Icon}.png`;
                        epcAllianceLogo.classList.remove("hidden");
                        epcAllianceIcon.classList.add("hidden");
                    } else {
                        epcAllianceIcon.className = "fas fa-shield-alt epc-alliance-icon";
                    }
                    
                    epcAllianceStats.classList.remove("hidden"); // Mostrar stats
                }
            } catch (error) {
                console.error("Error cargando alianza:", error);
                epcAllianceName.innerText = "Error en API";
                epcAllianceIcon.className = "fas fa-exclamation-triangle epc-alliance-icon";
                epcAllianceIcon.style.color = "#ff4c4c";
            }
        } else {
            // Sin Alianza
            epcAllianceName.innerText = "Sin Alianza";
            epcAllianceIcon.className = "fas fa-ghost epc-alliance-icon";
            epcAllianceIcon.style.color = "#a1a1aa";
            epcAllianceIcon.classList.remove("hidden");
            epcAllianceLogo.classList.add("hidden");
            epcAllianceStats.classList.add("hidden"); // Oculta nivel, miembros, wars
        }

        // 6. Generar Grilla de Planetas
        if (!player.Planets || player.Planets.length === 0) {
            planetsGrid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;">Este jugador no tiene bases registradas.</p>`;
        } else {
            const colonyColors = ["Planet_blue.png", "Planet_green.png", "Planet_red.png", "Planet_violet.png", "Planet_white.png", "Planet_yellow.png"];
            const sortedPlanets = [...player.Planets].sort((a, b) => (b.HQLevel || 0) - (a.HQLevel || 0));

            sortedPlanets.slice(0, 24).forEach((planet, index) => {
                const isMain = index === 0;
                let planetTitle = isMain ? "Main Planet" : (index === 1 ? "1st Colony" : index === 2 ? "2nd Colony" : index === 3 ? "3rd Colony" : `${index}th Colony`);
                const hqLvl = planet.HQLevel || 1;
                const planetImg = isMain ? "Main.png" : colonyColors[(index - 1) % colonyColors.length];

                const card = document.createElement("div");
                card.className = "elite-planet-square";
                
                card.innerHTML = `
                    <div class="elite-planet-name">${planetTitle}</div>
                    <div class="elite-planet-img-container">
                        <img src="assets/planets/${planetImg}" alt="Planet">
                    </div>
                    <div class="elite-hq-row">
                        <img src="${STARBASE_ICON}" alt="SB">
                        <span>${hqLvl}</span>
                    </div>
                    <div class="elite-coords-placeholder">x; y</div>
                `;

                // Acción al dar click: COPIAR coordenadas en vez de abrir modal
                card.addEventListener("click", () => {
                    // Más adelante, aquí leeremos la coordenada real de Google Sheets
                    const coordsToCopy = "x; y"; 
                    
                    navigator.clipboard.writeText(coordsToCopy).then(() => {
                        const placeholder = card.querySelector('.elite-coords-placeholder');
                        
                        // Efecto visual de "Copiado"
                        placeholder.innerHTML = `<i class="fas fa-check"></i> ¡Copiado!`;
                        placeholder.style.color = "#a3e635"; // Verde radioactivo
                        placeholder.style.opacity = "1";
                        
                        // Restaurar el texto después de 2 segundos
                        setTimeout(() => {
                            placeholder.innerHTML = "x; y";
                            placeholder.style.color = "#c6fcf3";
                            placeholder.style.opacity = "0.7";
                        }, 2000);
                    }).catch(err => {
                        console.error("Error al copiar al portapapeles:", err);
                    });
                });

                planetsGrid.appendChild(card);
            });
        }

        navigate("view-player-detail", "getCoordsMenuBtn");

    } catch (error) {
        console.error("Error cargando jugador:", error);
        epcName.innerText = "Error Crítico";
    }
}

// ==========================================
// CARGAR ALIANZA (VISTA SEPARADA)
// ==========================================
async function loadAllianceView(allianceName) {
    const title = document.getElementById("allianceTitle");
    const list = document.getElementById("allianceList");
    if (!title || !list) return;

    title.innerHTML = `<i class="fas fa-shield-alt"></i> Alianza: Cargando...`;
    list.innerHTML = `<div class="spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando alianza...</div>`;

    try {
        if (typeof api === "undefined" || !api.getAlliance) throw new Error("api.getAlliance no está disponible");
        
        const alliance = await api.getAlliance(allianceName);
        if (!alliance) {
            title.innerHTML = `<i class="fas fa-shield-alt"></i> Alianza no encontrada`;
            list.innerHTML = `<p class="text-muted">No se encontró información de esta alianza.</p>`;
            navigate("view-alliance-detail", "getCoordsMenuBtn");
            return;
        }

        title.innerHTML = `<i class="fas fa-shield-alt"></i> Alianza: ${alliance.Name || allianceName}`;
        list.innerHTML = "";

        if (alliance.Members && alliance.Members.length > 0) {
            alliance.Members.forEach(member => {
                const card = document.createElement("div");
                card.className = "player-card-interactive";
                card.innerHTML = `
                    <img src="${member.Avatar || DEFAULT_AVATAR}" alt="Avatar" style="width:55px; height:55px; border-radius:8px; object-fit:cover;" onerror="this.src='${DEFAULT_AVATAR}'">
                    <div>
                        <h3 style="color:white; font-family:'Audiowide', cursive; font-size:1rem; margin-bottom:5px;">${member.Name || "Jugador"}</h3>
                        <span style="color:#00d5ff; font-size:0.8rem;">
                            <img src="${LEVEL_ICON}" style="width:14px; vertical-align:middle;"> Nivel ${member.Level || 0}
                        </span>
                    </div>
                `;
                
                list.appendChild(card);
            });
        } else {
            list.innerHTML = `<p class="text-muted">No hay miembros disponibles.</p>`;
        }

        navigate("view-alliance-detail", "getCoordsMenuBtn");
    } catch (error) {
        console.error("Error cargando alianza:", error);
        list.innerHTML = `<p style="color:#ff4c4c;">Error al cargar la información de la alianza.</p>`;
        navigate("view-alliance-detail", "getCoordsMenuBtn");
    }
}

// ==========================================
// MODAL Y GUARDADO
// ==========================================
function openModal(id, playerName = null, colonyName = null, hqLevel = null) {
    const modal = document.getElementById(id);
    if (!modal) return;
    
    if (playerName) {
        const targetInfo = document.getElementById("addCoordTargetInfo");
        if (targetInfo) {
            targetInfo.innerHTML = `Jugador: <strong style="color:white; font-size:1.1rem;">${playerName}</strong><br>Base: <span style="color:#00d5ff; font-weight:bold;">${colonyName} (SB${hqLevel})</span>`;
        }
    }
    modal.classList.remove("hidden");
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("hidden");
}

document.addEventListener("click", event => {
    const modal = document.getElementById("modalAddCoord");
    if (modal && event.target === modal) closeModal("modalAddCoord");
});

function setupSaveModal() {
    const btnSave = document.getElementById("btnSaveCoord");
    if (!btnSave) return;
    
    btnSave.addEventListener("click", () => {
        const x = document.getElementById("coordX").value.trim();
        const y = document.getElementById("coordY").value.trim();
        
        if (!x || !y) return alert("Por favor ingresa X e Y.");

        alert("Coordenada enviada a Google Sheets exitosamente.");
        closeModal("modalAddCoord");
        document.getElementById("coordX").value = "";
        document.getElementById("coordY").value = "";
    });
}

// ==========================================
// CHART.JS Y MAPA
// ==========================================
function initChart() {
    const canvas = document.getElementById("basesChart");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const data = [120, 150, 90, 60, 30, 10];

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["SB4", "SB5", "SB6", "SB7", "SB8", "SB9"],
            datasets: [{
                label: "Bases Registradas", data: data, backgroundColor: "rgba(0, 210, 255, 0.6)", borderColor: "#00d5ff", borderWidth: 2, borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.1)" }, ticks: { color: "#aaa" } },
                x: { grid: { display: false }, ticks: { display: false } }
            }
        }
    });
}

function initMap() {
    const elem = document.getElementById("galaxyMap");
    if (!elem || typeof Panzoom === "undefined") return;

    const panzoom = Panzoom(elem, { maxScale: 3, minScale: 0.3, startScale: 0.5, cursor: "grab" });
    const viewport = elem.parentElement;
    
    if (viewport) viewport.addEventListener("wheel", panzoom.zoomWithWheel);
    setTimeout(() => panzoom.pan(-1000, -1000), 100);
}

// ==========================================
// MENÚ HAMBURGUESA DINÁMICO (MÓVIL)
// ==========================================
function setupMobileMenu() {
    const mobileBtn = document.getElementById("mobileMenuBtn");
    const sidebar = document.querySelector(".sidebar");

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener("click", () => {
            sidebar.classList.toggle("active");
            // Alterna la clase "active" en el botón para animar la X
            mobileBtn.classList.toggle("active");
        });
    }

    // Cerrar menú automáticamente al pulsar cualquier botón lateral
    document.querySelectorAll(".sidebar-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.innerWidth <= 900 && sidebar) {
                sidebar.classList.remove("active");
                // Regresa la X a hamburguesa
                if (mobileBtn) mobileBtn.classList.remove("active");
            }
        });
    });
}
    // Cerrar menú automáticamente al pulsar cualquier botón lateral (y restaurar ícono)
    document.querySelectorAll(".sidebar-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (window.innerWidth <= 900 && sidebar) {
                sidebar.classList.remove("active");
                if (mobileIcon) {
                    mobileIcon.className = "fas fa-bars";
                    mobileBtn.style.color = "#00d5ff";
                    mobileBtn.style.borderColor = "#00d5ff";
                }
            }
        });
    });
