export class Navbar {
  // 1. Añade 'onProfile' al constructor
  constructor(userName, onLogout, onProfile) {
    this.userName = userName;
    this.onLogout = onLogout;
    this.onProfile = onProfile; // Guardamos la referencia
  }

  render() {
    const e = document.createElement("nav");
    e.className =
      "bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm";
    e.innerHTML = `
        <div class="text-xl font-bold text-blue-600 cursor-pointer" id="logo-home">
            Mi Gestión
        </div>
        <div class="flex items-center gap-6">
            <button id="profile-btn" class="text-gray-600 hover:text-blue-600 transition flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50">
                <span class="hidden sm:inline">Perfil: <strong>${this.userName}</strong></span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
            </button>
            <button id="logout-btn" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition font-medium">
                Salir
            </button>
        </div>
    `;

    // 2. Conecta el evento click a la función recibida
    e.querySelector("#profile-btn").addEventListener("click", this.onProfile);
    e.querySelector("#logout-btn").addEventListener("click", this.onLogout);

    return e;
  }
}
