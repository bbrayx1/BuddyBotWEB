export class GoogleSheetsService {
    constructor() {
        this.apiUrl = 'https://script.google.com/macros/s/AKfycbxpqxFOYIoamB-MUcQbMtocS128zzsle6tOoPkMCfllexOwNB2FB6MfJD7JaJXH3-d5Jw/exec';
        this.password = sessionStorage.getItem('gs_password') || null; 
    }

    async _showAlert(msg) {
        return new Promise((resolve) => {
            const existing = document.getElementById("gs-alert-modal");
            if (existing) existing.remove();

            const modalHtml = `
                <div id="gs-alert-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                    <div style="background: rgba(20, 20, 30, 0.95); padding: 30px; border-radius: 12px; border: 1px solid rgba(255, 76, 76, 0.3); box-shadow: 0 0 20px rgba(255, 76, 76, 0.2); width: 350px; text-align: center; font-family: 'Inter', sans-serif;">
                        <h3 style="color: #ff4c4c; margin-top: 0; font-family: 'Audiowide', cursive; font-size: 1.2rem;"><i class="fas fa-exclamation-triangle"></i> Error</h3>
                        <p style="color: #a1a1aa; font-size: 0.9rem; margin-bottom: 20px;">${msg}</p>
                        <button id="gs-btn-alert-ok" style="padding: 8px 16px; border: none; border-radius: 6px; background: #ff4c4c; color: #fff; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 0 10px rgba(255, 76, 76, 0.4);">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById("gs-alert-modal");
            const btn = document.getElementById("gs-btn-alert-ok");

            btn.focus();
            const close = () => {
                modal.remove();
                resolve();
            };
            btn.onclick = close;
        });
    }

    async _promptPassword() {
        return new Promise((resolve) => {
            // Eliminar si ya existe
            const existing = document.getElementById("gs-password-modal");
            if (existing) existing.remove();

            const modalHtml = `
                <div id="gs-password-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                    <div style="background: rgba(20, 20, 30, 0.95); padding: 30px; border-radius: 12px; border: 1px solid rgba(0, 213, 255, 0.3); box-shadow: 0 0 20px rgba(0, 213, 255, 0.2); width: 350px; text-align: center; font-family: 'Inter', sans-serif;">
                        <h3 style="color: #fff; margin-top: 0; font-family: 'Audiowide', cursive; font-size: 1.2rem;"><i class="fas fa-lock" style="color: #00d5ff;"></i> Base de Datos</h3>
                        <p style="color: #a1a1aa; font-size: 0.9rem; margin-bottom: 20px;">Por favor, ingresa la contraseña para acceder a las coordenadas.</p>
                        <input type="password" id="gs-password-input" style="width: 100%; padding: 10px; margin-bottom: 20px; border-radius: 6px; border: 1px solid #3f3f46; background: #27272a; color: #fff; box-sizing: border-box;" placeholder="Contraseña...">
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="gs-btn-cancel" style="padding: 8px 16px; border: none; border-radius: 6px; background: #3f3f46; color: #fff; cursor: pointer; transition: 0.2s;">Cancelar</button>
                            <button id="gs-btn-submit" style="padding: 8px 16px; border: none; border-radius: 6px; background: #00d5ff; color: #000; font-weight: bold; cursor: pointer; transition: 0.2s; box-shadow: 0 0 10px rgba(0, 213, 255, 0.4);">Aceptar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            const modal = document.getElementById("gs-password-modal");
            const input = document.getElementById("gs-password-input");
            const btnCancel = document.getElementById("gs-btn-cancel");
            const btnSubmit = document.getElementById("gs-btn-submit");

            input.focus();

            const close = (val) => {
                modal.remove();
                resolve(val);
            };

            btnCancel.onclick = () => close(null);
            btnSubmit.onclick = () => close(input.value);
            input.onkeydown = (e) => {
                if (e.key === "Enter") close(input.value);
                if (e.key === "Escape") close(null);
            };
        });
    }

    _showLoading(description = "Obteniendo coordenadas, por favor espera.") {
        const existing = document.getElementById("gs-loading-modal");
        if (existing) existing.remove();

        const modalHtml = `
            <div id="gs-loading-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.6); z-index: 10000; display: flex; flex-direction: column; align-items: center; justify-content: center; backdrop-filter: blur(12px); text-align: center; font-family: 'Inter', sans-serif;">
                <style>
                    @keyframes loadingDots {
                        0% { content: '.'; }
                        25% { content: '..'; }
                        50% { content: '...'; }
                        75% { content: '..'; }
                        100% { content: '.'; }
                    }
                    .animated-dots::after {
                        content: '.';
                        animation: loadingDots 1.5s infinite;
                        display: inline-block;
                        text-align: left;
                        width: 1.5em; /* Evita que el texto salte */
                    }
                </style>
                <img src="https://static.wikia.nocookie.net/omori/images/6/66/Mewo_Sleep_%28White_Space%29.gif/revision/latest?cb=20220208120101" alt="Loading" style="width: 100px; margin-bottom: 20px; image-rendering: pixelated; filter: invert(1);">
                <h3 style="color: #fff; margin: 0 0 10px 0; font-family: 'Audiowide', cursive; font-size: 1.5rem; letter-spacing: 2px;">Loading<span class="animated-dots"></span></h3>
                <p style="color: #00d5ff; font-size: 1rem; margin: 0; text-shadow: 0 0 10px rgba(0, 213, 255, 0.5);">${description}</p>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    _hideLoading() {
        const modal = document.getElementById("gs-loading-modal");
        if (modal) modal.remove();
    }

    /**
     * Obtiene las coordenadas y stats de la base de datos de Google Sheets.
     * @param {Array} members - Lista de miembros para mapear.
     * @returns {Promise<Array>} Lista de coordenadas mapeadas.
     */
    async fetchCoordinates(members) {
        if (!this.password) {
            this.password = await this._promptPassword();
            if (!this.password) {
                console.warn("Se canceló el ingreso de la contraseña. Devolviendo datos vacíos.");
                return members.map(m => ({ Name: m.Name }));
            }
            sessionStorage.setItem('gs_password', this.password);
        }

        this._showLoading("Obteniendo coordenadas desde la base de datos...");
        // Preparamos la lista de jugadores que vamos a solicitar para optimizar la búsqueda
        const requestedPlayers = members.map(m => m.Name);

        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify({
                    password: this.password,
                    players: requestedPlayers
                })
            });

            const json = await response.json();

            if (!json.ok) {
                await this._showAlert("Error desde la base de datos: " + (json.msg || "Incorrect key."));
                this.password = null; // Resetear clave si fue incorrecta
                sessionStorage.removeItem('gs_password');
                return members.map(m => ({ Name: m.Name }));
            }

            const coordMap = json.data;

            // Mapeamos los datos retornados por Apps Script al formato de nuestra interfaz
            return members.map(m => {
                const playerNameLow = String(m.Name).toLowerCase().trim();
                const coords = coordMap[playerNameLow] || [];

                // Verificamos si el array trajo solo coordenadas o Coordenadas + Sb 
                const isNewFormat = coords.length > 12;

                if (isNewFormat) {
                    return {
                        Name: m.Name,
                        mainPlanet: coords[0] || null,
                        mainHQ: coords[1] ? parseInt(coords[1]) : 1,
                        colony1: coords[2] || null,
                        colony1HQ: coords[3] ? parseInt(coords[3]) : null,
                        colony2: coords[4] || null,
                        colony2HQ: coords[5] ? parseInt(coords[5]) : null,
                        colony3: coords[6] || null,
                        colony3HQ: coords[7] ? parseInt(coords[7]) : null,
                        colony4: coords[8] || null,
                        colony4HQ: coords[9] ? parseInt(coords[9]) : null,
                        colony5: coords[10] || null,
                        colony5HQ: coords[11] ? parseInt(coords[11]) : null,
                        colony6: coords[12] || null,
                        colony6HQ: coords[13] ? parseInt(coords[13]) : null,
                        colony7: coords[14] || null,
                        colony7HQ: coords[15] ? parseInt(coords[15]) : null,
                        colony8: coords[16] || null,
                        colony8HQ: coords[17] ? parseInt(coords[17]) : null,
                        colony9: coords[18] || null,
                        colony9HQ: coords[19] ? parseInt(coords[19]) : null,
                        colony10: coords[20] || null,
                        colony10HQ: coords[21] ? parseInt(coords[21]) : null,
                        colony11: coords[22] || null,
                        colony11HQ: coords[23] ? parseInt(coords[23]) : null,
                        totalFarm: m.Farm || 0,
                        mainFarm: m.MainFarm || 0
                    };
                } else {
                    return {
                        Name: m.Name,
                        mainPlanet: coords[0] || null,
                        colony1: coords[1] || null,
                        colony2: coords[2] || null,
                        colony3: coords[3] || null,
                        colony4: coords[4] || null,
                        colony5: coords[5] || null,
                        colony6: coords[6] || null,
                        colony7: coords[7] || null,
                        colony8: coords[8] || null,
                        colony9: coords[9] || null,
                        colony10: coords[10] || null,
                        colony11: coords[11] || null,
                        totalFarm: m.Farm || 0,
                        mainFarm: m.MainFarm || 0
                    };
                }
            });

        } catch (error) {
            console.error("Error al obtener las coordenadas desde el backend:", error);
            await this._showAlert("Error de comunicación con Google Sheets.");
            return members.map(m => ({ Name: m.Name }));
        } finally {
            this._hideLoading();
        }
    }

    /**
     * Agrega una nueva coordenada a la hoja (Requiere un nuevo doPost action en GAS).
     * @param {Object} coordinateData 
     */
    async addCoordinate(coordinateData) {
        this._showLoading("Guardando coordenada, por favor espera...");
        try {
            console.log("Para guardar, debes crear una acción específica en tu Apps Script.");
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulamos carga
            return true;
        } catch(err) {
            console.error("Error guardando coordenada:", err);
            return false;
        } finally {
            this._hideLoading();
        }
    }
}
