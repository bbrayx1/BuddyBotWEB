document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            // Evita que el navegador recargue la página automáticamente
            e.preventDefault(); 

            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();
            const submitBtn = document.querySelector(".btn-submit");

            // Animación táctica de carga
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AUTENTICANDO...';
            submitBtn.disabled = true;

            // Simulamos el retraso de enviar datos a Google Apps Script (1.5 segundos)
            setTimeout(() => {
                // Validación de prueba temporal
                // En el futuro, reemplazaremos este if con un fetch() a tu API de Google Sheets
                if (username === "admin" && password === "1234") {
                    
                    // Almacenamos la sesión en el navegador (Local Storage)
                    localStorage.setItem("buddybot_session", "true");
                    localStorage.setItem("buddybot_user", username);
                    
                    // Redirigimos al Centro de Mando
                    window.location.href = "dashboard.html";
                } else {
                    // Alerta de error si falla
                    alert("⛔ Acceso Denegado. Credenciales incorrectas.");
                    
                    // Restauramos el botón
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }, 1500);
        });
    }
});