export class AuthView {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.isLogin = true;
  }

  render() {
    const container = document.createElement("div");
    container.className = "min-h-screen flex items-center justify-center p-4";

    container.innerHTML = `
            <div class="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <h2 class="text-2xl font-bold text-center mb-6" id="auth-title">
                    ${this.isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
                </h2>
                <form id="auth-form" class="space-y-4">
                    <input type="email" id="email" placeholder="Email" required 
                           class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <input type="password" id="password" placeholder="Contraseña" required 
                           class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        ${this.isLogin ? "Entrar" : "Registrarse"}
                    </button>
                </form>
                <p class="mt-4 text-center text-sm text-gray-600">
                    ${
                      this.isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"
                    }
                    <button id="toggle-auth" class="text-blue-600 font-bold ml-1">
                        ${this.isLogin ? "Regístrate" : "Inicia sesión"}
                    </button>
                </p>
            </div>
        `;

    this.addEventListeners(container);
    return container;
  }

  addEventListeners(element) {
    const form = element.querySelector("#auth-form");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = element.querySelector("#email").value;
      const password = element.querySelector("#password").value;

      // Deshabilitar botón para evitar múltiples clics
      const btn = form.querySelector("button");
      btn.disabled = true;
      btn.innerText = "Cargando...";

      // Esta función vendrá desde main.js
      await this.onAuthSubmit(email, password, this.isLogin);
    });

    element.querySelector("#toggle-auth").addEventListener("click", () => {
      this.isLogin = !this.isLogin;
      const app = document.getElementById("app");
      app.innerHTML = "";
      app.appendChild(this.render());
    });

    element
      .querySelector("#auth-form")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        // Aquí llamarás a tu lógica de Firebase
        console.log("Procesando...", this.isLogin ? "Login" : "Registro");
        this.onAuthSuccess(); // Simulación de éxito
      });
  }
}
