document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const btnSubmit = document.getElementById("btnSubmit");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    loginForm.addEventListener("submit", (e) => {
        // Prevenir que la página recargue
        e.preventDefault();

        const user = usernameInput.value.trim();
        const pass = passwordInput.value.trim();

        if (user === "" || pass === "") {
            return; // Required del HTML ya debería bloquearlo, pero es seguridad extra.
        }

        // Estado visual de carga
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando Sesión...';
        btnSubmit.style.opacity = '0.8';
        btnSubmit.style.cursor = 'not-allowed';

        // Simulación de respuesta de API (1.5 segundos)
        setTimeout(() => {
            console.log(`Logueando al usuario: ${user}`);
            
            // Éxito
            btnSubmit.innerHTML = '<i class="fas fa-check"></i> Acceso Concedido';
            btnSubmit.style.backgroundColor = "#69f29d"; // Verde
            btnSubmit.style.color = "#fff";

            // Redirigir al dashboard
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 500);

        }, 1500);
    });
});