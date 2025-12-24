import { CryptoManager } from "../utils/crypto.js";
import { ElementRegistry } from "../elements/ElementRegistry.js";
import { PrintManager } from "./PrintManager.js";

export class ViewManager {
  constructor(documentData, template, userKey, vaultKey, onEdit, onClose) {
    this.documentData = documentData;
    this.template = template;
    this.userKey = userKey;
    this.vaultKey = vaultKey;
    this.onEdit = onEdit;
    this.onClose = onClose;

    this.decryptedValues = {};
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[80vh] flex flex-col animate-fade-in relative";

    const title = this.documentData.title || "Sin título";
    const level = this.documentData.level;
    const badgeColor =
      level === "2"
        ? "bg-blue-100 text-blue-700"
        : "bg-green-100 text-green-700";

    container.innerHTML = `
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <div class="flex items-center gap-4">
                <button type="button" id="back-btn" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">←</button>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-2xl">${this.template.icon}</span>
                        <span class="px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badgeColor}">Nivel ${level}</span>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-800">${title}</h1>
                </div>
            </div>
            
            <div class="flex items-center gap-2 relative">
                <button type="button" id="edit-btn" class="px-4 py-2 bg-gray-100 hover:bg-blue-50 text-blue-600 font-bold rounded-lg transition flex items-center gap-2">
                    <span>✏️</span> Editar
                </button>

                <div class="relative group">
                    <button type="button" id="print-toggle" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition flex items-center gap-2">
                        <span>🖨️</span> Imprimir
                    </button>
                    <div class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 hidden group-hover:block z-30 animate-fade-in">
                         <div class="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase text-center">Formato</div>
                         <button class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700" data-mode="normal">📄 Normal</button>
                         <button class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700" data-mode="compact">📊 Compacta</button>
                         <button class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700" data-mode="easy">👓 Lectura Fácil</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-content" class="flex-1 space-y-6 pb-10">
            <div id="loading-spinner" class="text-center py-20 text-gray-400">
                <span class="animate-pulse">🔓 Descifrando documento seguro...</span>
            </div>
        </div>
    `;

    container.querySelector("#back-btn").onclick = this.onClose;
    container.querySelector("#edit-btn").onclick = () => this.onEdit();

    container.querySelectorAll(".print-opt").forEach((btn) => {
      btn.onclick = () => {
        PrintManager.print(
          title,
          this.template,
          this.decryptedValues,
          btn.dataset.mode
        );
      };
    });

    this.decryptAndShow(
      container.querySelector("#view-content"),
      container.querySelector("#loading-spinner")
    );

    return container;
  }

  async decryptAndShow(contentContainer, spinner) {
    try {
      const keyToUse =
        this.documentData.level === "2" ? this.vaultKey : this.userKey;
      if (!keyToUse) throw new Error("Llave no disponible");

      const jsonString = await CryptoManager.decrypt(
        this.documentData.content,
        keyToUse
      );
      this.decryptedValues = JSON.parse(jsonString);

      spinner.classList.add("hidden");

      // --- AQUÍ EL CAMBIO CLAVE ---
      // 1. Usamos grid-cols-4 para igualar al editor
      let html = '<div class="grid grid-cols-4 gap-6">';

      // Mapa de clases estático para que Tailwind no falle
      const colSpanClasses = {
        1: "col-span-1",
        2: "col-span-2",
        3: "col-span-3",
        4: "col-span-4",
      };

      this.template.elements.forEach((el) => {
        const strategy = ElementRegistry.get(el.type);
        const val = this.decryptedValues[el.id];

        if (strategy) {
          // 2. Obtenemos el ancho configurado (default 4)
          const span = el.colSpanEditor || 4;
          const gridClass = colSpanClasses[span] || "col-span-4";

          html += `
                    <div class="${gridClass} p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition">
                        ${strategy.renderPrint(el, val, "normal")}
                    </div>
                `;
        }
      });
      html += "</div>";

      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      contentContainer.appendChild(wrapper);
    } catch (e) {
      console.error(e);
      spinner.innerHTML = `<p class="text-red-500 font-bold">Error al descifrar: ${e.message}</p>`;
    }
  }
}
