export class Navbar {
  // Añadimos onSettings al final
  constructor(
    userName,
    viewTitle,
    vaultIsOpen,
    onLogout,
    onVaultToggle,
    onSearch,
    onHome,
    onSettings
  ) {
    this.userName = userName;
    this.viewTitle = viewTitle;
    this.vaultIsOpen = vaultIsOpen;
    this.onLogout = onLogout;
    this.onVaultToggle = onVaultToggle;
    this.onSearch = onSearch;
    this.onHome = onHome;
    this.onSettings = onSettings; // Nuevo callback
  }

  render() {
    const nav = document.createElement("nav");
    // Mantenemos estilos existentes o los del plan Clean Glass si ya los aplicaste
    nav.className =
      "bg-white shadow-sm border-b border-gray-200 px-4 py-3 sticky top-0 z-50";

    const vaultColor = this.vaultIsOpen
      ? "bg-green-50 text-green-600 border-green-200"
      : "bg-red-50 text-red-600 border-red-200";
    const vaultIcon = this.vaultIsOpen ? "🔓" : "🔒";

    nav.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div class="flex items-center gap-3 cursor-pointer group" id="logo-home">
            <div class="bg-blue-600 p-2 rounded-lg shadow-md group-hover:scale-105 transition duration-200">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div>
                <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">Mi Gestión</span>
                <span class="block text-xl font-bold text-gray-800 leading-none">${
                  this.viewTitle
                }</span>
            </div>
        </div>

        <div class="flex-1 w-full md:w-auto max-w-md">
             <input type="text" id="search-input" class="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="Buscar documento...">
        </div>

        <div class="flex items-center gap-3">
            <button id="vault-toggle-btn" class="flex items-center gap-2 px-3 py-2 rounded-lg border ${vaultColor} transition hover:shadow-md text-sm font-semibold">
                <span>${vaultIcon}</span>
                <span class="hidden sm:inline">${
                  this.vaultIsOpen ? "Bóveda Abierta" : "Bóveda Cerrada"
                }</span>
            </button>
            
            <button id="settings-btn" class="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Configuración">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>

            <div class="h-6 w-px bg-gray-200 mx-1"></div>
            
            <button id="logout-btn" class="text-gray-500 hover:text-red-600 font-medium text-sm transition px-2 py-1">Salir</button>
        </div>
      </div>
    `;

    // Listeners
    nav.querySelector("#search-input").addEventListener("input", (e) => {
      if (this.onSearch) this.onSearch(e.target.value);
    });

    nav.querySelector("#vault-toggle-btn").addEventListener("click", () => {
      if (this.onVaultToggle) this.onVaultToggle();
    });

    nav.querySelector("#logout-btn").addEventListener("click", () => {
      if (this.onLogout) this.onLogout();
    });

    nav.querySelector("#logo-home").addEventListener("click", () => {
      if (this.onHome) this.onHome();
    });

    // Listener Settings
    nav.querySelector("#settings-btn").addEventListener("click", () => {
      if (this.onSettings) this.onSettings();
    });

    return nav;
  }
}
