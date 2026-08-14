import { GoogleSheetsService } from '../services/GoogleSheetsService.js';
import { PlayerCoordinates } from '../models/PlayerCoordinates.js';

export class CoordinatesController {
    constructor() {
        this.sheetsService = new GoogleSheetsService();
    }

    /**
     * Carga y procesa las coordenadas desde Sheets.
     * @param {Array} members 
     * @returns {Promise<Object>} Datos procesados para UI
     */
    async loadAllianceCoordinates(members) {
        const rawData = await this.sheetsService.fetchCoordinates(members);
        
        let totalPlanets = 0;
        let totalFarm = 0;
        let mainFarm = 0;

        const processedPlayers = rawData.map(data => {
            const playerInfo = new PlayerCoordinates(data);
            
            totalPlanets += playerInfo.getTotalPlanetsCount();
            totalFarm += playerInfo.totalFarm;
            mainFarm += playerInfo.mainFarm;

            return playerInfo;
        });

        return {
            players: processedPlayers,
            stats: {
                totalPlanets,
                totalFarm,
                mainFarm
            }
        };
    }

    /**
     * Añade una nueva coordenada (ej. desde un form)
     */
    async saveNewCoordinate(data) {
        const result = await this.sheetsService.addCoordinate(data);
        return result;
    }
}
