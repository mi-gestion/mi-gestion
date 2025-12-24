import { BaseInput } from "./BaseInput.js";
import { BaseElement } from "../BaseElement.js";

export class SelectElement extends BaseInput {
  constructor() {
    super("select", "▼", "Opciones");
  }

  renderTemplate(id, data, context = "main") {
    const defs = this.getDefaults();

    // Replicamos lógica de Required
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
