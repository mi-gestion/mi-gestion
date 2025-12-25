export class AuthView {
  constructor(onAuthSubmit) {
    this.onAuthSubmit = onAuthSubmit;
    this.isLogin = true;
    this.passwordVisible = false;
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "min-h-screen flex items-center justify-center p-4 bg-gray-50";

    container.innerHTML = `
            <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 class="text-3xl font-extrabold text-center text-gray-900 mb-8">
                    ${
                      this.isLogin
                        ? "Bienvenido de nuevo"
                        : "Crear cuenta segura"
                    }
                </h2>
                
                <form id="auth-form" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="email" required 
                               class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
                    </div>

                    <div class="relative">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="${
                          this.passwordVisible ? "text" : "password"
                        }" id="password" required 
                               class="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                           >
                        <button type="button" id="toggle-password" class="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
                            ${this.passwordVisible ? "👁️‍🗨️" : "👁️"}
                        </button>
                    </div>

                    ${
                      !this.isLogin
                        ? `
                    <div id="password-requirements" class="text-xs space-y-1 mt-2 p-3 bg-gray-50 rounded-lg">
                        <p id="req-length" class="text-gray-500">• Mínimo 8 caracteres</p>
                        <p id="req-upper" class="text-gray-500">• Una mayúscula y una minúscula</p>
                        <p id="req-number" class="text-gray-500">• Un número y un carácter especial</p>
                    </div>
                    `
                        : ""
                    }

                    <button type="submit" id="submit-btn" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50">
                        ${this.isLogin ? "Entrar" : "Registrar mi gestión"}
                    </button>
                </form>

                <p class="mt-6 text-center text-sm text-gray-500">
                    ${this.isLogin ? "¿No tienes cuenta?" : "¿Ya eres usuario?"}
                    <button id="toggle-auth" class="text-blue-600 font-bold hover:underline ml-1">
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
    const passInput = element.querySelector("#password");
    const emailInput = element.querySelector("#email");
    const togglePassBtn = element.querySelector("#toggle-password");
    const submitBtn = element.querySelector("#submit-btn");

    // 1. Lógica del "Ojito" (Funciona tanto en Login como en Registro)
    togglePassBtn.addEventListener("click", () => {
      this.passwordVisible = !this.passwordVisible;

      // Cambiamos el tipo de input y el icono sin re-renderizar todo el componente
      passInput.type = this.passwordVisible ? "text" : "password";
      togglePassBtn.innerHTML = this.passwordVisible ? "👁️‍🗨️" : "👁️";

      // Mantenemos el foco para una mejor experiencia de usuario
      passInput.focus();
    });

    // 2. Validación de Fortaleza de Contraseña (Solo se activa en modo Registro)
    if (!this.isLogin) {
      passInput.addEventListener("input", (e) => {
        const val = e.target.value;

        // Definición de requisitos
        const checks = {
          length: val.length >= 8,
          upper: /[A-Z]/.test(val) && /[a-z]/.test(val),
          number: /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val),
        };

        // Actualización visual de los indicadores
        this.updateRequirementUI(element, "req-length", checks.length);
        this.updateRequirementUI(element, "req-upper", checks.upper);
        this.updateRequirementUI(element, "req-number", checks.number);

        // Habilitar/Deshabilitar botón de envío según validación
        submitBtn.disabled = !(checks.length && checks.upper && checks.number);

        // Estilo visual del botón cuando está deshabilitado
        if (submitBtn.disabled) {
          submitBtn.classList.add("opacity-50", "cursor-not-allowed");
        } else {
          submitBtn.classList.remove("opacity-50", "cursor-not-allowed");
        }
      });
    }

    // 3. Envío del Formulario
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = emailInput.value;
      const password = passInput.value;

      // Estado visual de carga
      submitBtn.disabled = true;
      const originalText = submitBtn.innerText;
      submitBtn.innerText = "Procesando...";

      try {
        // Llamada a la función handleAuth definida en main.js
        await this.onAuthSubmit(email, password, this.isLogin);
      } catch (error) {
        console.error("Error en autenticación:", error);
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
      }
    });

    // 4. Cambio entre Login y Registro
    element.querySelector("#toggle-auth").addEventListener("click", () => {
      this.isLogin = !this.isLogin;
      // Reiniciamos la visibilidad de la contraseña al cambiar de modo
      this.passwordVisible = false;

      // En este caso sí refrescamos el componente completo para cambiar la estructura
      const app = document.getElementById("app");
      app.innerHTML = "";
      app.appendChild(this.render());
    });
  }

  updateRequirementUI(element, id, isValid) {
    const el = element.querySelector(`#${id}`);
    if (el) {
      el.className = isValid ? "text-green-600 font-medium" : "text-gray-500";
      el.innerHTML = isValid
        ? `✓ ${el.innerText.substring(2)}`
        : `• ${el.innerText.substring(2)}`;
    }
  }

  refresh(element) {
    const app = document.getElementById("app");
    app.innerHTML = "";
    app.appendChild(this.render());
  }
}
