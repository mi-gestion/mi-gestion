import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class ProfileView {
  constructor(user, vaultKey, onGenerateVaultKey) {
    this.user = user;
    this.vaultKey = vaultKey;
    this.onGenerateVaultKey = onGenerateVaultKey;
  }

  async loadActivityLogs(db) {
    const container = document.getElementById("activity-log-container");
    const q = query(
      collection(db, "user_metadata", this.user.uid, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    container.innerHTML = "";
    snap.forEach((doc) => {
      const d = doc.data();
      const time = d.timestamp
        ? new Date(d.timestamp.toMillis()).toLocaleString()
        : "...";
      container.innerHTML += `
        <div class="flex justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
            <div><p class="text-sm font-bold">${d.action}</p><p class="text-xs text-gray-500">${d.details}</p></div>
            <span class="text-xs text-gray-400">${time}</span>
        </div>`;
    });
  }

  render() {
    const div = document.createElement("div");
    div.className = "max-w-4xl mx-auto p-6 space-y-6";
    div.innerHTML = `
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 class="text-2xl font-bold mb-6">Seguridad y Actividad</h2>
          <div class="grid md:grid-cols-2 gap-6">
              <div class="p-6 bg-gray-50 rounded-2xl border">
                  <h3 class="font-bold">Nivel 1: Login</h3>
                  <p class="text-sm text-gray-600">Cifrado básico activo.</p>
              </div>
              <div class="p-6 border-2 ${
                this.vaultKey ? "border-blue-500 bg-blue-50" : "border-dashed"
              } rounded-2xl">
                  <h3 class="font-bold">Nivel 2: Bóveda</h3>
                  <button id="setup-vault-btn" class="mt-4 w-full py-2 ${
                    this.vaultKey ? "bg-gray-200" : "bg-blue-600 text-white"
                  } rounded-xl font-bold">
                      ${this.vaultKey ? "Bóveda Abierta" : "Abrir Bóveda"}
                  </button>
              </div>
          </div>
          <div class="mt-10">
              <h3 class="font-bold mb-4">Log de Actividad (Servidor)</h3>
              <div id="activity-log-container" class="space-y-2 text-sm text-gray-400 text-center">Cargando...</div>
          </div>
      </div>`;
    div.querySelector("#setup-vault-btn").addEventListener("click", () => {
      const p = prompt("Frase maestra (>10 caracteres):");
      if (p && p.length >= 10) this.onGenerateVaultKey(p);
    });
    return div;
  }
}
