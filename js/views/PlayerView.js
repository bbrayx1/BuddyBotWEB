import { CoordinatesController } from '../controllers/CoordinatesController.js';
import { DEFAULT_AVATAR, LEVEL_ICON, STARBASE_ICON } from '../utils/Constants.js';

export class PlayerView {
    static async load(playerName) {
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

            epcName.innerText = player.Name || playerName;
            epcAvatar.src = player.Avatar || DEFAULT_AVATAR;
            epcLevelTxt.innerText = player.Level || 0;
            epcId.innerText = player.Id || "---";

            const farmValues = { 1: 100, 2: 200, 3: 300, 4: 400, 5: 600, 6: 1000, 7: 1500, 8: 2000, 9: 2500 };
            let totalFarm = 0;
            if (player.Planets) {
                player.Planets.forEach(planet => {
                    const hq = Math.max(1, Math.min(9, planet.HQLevel || 1));
                    totalFarm += farmValues[hq] || 0;
                });
            }
            epcFarm.innerText = `+${totalFarm.toLocaleString()}`;

            if (player.AllianceId) {
                epcAllianceName.innerText = "Analizando...";
                epcAllianceStats.classList.add("hidden");
                epcAllianceIcon.className = "fas fa-circle-notch fa-spin epc-alliance-icon";
                epcAllianceLogo.classList.add("hidden");

                try {
                    const allianceData = await api.getAlliance(player.AllianceId);
                    
                    if (allianceData) {
                        epcAllianceName.innerText = allianceData.Name || player.AllianceId;
                        epcAllianceLvl.innerText = allianceData.AllianceLevel || 0;
                        epcAllianceMembers.innerText = allianceData.Members ? allianceData.Members.length : 0;
                        epcAllianceWars.innerText = (allianceData.WarsWon || 0) + (allianceData.WarsLost || 0);
                        
                        if (allianceData.Emblem) {
                            const { Shape, Pattern, Icon } = allianceData.Emblem;
                            epcAllianceLogo.src = `https://cdn.galaxylifegame.net/content/img/alliance_flag/AllianceLogos/flag_${Shape}_${Pattern}_${Icon}.png`;
                            epcAllianceLogo.classList.remove("hidden");
                            epcAllianceIcon.classList.add("hidden");
                        } else {
                            epcAllianceIcon.className = "fas fa-shield-alt epc-alliance-icon";
                        }
                        
                        epcAllianceStats.classList.remove("hidden");
                    }
                } catch (error) {
                    console.error("Error cargando alianza:", error);
                    epcAllianceName.innerText = "Error en API";
                    epcAllianceIcon.className = "fas fa-exclamation-triangle epc-alliance-icon";
                    epcAllianceIcon.style.color = "#ff4c4c";
                }
            } else {
                epcAllianceName.innerText = "Sin Alianza";
                epcAllianceIcon.className = "fas fa-ghost epc-alliance-icon";
                epcAllianceIcon.style.color = "#a1a1aa";
                epcAllianceIcon.classList.remove("hidden");
                epcAllianceLogo.classList.add("hidden");
                epcAllianceStats.classList.add("hidden");
            }

            const coordsCtrl = new CoordinatesController();
            const { players: coordinateData } = await coordsCtrl.loadAllianceCoordinates([{ Name: player.Name || playerName }]);
            const playerSheetData = coordinateData[0] || {};

            if (!player.Planets || player.Planets.length === 0) {
                planetsGrid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;">Este jugador no tiene bases registradas.</p>`;
            } else {
                const colonyColors = ["Planet_blue.png", "Planet_green.png", "Planet_red.png", "Planet_violet.png", "Planet_white.png", "Planet_yellow.png"];
                let colonyIndexInSheet = 1;

                const sortedPlanets = [...player.Planets].sort((a, b) => (b.HQLevel || 0) - (a.HQLevel || 0));
                sortedPlanets.slice(0, 24).forEach((planet, index) => {
                    const isMain = index === 0;
                    let planetTitle = isMain ? "Main Planet" : (index === 1 ? "1st Colony" : index === 2 ? "2nd Colony" : index === 3 ? "3rd Colony" : `${index}th Colony`);
                    const hqLvl = planet.HQLevel || 1;
                    const planetImg = isMain ? "Main.png" : colonyColors[(index - 1) % colonyColors.length];

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

                    card.addEventListener("click", () => {
                        if (actualCoords === "---") return;
                        const coordsToCopy = actualCoords;
                        
                        navigator.clipboard.writeText(coordsToCopy).then(() => {
                            const placeholder = card.querySelector('.elite-coords-placeholder');
                            placeholder.innerHTML = `<i class="fas fa-check"></i> ¡Copiado!`;
                            placeholder.style.color = "#a3e635";
                            placeholder.style.opacity = "1";
                            
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

            window.navigate("view-player-detail", "getCoordsMenuBtn");

        } catch (error) {
            console.error("Error cargando jugador:", error);
            epcName.innerText = "Error Crítico";
        }
    }
}
