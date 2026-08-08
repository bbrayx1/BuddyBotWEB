document.addEventListener("DOMContentLoaded", () => {
    // 1. Validación de seguridad simple al cargar la página
    if (localStorage.getItem('buddybot_session') !== 'true') {
        window.location.href = 'login.html';
        return; // Detiene la ejecución si no hay sesión
    } else {
        const userNameDisplay = document.getElementById('userName');
        if (userNameDisplay) {
            userNameDisplay.innerText = localStorage.getItem('buddybot_user') || 'Comandante';
        }
    }
});

// 2. Navegación SPA (React-style)
function showView(viewId, btnElement) {
    // Ocultar todas las vistas centrales
    document.querySelectorAll('.dashboard-view').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Quitar la clase "active" de todos los botones del menú lateral
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar la vista seleccionada y encender el botón presionado
    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');
    
    if (btnElement) btnElement.classList.add('active');
}

// 3. Simulación de Guardado (Add Coords)
function saveCoordinates() {
    const alertBox = document.getElementById('add-alert');
    if (alertBox) {
        alertBox.classList.remove('hidden');
        // Ocultar automáticamente después de 3 segundos
        setTimeout(() => alertBox.classList.add('hidden'), 3000);
    }
}

// 4. Simulación Extraer Jugador
function extractPlayer() {
    const tableContainer = document.getElementById('player-table-container');
    if (tableContainer) tableContainer.classList.remove('hidden');
}

// 5. Simulación Extraer Alianza
function extractAlliance() {
    const tableContainer = document.getElementById('alliance-table-container');
    if (tableContainer) tableContainer.classList.remove('hidden');
}

// 6. Cierre de sesión seguro
function logout() {
    localStorage.removeItem('buddybot_session');
    localStorage.removeItem('buddybot_user');
    window.location.href = 'index.html';
}