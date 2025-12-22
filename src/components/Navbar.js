export class Navbar {
  constructor(userName, onLogout) {
    this.userName = userName;
    this.onLogout = onLogout;
  }

  render() {
    const nav = document.createElement("nav");
    nav.className =
      "bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm";

    nav.innerHTML = `
            <div class="text-xl font-bold text-blue-600 tracking-tight">
                Mi Gestión
            </div>
            <div class="flex items-center gap-6">
                <button class="text-gray-600 hover:text-blue-600 transition flex items-center gap-2">
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

    nav.querySelector("#logout-btn").addEventListener("click", this.onLogout);
    return nav;
  }
}
