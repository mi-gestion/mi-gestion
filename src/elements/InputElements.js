import { BaseElement } from "./BaseElement.js";

class BaseInput extends BaseElement {
  constructor(type, icon, label) {
    super(type, icon, label, "input");
  }

  getDefaults() {
    if (
      [
        "string",
        "number",
        "date",
        "currency",
        "percentage",
        "email",
        "url",
        "password",
        "boolean",
        "select",
      ].includes(this.type)
    ) {
      return { ed: 2, pr: 4 };
    }
    return { ed: 4, pr: 8 };
  }

  // MODIFICADO: Lógica de contexto
  renderTemplate(id, data = {}, context = "main") {
    const defs = this.getDefaults();

    // 1. Lógica para el campo REQUERIDO (Checkbox vs Select)
    let requiredFieldHtml;
    if (context === "table") {
      requiredFieldHtml = `
            <div class="flex items-center pt-5">
                <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                    <input type="checkbox" name="required" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" ${
                      data.required ? "checked" : ""
                    }>
                    <span class="text-[10px] font-bold uppercase text-gray-600">Es Obligatorio</span>
                </label>
            </div>
        `;
    } else {
      requiredFieldHtml = `
            <div>
                <label class="text-[10px] font-bold uppercase text-gray-500">Requerido</label>
                <select name="required" class="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="false" ${
                      !data.required ? "selected" : ""
                    }>Opcional</option>
                    <option value="true" ${
                      data.required ? "selected" : ""
                    }>Obligatorio (*)</option>
                </select>
            </div>
        `;
    }

    // 2. Lógica para LAYOUT (Mostrar solo si NO es tabla)
    const layoutHtml =
      context === "table"
        ? ""
        : BaseElement.renderLayoutConfig(data, defs.ed, defs.pr);

    return `
            <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2">
                    <label class="text-[10px] font-bold uppercase text-gray-500">Etiqueta del Campo</label>
                    <input type="text" name="label" value="${
                      data.label || ""
                    }" class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Nombre del Cliente">
                </div>
                
                ${requiredFieldHtml}

                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-500">Placeholder / Ayuda</label>
                    <input type="text" name="placeholder" value="${
                      data.placeholder || ""
                    }" class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ayuda visual...">
                </div>
            </div>
            ${layoutHtml}
            `;
  }

  extractConfig(c) {
    const baseConfig = super.extractConfig(c);

    // Extracción inteligente: Detectar si es Checkbox o Select
    const reqInput = c.querySelector('[name="required"]');
    let isRequired = false;

    if (reqInput) {
      if (reqInput.type === "checkbox") {
        isRequired = reqInput.checked;
      } else {
        isRequired = reqInput.value === "true";
      }
    }

    return {
      ...baseConfig,
      label: c.querySelector('[name="label"]').value,
      required: isRequired,
      placeholder: c.querySelector('[name="placeholder"]').value,
    };
  }

  renderInContext(config, inputHTML, context) {
    if (context === "table") return inputHTML;
    return `
            <div class="mb-1">
                <label class="block text-sm font-bold text-gray-700 mb-1">
                    ${config.label} ${
      config.required ? '<span class="text-red-500">*</span>' : ""
    }
                </label>
                ${inputHTML}
                ${
                  config.placeholder
                    ? `<p class="text-[10px] text-gray-400 mt-0.5">${config.placeholder}</p>`
                    : ""
                }
            </div>`;
  }

  extractValue(c) {
    return c.querySelector("input, textarea, select").value;
  }
}

// --- IMPLEMENTACIONES ---
export class StringElement extends BaseInput {
  constructor() {
    super("string", "Abc", "Texto Corto");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded transition focus:ring-2 focus:ring-blue-100 outline-none border-gray-300";
    return this.renderInContext(
      c,
      `<input type="text" class="${cls}" value="${v}">`,
      ctx
    );
  }
}

export class TextElement extends BaseInput {
  constructor() {
    super("text", "¶¶", "Texto Largo");
  }
  renderEditor(c, v = "", ctx = "form") {
    if (ctx === "table")
      return `<input type="text" class="w-full p-1 border rounded text-xs" value="${v}" title="${v}">`;
    return this.renderInContext(
      c,
      `<textarea class="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-100 outline-none border-gray-300">${v}</textarea>`,
      ctx
    );
  }
}

export class NumberElement extends BaseInput {
  constructor() {
    super("number", "#", "Numérico");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs text-right"
        : "w-full p-2 border rounded";
    return this.renderInContext(
      c,
      `<input type="number" class="${cls}" value="${v}">`,
      ctx
    );
  }
}

export class PasswordElement extends BaseInput {
  constructor() {
    super("password", "🔑", "Sensible");
  }
  renderEditor(c, v = "", ctx) {
    return this.renderInContext(
      c,
      `<input type="password" class="w-full p-2 border rounded bg-gray-50" value="${v}" readonly onfocus="this.removeAttribute('readonly');">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return ctx === "table"
      ? "***"
      : `<div><strong>${c.label}:</strong> ***</div>`;
  }
}
export class CurrencyElement extends BaseInput {
  constructor() {
    super("currency", "💲", "Moneda");
  }

  // 1. CONFIGURACIÓN: Agregamos el campo "Símbolo"
  renderTemplate(id, data, context = "main") {
    const defs = this.getDefaults();

    // Replicamos lógica de Required (Checkbox vs Select) para mantener consistencia
    let requiredFieldHtml;
    if (context === "table") {
      requiredFieldHtml = `
            <div class="flex items-center pt-5">
                <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                    <input type="checkbox" name="required" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" ${
                      data.required ? "checked" : ""
                    }>
                    <span class="text-[10px] font-bold uppercase text-gray-600">Es Obligatorio</span>
                </label>
            </div>`;
    } else {
      requiredFieldHtml = `
            <div>
                <label class="text-[10px] font-bold uppercase text-gray-500">Requerido</label>
                <select name="required" class="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="false" ${
                      !data.required ? "selected" : ""
                    }>Opcional</option>
                    <option value="true" ${
                      data.required ? "selected" : ""
                    }>Obligatorio (*)</option>
                </select>
            </div>`;
    }

    const layoutHtml =
      context === "table"
        ? ""
        : BaseElement.renderLayoutConfig(data, defs.ed, defs.pr);

    return `
        <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
                <label class="text-[10px] font-bold uppercase text-gray-500">Etiqueta</label>
                <input type="text" name="label" value="${
                  data.label || ""
                }" class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            ${requiredFieldHtml}

            <div>
                 <label class="text-[10px] font-bold uppercase text-gray-500">Placeholder</label>
                 <input type="text" name="placeholder" value="${
                   data.placeholder || ""
                 }" class="w-full p-2 border rounded text-sm">
            </div>

            <div>
                 <label class="text-[10px] font-bold uppercase text-gray-500">Moneda (Símbolo)</label>
                 <input type="text" name="symbol" value="${
                   data.symbol || "$"
                 }" class="w-full p-2 border rounded text-sm font-bold text-center">
            </div>
        </div>
        ${layoutHtml}
    `;
  }

  extractConfig(c) {
    const base = super.extractConfig(c);
    // Capturamos el símbolo (si está vacío, forzamos $)
    base.symbol = c.querySelector('[name="symbol"]').value || "$";
    return base;
  }

  // 2. EDITOR: Usamos el símbolo dinámico en el input visual
  renderEditor(c, v = "", ctx = "form") {
    const symbol = c.symbol || "$";

    // Si estamos en una tabla, el input es compacto
    if (ctx === "table") {
      return this.renderInContext(
        c,
        `<div class="relative">
                <input type="number" step="0.01" class="w-full p-1 pl-5 border rounded text-xs text-right" value="${v}" placeholder="0.00">
                <span class="absolute left-1 top-1 text-gray-400 text-[10px] font-bold">${symbol}</span>
             </div>`,
        ctx
      );
    }

    // Modo Formulario Normal
    return this.renderInContext(
      c,
      `<div class="relative">
            <span class="absolute left-3 top-2 text-gray-500 font-bold select-none">${symbol}</span>
            <input type="number" step="0.01" class="w-full p-2 pl-8 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 font-mono" value="${v}" placeholder="0.00">
         </div>`,
      ctx
    );
  }

  // 3. IMPRESIÓN: Formateo correcto con el símbolo elegido
  renderPrint(c, v, ctx) {
    const symbol = c.symbol || "$";
    // Formateamos el número para que se vea bien (ej: 1,234.56)
    const valFormatted = v
      ? parseFloat(v).toLocaleString("es-ES", { minimumFractionDigits: 2 })
      : "0.00";
    const displayValue = `${symbol} ${valFormatted}`;

    if (ctx === "table") {
      return `<div class="text-right font-mono">${displayValue}</div>`;
    }

    return `<div><strong>${c.label}:</strong> <span class="font-mono">${displayValue}</span></div>`;
  }
}
export class PercentageElement extends BaseInput {
  constructor() {
    super("percentage", "%", "Porcentaje");
  }
  renderEditor(c, v = "", ctx) {
    return this.renderInContext(
      c,
      `<div class="relative"><input type="number" class="w-full p-2 pr-6 border rounded" value="${v}" placeholder="${
        c.placeholder || ""
      }"><span class="absolute right-3 top-2 text-gray-500">%</span></div>`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}%</div>`;
  }
}
export class BooleanElement extends BaseInput {
  constructor() {
    super("boolean", "☑️", "Si/No");
  }
  renderEditor(c, v, ctx) {
    return this.renderInContext(
      c,
      `<select class="w-full p-2 border rounded"><option>No</option><option>Si</option></select>`,
      ctx
    );
  }
}
export class DateElement extends BaseInput {
  constructor() {
    super("date", "📅", "Fecha");
  }
  renderEditor(c, v = "", ctx) {
    return this.renderInContext(
      c,
      `<input type="date" class="w-full p-2 border rounded" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}</div>`;
  }
}
export class EmailElement extends BaseInput {
  constructor() {
    super("email", "@", "Email");
  }
  renderEditor(c, v = "", ctx) {
    return this.renderInContext(
      c,
      `<input type="email" class="w-full p-2 border rounded" value="${v}">`,
      ctx
    );
  }
}
export class UrlElement extends BaseInput {
  constructor() {
    super("url", "🔗", "Enlace");
  }
  renderEditor(c, v = "", ctx) {
    return this.renderInContext(
      c,
      `<input type="url" class="w-full p-2 border rounded" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}</div>`;
  }
}

export class SelectElement extends BaseInput {
  constructor() {
    super("select", "▼", "Opciones");
  }

  renderTemplate(id, data, context = "main") {
    const defs = this.getDefaults();

    // Replicamos lógica de Required Checkbox vs Select
    let requiredFieldHtml;
    if (context === "table") {
      requiredFieldHtml = `
            <div class="flex items-center pt-5">
                <label class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200 transition">
                    <input type="checkbox" name="required" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" ${
                      data.required ? "checked" : ""
                    }>
                    <span class="text-[10px] font-bold uppercase text-gray-600">Es Obligatorio</span>
                </label>
            </div>`;
    } else {
      requiredFieldHtml = `
            <div>
                <label class="text-[10px] font-bold uppercase text-gray-500">Requerido</label>
                <select name="required" class="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="false" ${
                      !data.required ? "selected" : ""
                    }>Opcional</option>
                    <option value="true" ${
                      data.required ? "selected" : ""
                    }>Obligatorio (*)</option>
                </select>
            </div>`;
    }

    const layoutHtml =
      context === "table"
        ? ""
        : BaseElement.renderLayoutConfig(data, defs.ed, defs.pr);

    return `
        <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
                <label class="text-[10px] font-bold uppercase text-gray-500">Etiqueta</label>
                <input type="text" name="label" value="${
                  data.label || ""
                }" class="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            ${requiredFieldHtml}
            <div>
                 <label class="text-[10px] font-bold uppercase text-gray-500">Placeholder</label>
                 <input type="text" name="placeholder" value="${
                   data.placeholder || ""
                 }" class="w-full p-2 border rounded text-sm">
            </div>
             <div class="col-span-2 mt-2">
                <label class="text-[10px] font-bold text-gray-500 uppercase">Opciones (sep. coma)</label>
                <input type="text" name="options" value="${
                  data.options || ""
                }" class="w-full p-2 border rounded text-sm" placeholder="Opción A, Opción B, Opción C">
            </div>
        </div>
        ${layoutHtml}
    `;
  }

  extractConfig(c) {
    const base = super.extractConfig(c);
    base.options = c.querySelector('[name="options"]').value;
    return base;
  }

  renderEditor(c, v, ctx = "form") {
    const opts = (c.options || "").split(",").map((o) => o.trim());
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded bg-white";
    const html = `<select class="${cls}">
        ${
          c.placeholder
            ? `<option value="" disabled selected>${c.placeholder}</option>`
            : ""
        }
        ${opts
          .map(
            (o) =>
              `<option value="${o}" ${v === o ? "selected" : ""}>${o}</option>`
          )
          .join("")}
    </select>`;
    return this.renderInContext(c, html, ctx);
  }
}
