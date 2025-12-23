import { BaseElement } from "./BaseElement.js";

// Clase Base para Inputs con lógica de Contexto
class BaseInput extends BaseElement {
  constructor(type, icon, label) {
    super(type, icon, label, "input");
  }

  renderTemplate(id, data = {}) {
    return `
            <div class="grid grid-cols-2 gap-3">
                <div class="col-span-2">
                    <label class="text-[10px] font-bold uppercase text-gray-500">Etiqueta</label>
                    <input type="text" name="label" value="${
                      data.label || ""
                    }" class="w-full p-2 border rounded text-sm">
                </div>
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-500">Requerido</label>
                    <select name="required" class="w-full p-2 border rounded text-sm bg-white">
                        <option value="false" ${
                          !data.required ? "selected" : ""
                        }>No</option>
                        <option value="true" ${
                          data.required ? "selected" : ""
                        }>Sí</option>
                    </select>
                </div>
            </div>`;
  }

  extractConfig(c) {
    return {
      label: c.querySelector('[name="label"]').value,
      required: c.querySelector('[name="required"]').value === "true",
    };
  }

  // --- HELPER DE CONTEXTO ---
  renderInContext(config, inputHTML, context) {
    if (context === "table") {
      // EN TABLA: Solo el input limpio
      return inputHTML;
    }
    // EN FORMULARIO: Con Label y márgenes
    return `
            <div class="mb-4">
                <label class="block text-sm font-bold text-gray-700 mb-1">
                    ${config.label} ${
      config.required ? '<span class="text-red-500">*</span>' : ""
    }
                </label>
                ${inputHTML}
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
        : "w-full p-2 border rounded";
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
      `<textarea class="w-full p-2 border rounded h-24">${v}</textarea>`,
      ctx
    );
  }
}

export class PasswordElement extends BaseInput {
  constructor() {
    super("password", "🔑", "Sensible");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs bg-gray-50"
        : "w-full p-2 border rounded bg-gray-50";
    return this.renderInContext(
      c,
      `<input type="password" class="${cls}" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return ctx === "table"
      ? "***"
      : `<div><strong>${c.label}:</strong> ***</div>`;
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

export class CurrencyElement extends BaseInput {
  constructor() {
    super("currency", "💲", "Moneda");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs text-right"
        : "w-full p-2 pl-6 border rounded";
    const html =
      ctx === "table"
        ? `<input type="number" step="0.01" class="${cls}" value="${v}" placeholder="$">`
        : `<div class="relative"><span class="absolute left-3 top-2 text-gray-500">$</span><input type="number" step="0.01" class="${cls}" value="${v}"></div>`;
    return this.renderInContext(c, html, ctx);
  }
  renderPrint(c, v, ctx) {
    const val = new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
    }).format(v || 0);
    return ctx === "table"
      ? `<div class="text-right">${val}</div>`
      : `<div><strong>${c.label}:</strong> ${val}</div>`;
  }
}

export class PercentageElement extends BaseInput {
  constructor() {
    super("percentage", "%", "Porcentaje");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs text-right"
        : "w-full p-2 pr-6 border rounded";
    const html =
      ctx === "table"
        ? `<input type="number" class="${cls}" value="${v}" placeholder="%">`
        : `<div class="relative"><input type="number" class="${cls}" value="${v}"><span class="absolute right-3 top-2 text-gray-500">%</span></div>`;
    return this.renderInContext(c, html, ctx);
  }
  renderPrint(c, v, ctx) {
    return ctx === "table"
      ? `<div class="text-right">${v}%</div>`
      : `<div><strong>${c.label}:</strong> ${v}%</div>`;
  }
}

export class BooleanElement extends BaseInput {
  constructor() {
    super("boolean", "☑️", "Si/No");
  }
  renderEditor(c, v, ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded";
    const html = `<select class="${cls}"><option value="No" ${
      v === "No" ? "selected" : ""
    }>No</option><option value="Si" ${
      v === "Si" ? "selected" : ""
    }>Si</option></select>`;
    return this.renderInContext(c, html, ctx);
  }
}

export class DateElement extends BaseInput {
  constructor() {
    super("date", "📅", "Fecha");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded";
    return this.renderInContext(
      c,
      `<input type="date" class="${cls}" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    const val = v ? new Date(v).toLocaleDateString() : "-";
    return ctx === "table"
      ? val
      : `<div><strong>${c.label}:</strong> ${val}</div>`;
  }
}

export class EmailElement extends BaseInput {
  constructor() {
    super("email", "@", "Email");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded";
    return this.renderInContext(
      c,
      `<input type="email" class="${cls}" value="${v}">`,
      ctx
    );
  }
}

export class UrlElement extends BaseInput {
  constructor() {
    super("url", "🔗", "Enlace");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded";
    return this.renderInContext(
      c,
      `<input type="url" class="${cls}" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    const val = `<a href="${v}" target="_blank" class="text-blue-600 underline">${v}</a>`;
    return ctx === "table"
      ? val
      : `<div><strong>${c.label}:</strong> ${val}</div>`;
  }
}

export class SelectElement extends BaseInput {
  constructor() {
    super("select", "▼", "Opciones");
  }
  renderTemplate(id, data) {
    return `${super.renderTemplate(id, data)}
            <div class="mt-2"><label class="text-[10px] font-bold text-gray-500 uppercase">Opciones (sep. coma)</label><input type="text" name="options" value="${
              data.options || ""
            }" class="w-full p-2 border rounded text-sm"></div>`;
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
    const html = `<select class="${cls}">${opts
      .map(
        (o) => `<option value="${o}" ${v === o ? "selected" : ""}>${o}</option>`
      )
      .join("")}</select>`;
    return this.renderInContext(c, html, ctx);
  }
}
