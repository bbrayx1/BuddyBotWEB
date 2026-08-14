import { CoordinatesController } from "./controllers/CoordinatesController.js";
// CONSTANTES Y RECURSOS OFICIALES
const DEFAULT_AVATAR = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Favatars.phoenixnetwork.net%2Fdefault.png&w=128&q=75";
const LEVEL_ICON = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Ficon_level.png&w=32&q=75";
const LEVEL_ICON_ALLIANCE = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Ficon_allianceLevel.png&w=32&q=75"
const STARBASE_ICON = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstarbase.png&w=64&q=75";
const BUDDYBOT_LOGO = 'https://cdn.discordapp.com/avatars/1297733983169417216/742eb2a97534c732c9efd5e9019e9aae.png?size=64';

// VARIABLES GLOBALES Y NAVEGACIÓN
const homeMenuBtn = document.getElementById("homeMenuBtn");
const addCoordsMenuBtn = document.getElementById("addCoordsMenuBtn");
const getCoordsMenuBtn = document.getElementById("getCoordsMenuBtn");
const SOLAR_SYSTEMS = [
    "assets/systems/Solar_system_02.png", // Verde (Main)
    "assets/systems/Solar_system_01.png", // Azul
    "assets/systems/Solar_system_05.png", // Amarillo
    "assets/systems/Solar_system_00.png", // Rojo
    "assets/systems/Solar_system_03.png", // Celeste
    "assets/systems/Solar_system_04.png", // Morado
];

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
    renderAddCoordsLayout(null)
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
// LÓGICA VISTA "ADD COORDS" (DEBOUNCE + ENTER)
// ==========================================

function setupAddCoordsDebounce() {
    const input = document.getElementById("addCoordsSearchInput");
    const overlay = document.getElementById("addCoordsOverlay");
    const wrapper = document.getElementById("addCoordsSearchWrapper");
    const resultsGrid = document.getElementById("addCoordsResultsGrid");

    if (!input) return;

    // 1. ACTIVAR SPOTLIGHT (Vuela al centro)
    input.addEventListener("focus", () => {
        overlay.classList.remove("hidden");
        setTimeout(() => overlay.classList.add("active"), 10);
        wrapper.classList.add("active");
    });

    // 2. CERRAR SPOTLIGHT (Clic en fondo)
    overlay.addEventListener("click", () => {
        overlay.classList.remove("active");
        setTimeout(() => overlay.classList.add("hidden"), 300);
        wrapper.classList.remove("active");
        resultsGrid.classList.add("hidden");
        input.blur();
    });

    // 3. ESCRIBIR (Skeletons + Debounce 3s)
    input.addEventListener("input", event => {
        const query = event.target.value.trim();
        clearTimeout(searchTimeout);

        if (query.length < 2) {
            resultsGrid.classList.add("hidden");
            resultsGrid.innerHTML = "";
            return;
        }

        resultsGrid.classList.remove("hidden");
        resultsGrid.innerHTML = Array(4).fill(`
            <div class="player-card-interactive" style="pointer-events: none;">
                <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <div class="skeleton-avatar"></div>
                    <div style="display: flex; flex-direction: column; flex: 1; gap: 10px;">
                        <div class="skeleton-line" style="width: 60%; height: 16px;"></div>
                        <div class="skeleton-line" style="width: 35%; height: 14px;"></div>
                    </div>
                </div>
            </div>
        `).join('');

        searchTimeout = setTimeout(() => fetchPlayersForAdding(query), 3000);
    });

    // 4. ENTER (Búsqueda forzada)
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            const query = event.target.value.trim();
            if (query.length >= 2) {
                clearTimeout(searchTimeout);
                resultsGrid.classList.remove("hidden");
                fetchPlayersForAdding(query);
            }
        }
    });
}

// ==========================================
// RENDERIZAR RESULTADOS DEL SPOTLIGHT
// ==========================================
async function fetchPlayersForAdding(query) {
    const resultsGrid = document.getElementById("addCoordsResultsGrid");
    const overlay = document.getElementById("addCoordsOverlay");
    const wrapper = document.getElementById("addCoordsSearchWrapper");
    const input = document.getElementById("addCoordsSearchInput");

    try {
        let players = typeof api !== "undefined" && api.searchPlayers ? await api.searchPlayers(query) : [];

        if (!players || players.length === 0) {
            resultsGrid.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align:center;">No se detectaron objetivos en el radar.</p>`;
            return;
        }

        players.sort((a, b) => (b.Level || 0) - (a.Level || 0));
        resultsGrid.innerHTML = "";

        players.forEach(player => {
            const avatarUrl = player.Avatar || DEFAULT_AVATAR;
            const card = document.createElement("div");
            card.className = "player-card-interactive";
            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <img src="${avatarUrl}" alt="Avatar" style="width:55px; height:55px; border-radius:8px; border:1px solid #00d5ff; object-fit:cover;" onerror="this.src='${DEFAULT_AVATAR}'">
                    <div style="display: flex; flex-direction: column; flex: 1;">
                        <h3 style="color:white; font-family:'Nasalization', sans-serif; font-size:1.1rem; margin:0 0 8px 0;">${player.Name || "Jugador"}</h3>
                        <span style="color: #00d5ff; font-size: 0.9rem; font-family: 'Nasalization', sans-serif;">
                            <img src="${LEVEL_ICON}" style="width:14px; object-fit: contain;"> Lvl ${player.Level || 0}
                        </span>
                    </div>
                </div>
            `;
            
            // ACCIÓN: Seleccionar Jugador
            card.addEventListener("click", () => {
                // Cerrar buscador
                overlay.classList.remove("active");
                setTimeout(() => overlay.classList.add("hidden"), 300);
                wrapper.classList.remove("active");
                resultsGrid.classList.add("hidden");
                input.value = "";
                input.blur();

                // Renderizar la interfaz central con datos reales
                renderAddCoordsLayout(player);
            });
            resultsGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Error buscando:", error);
        resultsGrid.innerHTML = `<p style="color:#ff5f56; text-align:center;">Error de conexión a la API.</p>`;
    }
}

// ==========================================
// RENDERIZAR INTERFAZ (VACÍA O CON JUGADOR)
// ==========================================
function renderAddCoordsLayout(player = null) {
    const container = document.getElementById("addCoordsContentLayout");
    if (!container) return;
    
    // Datos Dinámicos o por Defecto
    const isPopulated = player !== null;
    const avatarUrl = isPopulated && player.Avatar ? player.Avatar : BUDDYBOT_LOGO; // Ajustado a DEFAULT_AVATAR
    const playerName = isPopulated ? player.Name : "Selecciona un objetivo...";
    const playerLevel = isPopulated ? player.Level : "Null";
    const planetsData = isPopulated && player.Planets ? [...player.Planets].sort((a, b) => (b.HQLevel || 0) - (a.HQLevel || 0)) : [];

    container.innerHTML = `
        <h2 class="add-coords-player-name">${playerName}</h2>
        <div class="add-coords-split-layout">
            
            <!-- IZQUIERDA: AVATAR Y NIVEL ESTILO WIKI -->
            <div class="add-coords-left-col">
                <img src="${avatarUrl}" class="ac-avatar-img" onerror="this.src='${DEFAULT_AVATAR}'">
                <div class="ac-level-badge">
                    <img src="${LEVEL_ICON}" alt="Lvl"> ${playerLevel}
                </div>
            </div>

            <!-- DERECHA: PLANETAS (SISTEMAS SOLARES) -->
            <div class="add-coords-right-col" id="acPlanetsGrid"></div>
            
        </div>
    `;

    const grid = document.getElementById("acPlanetsGrid");

    // Renderizar 12 tarjetas siempre (llenas o vacías)
    for (let i = 0; i < 12; i++) {
        const isMain = i === 0;
        const planetTitle = isMain ? "Main Planet" : `Colony ${i}`;
        
        // Asignar imagen del sistema solar
        let solarImg = SOLAR_SYSTEMS[0]; // Verde por defecto para Main
        if (!isMain) solarImg = SOLAR_SYSTEMS[1 + (i % 5)]; // Rotar colores para colonias
        
        // Datos si el jugador existe y tiene ese planeta
        const planetInfo = planetsData[i];
        let hqLvlHtml = "";
        let actionClass = "empty-card";
        let onClickStr = "";

        if (isPopulated && planetInfo) {
            const hq = planetInfo.HQLevel || 1;
            let baseImg = isMain ? `assets/bases/starbase_${Math.max(4, Math.min(9, hq))}.png` : 
                          (hq > 5 ? "assets/bases/starbase_colony_6to9.png" : 
                          (hq > 3 ? "assets/bases/starbase_colony_4to5.png" : "assets/bases/starbase_colony_1to3.png"));
            
            hqLvlHtml = `
                <div class="ac-base-info">
                    <img src="${baseImg}" onerror="this.src='assets/bases/starbase_1.png'">
                    <span>${hq}</span>
                </div>
            `;
            actionClass = "clickable-card";
            onClickStr = `onclick="openModal('modalAddCoord', '${playerName}', '${planetTitle}', ${hq})"`;
        }

        grid.innerHTML += `
            <div class="ac-planet-h-card ${actionClass} ${isMain ? "main-planet-card" : ""}" ${onClickStr}>
                
                <!-- Wrapper izquierdo: Título + Base debajo -->
                <div class="ac-planet-text-wrapper">
                    <span class="ac-planet-title">${planetTitle}</span>
                    ${hqLvlHtml}
                </div>

                <img src="${solarImg}" class="ac-solar-system-img">
            </div>
        `;
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
            console.error("No se pudo cargar la información del jugador.");
            epcName.innerText = "Error (No Encontrado)";
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

        // 6. Integración de Coordenadas de Google Sheets (Vía Controlador)
        const coordsCtrl = new CoordinatesController();
        // Llamamos al controlador con un array de 1 solo miembro
        const { players: coordinateData } = await coordsCtrl.loadAllianceCoordinates([{ Name: player.Name || playerName }]);
        const playerSheetData = coordinateData[0] || {};

        // 7. Generar Grilla de Planetas
        if (!player.Planets || player.Planets.length === 0) {
            planetsGrid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;">Este jugador no tiene bases registradas.</p>`;
        } else {
            const colonyColors = ["Planet_blue.png", "Planet_green.png", "Planet_red.png", "Planet_violet.png", "Planet_white.png", "Planet_yellow.png"];
            
            // Tratamos de buscar la info del sheet por iteración
            let colonyIndexInSheet = 1;

            const sortedPlanets = [...player.Planets].sort((a, b) => (b.HQLevel || 0) - (a.HQLevel || 0));
            sortedPlanets.slice(0, 24).forEach((planet, index) => {
                const isMain = index === 0;
                let planetTitle = isMain ? "Main Planet" : (index === 1 ? "1st Colony" : index === 2 ? "2nd Colony" : index === 3 ? "3rd Colony" : `${index}th Colony`);
                const hqLvl = planet.HQLevel || 1;
                const planetImg = isMain ? "Main.png" : colonyColors[(index - 1) % colonyColors.length];

                // Rescatar las coords desde los datos del Sheet
                let actualCoords = "";
                if (isMain) {
                    actualCoords = playerSheetData.mainPlanet || "---";
                } else {
                    actualCoords = playerSheetData[`colony${colonyIndexInSheet}`] || "---";
                    colonyIndexInSheet++;
                }

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
                    <div class="elite-coords-placeholder ${actualCoords !== '---' ? 'has-coords' : ''}">${actualCoords}</div>
                `;

                // Acción al dar click: COPIAR coordenadas si existen
                card.addEventListener("click", () => {
                    if (actualCoords === "---") return;
                    const coordsToCopy = actualCoords;
                    
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

    // ESTADO DE CARGA
    title.innerHTML = `<i class="fas fa-shield-alt"></i> Alianza: Loading...`;
    list.innerHTML = `
        <div class="spinner">
            <i class="fas fa-circle-notch fa-spin"></i>
            Cargando información de la alianza...
        </div>
    `;

    try {
        if (typeof api === "undefined" || !api.getAlliance) {
            throw new Error("api.getAlliance no está disponible");
        }

        const alliance = await api.getAlliance(allianceName);

        if (!alliance) {
            title.innerHTML = `<i class="fas fa-shield-alt"></i> Alianza no encontrada`;
            list.innerHTML = `<p class="text-muted">No se encontró información de esta alianza.</p>`;
            navigate("view-alliance-detail", "getCoordsMenuBtn");
            return;
        }

        // =========================================================
        // EXTRAER DATOS BÁSICOS
        // =========================================================
        const allianceNameDisplay = alliance.Name || allianceName || "Alianza";
        const allianceDescription = alliance.Description || "Sin descripción disponible.";
        const allianceLevel = alliance.AllianceLevel || 0;
        const wins = alliance.WarsWon || 0;
        const losses = alliance.WarsLost || 0;
        const warPoints = alliance.WarPoints || 0;
        
        let members = Array.isArray(alliance.Members) ? alliance.Members : [];
        const totalMembers = members.length;

        // ORDENAR MIEMBROS POR NIVEL (Mayor a menor)
        members.sort((a, b) => (b.Level || 0) - (a.Level || 0));
        
        const DEFAULT_AVATAR = "https://cdn.galaxylifegame.net/assets/landingpage/images/avatar/starling.png";
        
        // ÍCONOS OFICIALES DE ESTADÍSTICAS
        const ICON_WP = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstats%2Ficon_warpoints.png&w=128&q=75";
        const ICON_MEMBERS = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstats%2Ficon_members.png&w=128&q=75";
        const ICON_LEVEL = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstats%2Ficon_allianceLevel.png&w=128&q=75";
        const ICON_WARS = "https://galaxylifegame.net/_next/image?url=https%3A%2F%2Fcdn.galaxylifegame.net%2Fassets%2Flandingpage%2Fimages%2Ficons%2Fstats%2Ficon_winrate.png&w=128&q=75";

        // LOGO DINÁMICO
        let allianceLogo = DEFAULT_AVATAR;
        if (alliance.Emblem) {
            const { Shape, Pattern, Icon } = alliance.Emblem;
            allianceLogo = `https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_${Shape}_${Pattern}_${Icon}.png`;
        }

        title.innerHTML = `<i class="fas fa-shield-alt"></i> ${allianceNameDisplay}`;

        // =========================================================
        // INTEGRACIÓN DE GOOGLE SHEETS (Vía Controlador)
        // =========================================================
        const coordsCtrl = new CoordinatesController();
        const { players: coordinateData, stats } = await coordsCtrl.loadAllianceCoordinates(members);
        
        let { totalPlanets, totalFarm, mainFarm } = stats;

        // =========================================================
        // FUNCIÓN PARA RENDERIZAR CELDAS DE PLANETAS
        // =========================================================
        const renderPlanetCell = (coords, hqLvl, isMain) => {
            if (!coords || coords === "") {
                return `<span class="alliance-empty-coordinate"> —</span>`;
            }

            const hq = parseInt(hqLvl) || 1; 
            let imgSrc = "";

            if (isMain) {
                imgSrc = `assets/bases/starbase_${hq}.png`;
            } else {
                if (hq >= 6) imgSrc = `assets/bases/starbase_colony_6to9.png`;
                else if (hq >= 4) imgSrc = `assets/bases/starbase_colony_4to5.png`;
                else imgSrc = `assets/bases/starbase_colony_1to3.png`;
            }

            // Imagen/HQ arriba, coords formato texto limpio abajo
            return `
                <div class="planet-cell-content">
                    <div class="planet-visual">
                        <img src="${imgSrc}" alt="HQ${hq}" onerror="this.src='assets/bases/starbase_1.png'">
                        <span class="planet-hq">${hq}</span>
                    </div>
                    <span class="planet-coords">${coords}</span>
                </div>
            `;
        };

        // =========================================================
        // FUNCIÓN PARA EL ROL DEL JUGADOR
        // =========================================================
        const getRoleName = (roleId) => {
            if (roleId === 0) return "General";
            if (roleId === 1) return "Captain";
            return "Member";
        };

        // =========================================================
        // CONSTRUIR TABLA DE JUGADORES
        // =========================================================
        let tableRows = "";

        if (members.length > 0) {
            members.forEach(member => {
                const playerData = coordinateData.find(
                    p => p.Name === member.Name || p.name === member.Name || p.Player === member.Name || p.player === member.Name
                ) || {};

                const avatar = member.Avatar || DEFAULT_AVATAR;
                const playerLevel = member.Level || 0;
                
                // Obtener el rol del JSON
                const roleId = member.AllianceRole !== undefined ? member.AllianceRole : 2;
                const roleName = getRoleName(roleId);
                
                const mainPlanetCoords = playerData.mainPlanet || playerData.Main || playerData.main || null;
                const mainPlanetHQ = playerData.mainHQ || playerData.MainHQ || 1; 

                tableRows += `
                    <tr>
                        <!-- PLAYER COLUMN (Avatar con Nivel + Nombre + Rol) -->
                        <td>
                            <div class="alliance-player-cell">
                                <!-- Contenedor Relativo para Avatar y Nivel -->
                                <div class="alliance-avatar-wrapper">
                                    <img src="${avatar}" class="alliance-player-avatar" onerror="this.src='${DEFAULT_AVATAR}'">
                                    <span class="player-level-badge">
                                        <img src="${LEVEL_ICON}" style="width:8px; object-fit:contain;"> ${playerLevel}
                                    </span>
                                </div>

                                <!-- Detalles: Nombre y Rol -->
                                <div class="alliance-player-details">
                                    <span class="player-name">${member.Name || "Jugador"}</span>
                                    <div class="player-badges">
                                        <span class="player-role role-${roleId}">${roleName}</span>
                                    </div>
                                </div>
                            </div>
                        </td>

                        <!-- MAIN -->
                        <td class="alliance-coordinate alliance-main-planet">
                            ${renderPlanetCell(mainPlanetCoords, mainPlanetHQ, true)}
                        </td>
                `;

                // COLONIAS 1 - 11
                for (let i = 1; i <= 11; i++) {
                    const colonyCoords = playerData[`colony${i}`] || playerData[`Colony${i}`] || null;
                    const colonyHQ = playerData[`colony${i}HQ`] || playerData[`Colony${i}HQ`] || 1; 

                    tableRows += `
                        <td class="alliance-coordinate">
                            ${renderPlanetCell(colonyCoords, colonyHQ, false)}
                        </td>
                    `;
                }

                tableRows += `</tr>`;
            });
        } else {
            tableRows = `
                <tr>
                    <td colspan="13" style="text-align:center; padding:30px;">
                        No hay miembros disponibles.
                    </td>
                </tr>
            `;
        }

        // =========================================================
        // RENDER COMPLETO HTML
        // =========================================================
        list.innerHTML = `
            <div class="alliance-profile">
                <!-- CABECERA (DISEÑO MEJORADO Y AGRUPADO) -->
                <div class="alliance-header-card">
                    
                    <div class="alliance-logo-wrapper">
                        <img src="${allianceLogo}" class="alliance-logo" alt="Logo" onerror="this.src='${DEFAULT_AVATAR}'">
                    </div>

                    <div class="alliance-info-center">
                        <h2 class="alliance-name">${allianceNameDisplay}</h2>
                        <p class="alliance-description">${allianceDescription}</p>
                    </div>

                    <div class="alliance-stats-right">
                        <div class="alliance-stat-box">
                            <img src="${ICON_LEVEL}" alt="Level">
                            <div class="stat-content">
                                <span class="stat-label">Nivel</span>
                                <strong class="stat-value">${allianceLevel}</strong>
                            </div>
                        </div>
                        <div class="alliance-stat-box">
                            <img src="${ICON_MEMBERS}" alt="Members">
                            <div class="stat-content">
                                <span class="stat-label">Miembros</span>
                                <strong class="stat-value">${totalMembers}</strong>
                            </div>
                        </div>
                        <div class="alliance-stat-box">
                            <img src="${ICON_WARS}" alt="WinRate">
                            <div class="stat-content">
                                <span class="stat-label">Win / Lost</span>
                                <strong class="stat-value">${wins} / ${losses}</strong>
                            </div>
                        </div>
                        <div class="alliance-stat-box">
                            <img src="${ICON_WP}" alt="War Points">
                            <div class="stat-content">
                                <span class="stat-label">War Points</span>
                                <strong class="stat-value">${warPoints.toLocaleString()}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ESTADÍSTICAS GOOGLE SHEETS -->
                <div class="alliance-db-section">
                    <h3 class="alliance-section-title">
                        <i class="fas fa-database"></i> Estadísticas de coordenadas
                    </h3>
                    <div class="alliance-db-stats">
                        <div class="alliance-db-card">
                            <span class="alliance-db-label">Total planetas</span>
                            <strong class="alliance-db-value">${totalPlanets}</strong>
                        </div>
                        <div class="alliance-db-card">
                            <span class="alliance-db-label">Farm total</span>
                            <strong class="alliance-db-value">${totalFarm.toLocaleString()}</strong>
                        </div>
                        <div class="alliance-db-card">
                            <span class="alliance-db-label">Farm Main</span>
                            <strong class="alliance-db-value">${mainFarm.toLocaleString()}</strong>
                        </div>
                    </div>
                </div>

                <!-- TABLA DE COORDENADAS -->
                <div class="alliance-coordinates-section">
                    <h3 class="alliance-section-title">
                        <i class="fas fa-globe"></i> Coordenadas registradas
                    </h3>
                    <div class="alliance-table-wrapper">
                        <table class="alliance-coordinates-table">
                            <thead>
                                <tr>
                                    <th>Player Info</th>
                                    <th>Main Planet</th>
                                    <th>Colony 1</th>
                                    <th>Colony 2</th>
                                    <th>Colony 3</th>
                                    <th>Colony 4</th>
                                    <th>Colony 5</th>
                                    <th>Colony 6</th>
                                    <th>Colony 7</th>
                                    <th>Colony 8</th>
                                    <th>Colony 9</th>
                                    <th>Colony 10</th>
                                    <th>Colony 11</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        navigate("view-alliance-detail", "getCoordsMenuBtn");

    } catch (error) {
        console.error("Error cargando alianza:", error);
        title.innerHTML = `<i class="fas fa-shield-alt"></i> Error`;
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
        
        if (!x || !y) {
            console.error("Por favor ingresa X e Y.");
            return;
        }

        console.log("Coordenada enviada a Google Sheets exitosamente.");
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
window.navigate = navigate; window.closeModal = closeModal; window.openModal = openModal;
