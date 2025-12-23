export class BaseElement {
  /**
   * @param {string} type - Identificador interno (ej: 'string')
   * @param {string} icon - Emoji o icono
   * @param {string} label - Nombre legible
   * @param {string} category - 'structure', 'input', 'complex'
   */
  constructor(type, icon, label, category = "input") {
    this.type = type;
    this.icon = icon;
    this.label = label;
    this.category = category;
  }

  // --- MODO DISEÑO (PLANTILLA) ---
  renderTemplate(id, currentConfig = {}) {
    return `<div class="p-2 text-gray-400 italic">Sin configuración extra</div>`;
  }

  extractConfig(container) {
    return {};
  }

  // --- MODO USO (EDITOR) ---
  // context puede ser: 'form' (normal con labels) o 'table' (compacto sin labels)
  renderEditor(config, currentValue, context = "form") {
    return "";
  }

  extractValue(container) {
    return null;
  }

  // --- MODO IMPRESIÓN ---
  // context puede ser: 'normal', 'compact', 'easy' o 'table'
  renderPrint(config, value, context = "normal") {
    if (!value) return "";
    if (context === "table") return value;
    return `<div><strong>${config.label}:</strong> ${value}</div>`;
  }
}
