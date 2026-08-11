// MÓDULO DE CONEXIÓN API - GALAXY LIFE
const API_BASE = 'https://api.galaxylifegame.net';

const api = {
    /**
     * Busca una lista de jugadores por coincidencias en el nombre.
     */
    async searchPlayers(name) {
        try {
            const response = await fetch(`${API_BASE}/Users/search?name=${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error('Error en la búsqueda de jugadores');
            return await response.json();
        } catch (error) {
            console.error("Error searchPlayers:", error);
            return [];
        }
    },

    /**
     * Obtiene el perfil exacto de un jugador (incluyendo sus planetas).
     */
    async getPlayer(playerName) {
        try {
            const response = await fetch(`${API_BASE}/Users/name?name=${encodeURIComponent(playerName)}`);
            if (!response.ok) throw new Error('Error al obtener jugador');
            return await response.json();
        } catch (error) {
            console.error("Error getPlayer:", error);
            return null;
        }
    },

    /**
     * Obtiene los datos de una alianza respetando estrictamente las mayúsculas originales.
     */
    async getAlliance(allianceName) {
        try {
            const response = await fetch(`${API_BASE}/Alliances/get?name=${encodeURIComponent(allianceName)}`);
            if (!response.ok) throw new Error('Error al obtener alianza');
            return await response.json();
        } catch (error) {
            console.error("Error getAlliance:", error);
            return null;
        }
    },

    /**
     * Busca una lista de alianzas por coincidencias en el nombre (Spotlight / Radar).
     */
    async searchAlliances(name) {
        try {
            const response = await fetch(`${API_BASE}/Alliances/search?name=${encodeURIComponent(name)}`);
            if (!response.ok) throw new Error('Error en la búsqueda de alianzas');
            return await response.json();
        } catch (error) {
            console.error("Error searchAlliances:", error);
            return [];
        }
    }
};