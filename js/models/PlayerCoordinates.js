export class PlayerCoordinates {
    constructor(data) {
        this.name = data.Name || "Desconocido";
        this.mainPlanet = data.mainPlanet || null;
        this.mainHQ = data.mainHQ || 1; // Backend actual no devuelve HQ
        
        // Asignar dinámicamente hasta 11 colonias
        for (let i = 1; i <= 11; i++) {
            this[`colony${i}`] = data[`colony${i}`] || null;
            this[`colony${i}HQ`] = data[`colony${i}HQ`] || null;
        }
        
        this.totalFarm = data.totalFarm || 0;
        this.mainFarm = data.mainFarm || 0;
    }

    /**
     * Calcula la cantidad total de planetas encontrados.
     */
    getTotalPlanetsCount() {
        let count = 0;
        if (this.mainPlanet) count++;
        for (let i = 1; i <= 11; i++) {
            if (this[`colony${i}`]) count++;
        }
        return count;
    }
}
