export class ProfileView {
  constructor(user, vaultKey, onGenerateVaultKey) {
    this.user = user;
    this.vaultKey = vaultKey; // Esta es la llave de Nivel 2 (si ya existe en memoria)
    this.onGenerateVaultKey = onGenerateVaultKey;
  }

  render() {
    const container = document.createElement("div");
    container.className = "max-w-4xl mx-auto p-6 space-y-6";

    container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">Configuración de Seguridad</h2>
                
                <div class="flex items-center gap-4 p-4 bg-blue-50 rounded-xl mb-8">
                    <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                        ${this.user.email[0].toUpperCase()}
                    </div>
                    <div>
                        <p class="text-sm text-blue-600 font-medium">Usuario Autenticado</p>
                        <p class="text-gray-900 font-bold">${
                          this.user.email
                        }</p>
                    </div>
                </div>

                <div class="grid gap-6 md:grid-cols-2">
                    <div class="p-6 border border-gray-100 rounded-2xl bg-gray-50">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="p-2 bg-green-100 text-green-600 rounded-lg">🔓</span>
                            <h3 class="font-bold">Seguridad Intermedia</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-4">Cifrado activo basado en tu contraseña de acceso.</p>
                        <span class="text-xs font-mono bg-white px-2 py-1 rounded border">Estado: Activo</span>
                    </div>

                    <div class="p-6 border-2 ${
                      this.vaultKey
                        ? "border-blue-500 bg-blue-50"
                        : "border-dashed border-gray-300 bg-white"
                    } rounded-2xl">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="p-2 bg-blue-600 text-white rounded-lg">🛡️</span>
                            <h3 class="font-bold">Llave de la Bóveda</h3>
                        </div>
                        <p class="text-sm text-gray-600 mb-4">
                            ${
                              this.vaultKey
                                ? "Tu bóveda está abierta. Puedes acceder a tus documentos de máximo nivel."
                                : "Aún no has configurado tu llave maestra de seguridad máxima."
                            }
                        </p>
                        
                        <button id="setup-vault-btn" class="w-full py-2 px-4 ${
                          this.vaultKey
                            ? "bg-gray-200 text-gray-700"
                            : "bg-blue-600 text-white"
                        } rounded-xl font-bold transition hover:opacity-90">
                            ${
                              this.vaultKey
                                ? "Cambiar Llave Maestra"
                                : "Configurar Bóveda"
                            }
                        </button>
                    </div>
                </div>
            </div>
        `;

    this.addEventListeners(container);
    return container;
  }

  addEventListeners(element) {
    element.querySelector("#setup-vault-btn").addEventListener("click", () => {
      const masterPass = prompt(
        "Introduce una frase secreta para tu Bóveda (Nivel 2).\nESTA CLAVE NO SE PUEDE RECUPERAR."
      );
      if (masterPass && masterPass.length > 10) {
        this.onGenerateVaultKey(masterPass);
      } else {
        alert("La frase debe tener al menos 10 caracteres por seguridad.");
      }
    });
  }
}
