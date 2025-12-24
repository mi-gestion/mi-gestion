import { BaseElement } from "../BaseElement.js";

export class BaseInput extends BaseElement {
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
      ].includes(this.type)
    ) {
      return { ed: 2, pr: 4 };
    }
    return { ed: 4, pr: 8 };
  }

  renderTemplate(id, data = {}, context = "main") {
    const defs = this.getDefaults();

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
