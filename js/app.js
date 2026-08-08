// REPOSITORIO DE FRAGMENTOS DE CÓDIGO (Simulación de Python)
const codeSnippets = {
    default: "<span class='syntax-comment'># BuddyBot System Core Initialize...</span>\n<span class='syntax-comment'># Esperando comandos.</span>\n\n<span class='syntax-keyword'>while</span> True:\n    status = <span class='syntax-function'>listen_for_clicks</span>()\n    <span class='syntax-keyword'>if</span> status == <span class='syntax-string'>'CLICKED'</span>:\n        <span class='syntax-function'>execute_module_code</span>()",
    liveScout: "<span class='syntax-keyword'>import</span> discord\n<span class='syntax-keyword'>from</span> buddybot.core <span class='syntax-keyword'>import</span> WarRadar\n\n<span class='syntax-comment'># Escaneando alianzas enemigas</span>\n<span class='syntax-keyword'>async def</span> <span class='syntax-function'>scout_enemy</span>(alliance_id):\n    radar = <span class='syntax-function'>WarRadar</span>(target=alliance_id)\n    targets = <span class='syntax-keyword'>await</span> radar.<span class='syntax-function'>get_planets</span>()\n    <span class='syntax-keyword'>return</span> targets",
    warStats: "<span class='syntax-keyword'>from</span> google_sheets <span class='syntax-keyword'>import</span> DataSync\n\n<span class='syntax-comment'># Sincronización de Guerra en tiempo real</span>\n<span class='syntax-keyword'>def</span> <span class='syntax-function'>update_war_stats</span>(player_data):\n    sheet = DataSync.<span class='syntax-function'>connect</span>(<span class='syntax-string'>'Revelations_DB'</span>)\n    sheet.<span class='syntax-function'>append_row</span>(player_data)\n    <span class='syntax-function'>print</span>(<span class='syntax-string'>'[SUCCESS] Estadísticas guardadas.'</span>)",
    topRankings: "<span class='syntax-keyword'>class</span> <span class='syntax-function'>Rankings</span>:\n    <span class='syntax-keyword'>def</span> <span class='syntax-function'>get_top_players</span>(self, limit=10):\n        <span class='syntax-comment'># Obteniendo el TOP de jugadores de la alianza</span>\n        top = db.<span class='syntax-function'>query</span>(<span class='syntax-string'>'SELECT * FROM players ORDER BY wp DESC'</span>)\n        <span class='syntax-keyword'>return</span> top[:limit]",
    coordenadas: "<span class='syntax-keyword'>async def</span> <span class='syntax-function'>save_coordinates</span>(x, y, player):\n    <span class='syntax-comment'># Guardando nueva coordenada en el mapa galáctico</span>\n    <span class='syntax-function'>print</span>(f<span class='syntax-string'>'Mapeando a {player} en ({x}, {y})'</span>)\n    <span class='syntax-keyword'>await</span> database.<span class='syntax-function'>insert_coord</span>(x, y)\n    <span class='syntax-keyword'>return</span> True",
    alianzas: "<span class='syntax-keyword'>def</span> <span class='syntax-function'>track_alliance</span>(name):\n    <span class='syntax-comment'># Monitoreo constante de crecimiento de alianza</span>\n    data = api.<span class='syntax-function'>fetch_alliance</span>(name)\n    <span class='syntax-keyword'>for</span> member <span class='syntax-keyword'>in</span> data.members:\n        <span class='syntax-function'>analyze_growth</span>(member)",
    matchmaking: "<span class='syntax-keyword'>class</span> <span class='syntax-function'>MatchmakingSystem</span>:\n    <span class='syntax-keyword'>def</span> <span class='syntax-function'>find_targets</span>(self, hq_level):\n        <span class='syntax-comment'># Calculando rango de ataque óptimo</span>\n        min_range = hq_level - 2\n        max_range = hq_level + 1\n        <span class='syntax-keyword'>return</span> db.<span class='syntax-function'>search_players</span>(min_range, max_range)",
    moderacion: "<span class='syntax-keyword'>async def</span> <span class='syntax-function'>moderate_chat</span>(message):\n    <span class='syntax-comment'># Filtro de toxicidad y moderación automática</span>\n    <span class='syntax-keyword'>if</span> <span class='syntax-function'>contains_spam</span>(message.content):\n        <span class='syntax-keyword'>await</span> message.<span class='syntax-function'>delete</span>()\n        <span class='syntax-keyword'>await</span> message.author.<span class='syntax-function'>timeout</span>(duration=3600)",  
    registros: "<span class='syntax-keyword'>import</span> logging\n\n<span class='syntax-keyword'>def</span> <span class='syntax-function'>log_activity</span>(user_action):\n    <span class='syntax-comment'># Auditoría y log de comandos ejecutados</span>\n    logging.<span class='syntax-function'>info</span>(f<span class='syntax-string'>'User {user_action.user} executed {user_action.cmd}'</span>)\n    db.<span class='syntax-function'>save_log</span>(user_action)",
    configuracion: "<span class='syntax-keyword'>def</span> <span class='syntax-function'>load_server_config</span>(guild_id):\n    <span class='syntax-comment'># Cargando preferencias del servidor de Discord</span>\n    config = cache.<span class='syntax-function'>get_config</span>(guild_id)\n    <span class='syntax-keyword'>if not</span> config:\n        config = db.<span class='syntax-function'>fetch_config</span>(guild_id)\n    <span class='syntax-keyword'>return</span> config"
};

let typingTimeout;
let charIndex = 0;
let isDeleting = false;
let currentHTML = "";
let targetHTML = codeSnippets.default;
const typedCodeElement = document.getElementById('typed-code');


function animateCode() {
    if (isDeleting) {
        if (charIndex > 0) {
            charIndex--;
            
            if (currentHTML.charAt(charIndex) === '>') {
                let openIndex = currentHTML.lastIndexOf('<', charIndex);
                if (openIndex !== -1) charIndex = openIndex;
            }
            
            typedCodeElement.innerHTML = currentHTML.substring(0, charIndex);
            typingTimeout = setTimeout(animateCode, 8);
        } else {
            isDeleting = false;
            currentHTML = targetHTML;
            typingTimeout = setTimeout(animateCode, 150); 
        }
    } else {
        // Fase de escritura
        if (charIndex < currentHTML.length) {
            charIndex++;
            
            if (currentHTML.charAt(charIndex - 1) === '<') {
                let closingIndex = currentHTML.indexOf('>', charIndex);
                if (closingIndex !== -1) charIndex = closingIndex + 1;
            }
            
            typedCodeElement.innerHTML = currentHTML.substring(0, charIndex);
            typingTimeout = setTimeout(animateCode, 20); 
        }
    }
}

/**
 * @param {string} moduleKey 
 */
function showCode(moduleKey) {
    if (targetHTML === codeSnippets[moduleKey]) return;

    clearTimeout(typingTimeout);
    targetHTML = codeSnippets[moduleKey] || codeSnippets.default;
    isDeleting = true; 
    
    animateCode();
}

document.addEventListener("DOMContentLoaded", () => {
    if (typedCodeElement) {
        currentHTML = targetHTML;
        setTimeout(animateCode, 1000);
    }
}); 