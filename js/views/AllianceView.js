import { CoordinatesController } from '../controllers/CoordinatesController.js';
import { DEFAULT_AVATAR, LEVEL_ICON_ALLIANCE, ICON_LEVEL, ICON_MEMBERS, ICON_WARS, ICON_WP } from '../utils/Constants.js';

export class AllianceView {
    static async load(allianceName) {
        const title = document.getElementById("allianceTitle");
        const list = document.getElementById("allianceList");

        if (!title || !list) return;

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
                window.navigate("view-alliance-detail", "getCoordsMenuBtn");
                return;
            }

            const allianceNameDisplay = alliance.Name || allianceName || "Alianza";
            const allianceDescription = alliance.Description || "Sin descripción disponible.";
            const allianceLevel = alliance.AllianceLevel || 0;
            const wins = alliance.WarsWon || 0;
            const losses = alliance.WarsLost || 0;
            const warPoints = alliance.WarPoints || 0;
            
            let members = Array.isArray(alliance.Members) ? alliance.Members : [];
            const totalMembers = members.length;

            members.sort((a, b) => (b.Level || 0) - (a.Level || 0));

            let allianceLogo = DEFAULT_AVATAR;
            if (alliance.Emblem) {
                const { Shape, Pattern, Icon } = alliance.Emblem;
                allianceLogo = `https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_${Shape}_${Pattern}_${Icon}.png`;
            }

            title.innerHTML = `<i class="fas fa-shield-alt"></i> ${allianceNameDisplay}`;

            const coordsCtrl = new CoordinatesController();
            const { players: coordinateData, stats } = await coordsCtrl.loadAllianceCoordinates(members);
            let { totalPlanets, totalFarm, mainFarm } = stats;

            const renderPlanetCell = (coords, hqLvl, isMain) => {
                if (!coords || coords === "") return `<span class="alliance-empty-coordinate"> —</span>`;
                const hq = parseInt(hqLvl) || 1; 
                let imgSrc = "";
                if (isMain) {
                    imgSrc = `assets/bases/starbase_${hq}.png`;
                } else {
                    if (hq >= 6) imgSrc = `assets/bases/starbase_colony_6to9.png`;
                    else if (hq >= 4) imgSrc = `assets/bases/starbase_colony_4to5.png`;
                    else imgSrc = `assets/bases/starbase_colony_1to3.png`;
                }
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

            const getRoleName = (roleId) => {
                if (roleId === 0) return "General";
                if (roleId === 1) return "Captain";
                return "Member";
            };

            let tableRows = "";
            if (members.length > 0) {
                members.forEach(member => {
                    const playerData = coordinateData.find(
                        p => p.Name === member.Name || p.name === member.Name || p.Player === member.Name || p.player === member.Name
                    ) || {};

                    const avatar = member.Avatar || DEFAULT_AVATAR;
                    const playerLevel = member.Level || 0;
                    const roleId = member.AllianceRole !== undefined ? member.AllianceRole : 2;
                    const roleName = getRoleName(roleId);
                    const mainPlanetCoords = playerData.mainPlanet || playerData.Main || playerData.main || null;
                    const mainPlanetHQ = playerData.mainHQ || playerData.MainHQ || 1; 

                    tableRows += `
                        <tr>
                            <td>
                                <div class="alliance-player-cell">
                                    <div class="alliance-avatar-wrapper">
                                        <img src="${avatar}" class="alliance-player-avatar" onerror="this.src='${DEFAULT_AVATAR}'">
                                        <span class="alliance-player-level">
                                            <img src="${ICON_LEVEL}" style="width:9px; object-fit:contain;"> ${playerLevel}
                                        </span>
                                    </div>
                                    <div class="alliance-player-info">
                                        <span class="player-name">${member.Name || "Jugador"}</span>
                                        <div class="player-badges">
                                            <span class="player-role role-${roleId}">${roleName}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td>
                                ${renderPlanetCell(mainPlanetCoords, mainPlanetHQ, true)}
                            </td>
                    `;
                    for (let i = 1; i <= 11; i++) {
                        const colonyCoords = playerData[`colony${i}`] || playerData[`Colony${i}`] || null;
                        const colonyHQ = playerData[`colony${i}HQ`] || playerData[`Colony${i}HQ`] || 1; 
                        tableRows += `
                            <td>
                                ${renderPlanetCell(colonyCoords, colonyHQ, false)}
                            </td>
                        `;
                    }
                    tableRows += `</tr>`;
                });
            } else {
                tableRows = `<tr><td colspan="13" class="text-muted" style="text-align:center; padding: 30px;">Esta alianza no tiene miembros.</td></tr>`;
            }

            list.innerHTML = `
                <div class="alliance-detail-container">
                    <div class="alliance-header-section">
                        <div class="alliance-main-info">
                            <img src="${allianceLogo}" class="alliance-logo" alt="Logo" onerror="this.src='${DEFAULT_AVATAR}'">
                            <div class="alliance-text">
                                <h2 class="alliance-name">${allianceNameDisplay}</h2>
                                <p class="alliance-description">${allianceDescription}</p>
                            </div>
                        </div>
                        <div class="alliance-stats-grid">
                            <div class="alliance-stat-box">
                                <img src="${LEVEL_ICON_ALLIANCE}" alt="Level">
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
            window.navigate("view-alliance-detail", "getCoordsMenuBtn");
        } catch (error) {
            console.error("Error cargando alianza:", error);
            title.innerHTML = `<i class="fas fa-shield-alt"></i> Error`;
            list.innerHTML = `<p style="color:#ff4c4c;">Error al cargar la información de la alianza.</p>`;
            window.navigate("view-alliance-detail", "getCoordsMenuBtn");
        }
    }
}
