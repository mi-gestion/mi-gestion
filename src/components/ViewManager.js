import { CryptoManager } from "../utils/crypto.js";
import { ElementRegistry } from "../elements/ElementRegistry.js";
import { PrintManager } from "./PrintManager.js";
import { NotificationUtils } from "../utils/NotificationUtils.js"; // <--- IMPORTAR

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

    // Badge de Nivel
    const badgeColor =
      level === "2"
        ? "bg-indigo-100 text-indigo-700 border-indigo-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";

    const badgeIcon = level === "2" ? "🔒 Bóveda" : "🌍 Acceso";

    container.innerHTML = `
        <div id="print-backdrop" class="fixed inset-0 z-20 hidden cursor-default bg-white"></div>

        <div class="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-gray-100 relative z-30 gap-4">
            
            <div class="flex items-center gap-4">
                <button type="button" id="back-btn" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                </button>
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${badgeColor}">
                            ${badgeIcon}
                        </span>
                        <span class="text-xs text-gray-400">#${this.documentData.id.slice(
                          0,
                          6
                        )}</span>
                    </div>
                    <h1 class="text-3xl font-bold text-gray-900 leading-tight">${title}</h1>
                </div>
            </div>

            <div class="flex items-center gap-2 print:hidden">
                <button id="wa-share-btn" class="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 hover:shadow-sm transition active:scale-95 text-sm font-semibold group" title="Copiar para WhatsApp">
                    <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    <span class="hidden md:inline">WhatsApp</span>
                </button>

                <div class="h-6 w-px bg-gray-200 mx-1"></div>

                <button id="print-btn" class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Imprimir">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                </button>
                <button id="edit-btn" class="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95 text-sm font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    Editar
                </button>
            </div>
        </div>

        <div id="view-content" class="flex-1 relative">
            <div id="loading-spinner" class="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        </div>
    `;

    // Listeners
    container.querySelector("#back-btn").onclick = this.onClose;
    container.querySelector("#print-btn").onclick = () => {
      const pm = new PrintManager(
        this.documentData,
        this.decryptedValues,
        this.template
      );
      pm.print();
    };
    container.querySelector("#edit-btn").onclick = () => {
      if (this.onEdit) this.onEdit(this.decryptedValues);
    };

    // LISTENER DE WHATSAPP
    container.querySelector("#wa-share-btn").onclick = () =>
      this.shareToWhatsApp();

    this.loadAndShow(
      container.querySelector("#view-content"),
      container.querySelector("#loading-spinner")
    );

    return container;
  }

  async loadAndShow(contentContainer, spinner) {
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

      let html = '<div class="grid grid-cols-4 gap-6">';

      // Mapeo de columnas para grid CSS
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
          const span = el.colSpanEditor || 4;
          const gridClass = colSpanClasses[span] || "col-span-4";

          html += `
                <div class="${gridClass} p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md transition duration-300 group">
                    ${strategy.renderPrint(el, val, "normal")}
                </div>
            `;
        }
      });
      html += "</div>";

      const wrapper = document.createElement("div");
      wrapper.innerHTML = html;
      contentContainer.appendChild(wrapper);
    } catch (err) {
      console.error(err);
      spinner.innerHTML = `<p class="text-red-500">Error: ${err.message}</p>`;
    }
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

      let html = '<div class="grid grid-cols-4 gap-6">';

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
  // ==========================================
  // 🟢 LOGICA DE EXPORTACIÓN A WHATSAPP
  // ==========================================
  async shareToWhatsApp() {
    try {
      const title = this.documentData.title || "Documento";
      const date = new Date().toLocaleDateString();

      // 1. Cabecera Fija
      let msg = `*${title.toUpperCase()}*\n`;
      msg += `_📅 ${date}_\n`;
      msg += `══════════════════════\n`;

      // 2. ITERACIÓN POLIMÓRFICA (Aquí está el secreto)
      this.template.elements.forEach((el) => {
        // Obtenemos la instancia correspondiente (Number, Date, Header, etc.)
        const strategy = ElementRegistry.get(el.type);

        // Valor desencriptado para este ID
        const val = this.decryptedValues[el.id];

        // Si el elemento tiene el método, lo usamos
        if (strategy && typeof strategy.renderWhatsapp === "function") {
          msg += strategy.renderWhatsapp(el, val);
        } else {
          // Fallback por si acaso alguien olvidó implementarlo en una clase nueva
          msg += `*${el.label}:* ${val || ""}\n`;
        }
      });

      // 3. Footer
      msg += `\n> 🔒 _Datos protegidos por Mi Gestión_`;

      // 4. Portapapeles
      await navigator.clipboard.writeText(msg);
      NotificationUtils.show("Copiado para WhatsApp", "success");
    } catch (err) {
      console.error(err);
      NotificationUtils.show("Error al copiar", "error");
    }
  }
}
