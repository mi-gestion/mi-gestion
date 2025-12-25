export class BaseElement {
  constructor(type, icon, label, category = "input") {
    this.type = type;
    this.icon = icon;
    this.label = label;
    this.category = category;
  }

  static renderLayoutConfig(data, defaultEd = 4, defaultPr = 8) {
    const colEd = data.colSpanEditor || defaultEd;
    const colPr = data.colSpanPrint || defaultPr;

    return `
      <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <label class="text-[10px] font-bold uppercase text-gray-500 block mb-1">
            Ancho Edición (Max 4)
          </label>
          <input type="range" name="colSpanEditor" min="1" max="4" step="1" value="${colEd}" 
            class="w-full accent-blue-600 cursor-pointer" 
            oninput="this.nextElementSibling.innerText = this.value + '/4'">
          <div class="text-right text-xs font-bold text-blue-600">${colEd}/4</div>
        </div>
        <div>
          <label class="text-[10px] font-bold uppercase text-gray-500 block mb-1">
            Ancho Impresión (Max 8)
          </label>
          <input type="range" name="colSpanPrint" min="1" max="8" step="1" value="${colPr}" 
            class="w-full accent-gray-600 cursor-pointer" 
            oninput="this.nextElementSibling.innerText = this.value + '/8'">
          <div class="text-right text-xs font-bold text-gray-600">${colPr}/8</div>
        </div>
      </div>
    `;
  }

  // ACEPTAR 'context'
  renderTemplate(id, currentConfig = {}, context = "main") {
    return `
      <div class="p-2 text-gray-400 italic">Sin configuración extra</div>
      ${
        context === "table" ? "" : BaseElement.renderLayoutConfig(currentConfig)
      }
    `;
  }

  extractConfig(container) {
    const colEd = container.querySelector('[name="colSpanEditor"]')?.value;
    const colPr = container.querySelector('[name="colSpanPrint"]')?.value;
    return {
      colSpanEditor: colEd ? parseInt(colEd) : 4,
      colSpanPrint: colPr ? parseInt(colPr) : 8,
    };
  }

  renderEditor(config, currentValue, context = "form") {
    return "";
  }
  extractValue(container) {
    return null;
  }
  renderPrint(config, value, context = "normal") {
    if (!value) return "";
    if (context === "table") return value;
    return `<div><strong>${config.label}:</strong> ${value}</div>`;
  }
  /**
   * NUEVO: Lógica de exportación a WhatsApp por defecto
   * @param {Object} c - Configuración del campo (template)
   * @param {any} v - Valor del campo
   */
  renderWhatsapp(c, v) {
    // Manejo seguro de vacíos
    const val = v === null || v === undefined || v === "" ? "---" : v;
    return `*${c.label || this.label}:* ${val}\n`;
  }
}
