export class Navbar {
  /**
   * @param {string} userName - Email del usuario
   * @param {string} viewTitle - Título del ambiente ("Mis Documentos" o "Galería de Plantillas") [NUEVO]
   * @param {boolean} vaultIsOpen - Estado de la bóveda
   * @param {function} onLogout - Logout
   * @param {function} onVaultToggle - Abrir/Cerrar bóveda
   * @param {function} onSearch - Función de búsqueda
   * @param {function} onHome - (Opcional) Para volver al inicio al dar clic en el logo
   */
  constructor(
    userName,
    viewTitle,
    vaultIsOpen,
    onLogout,
    onVaultToggle,
    onSearch,
    onHome
  ) {
    this.userName = userName;
    this.viewTitle = viewTitle;
    this.vaultIsOpen = vaultIsOpen;
    this.onLogout = onLogout;
    this.onVaultToggle = onVaultToggle;
    this.onSearch = onSearch;
    this.onHome = onHome;
  }

  render() {
    const nav = document.createElement("nav");
    nav.className =
      "bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm";

    const vaultColor = this.vaultIsOpen
      ? "bg-green-100 text-green-700 border-green-200"
      : "bg-yellow-50 text-yellow-600 border-yellow-200";
    const vaultIcon = this.vaultIsOpen ? "🔓" : "🔒";

    nav.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div class="flex items-center gap-3 cursor-pointer group" id="logo-home">
            <div class="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div class="flex flex-col">
                <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Mi Gestión</span>
                <span class="text-xl font-bold text-gray-800 leading-none">${
                  this.viewTitle
                }</span>
            </div>
        </div>

        <div class="flex-1 w-full md:w-auto max-w-md">
            <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <input type="text" id="search-input"
                    class="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                    placeholder="Buscar en ${this.viewTitle.toLowerCase()}..." 
                />
            </div>
        </div>

        <div class="flex items-center gap-3">
            <button id="vault-toggle-btn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg border ${vaultColor} transition hover:shadow-md active:scale-95 text-sm">
                <span>${vaultIcon}</span>
                <span class="font-bold hidden sm:inline">${
                  this.vaultIsOpen ? "Abierta" : "Cerrada"
                }</span>
            </button>
            <div class="h-6 w-px bg-gray-300 mx-1"></div>
            <button id="logout-btn" class="text-gray-500 hover:text-red-600 font-medium text-sm transition">Salir</button>
        </div>
      </div>
    `;

    nav
      .querySelector("#search-input")
      .addEventListener("input", (e) => this.onSearch(e.target.value));
    nav
      .querySelector("#vault-toggle-btn")
      .addEventListener("click", this.onVaultToggle);
    nav.querySelector("#logout-btn").addEventListener("click", this.onLogout);
    nav.querySelector("#logo-home").addEventListener("click", () => {
      if (this.onHome) this.onHome();
    });

    return nav;
  }
}
