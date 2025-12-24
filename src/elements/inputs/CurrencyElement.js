import { BaseInput } from "./BaseInput.js";
import { BaseElement } from "../BaseElement.js";

export class CurrencyElement extends BaseInput {
  constructor() {
    super("currency", "💲", "Moneda");
  }

  renderTemplate(id, data, context = "main") {
    // Reutilizamos lógica de BaseInput pero inyectamos el campo Symbol
    // Nota: Copiamos parte del template para inyectar el campo, manteniendo la consistencia
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
    base.symbol = c.querySelector('[name="symbol"]').value || "$";
    return base;
  }

  renderEditor(c, v = "", ctx = "form") {
    const symbol = c.symbol || "$";

    // Lógica CSS para alineación dinámica (text-right -> focus:text-left)
    const alignClasses = "text-right focus:text-left transition-all";

    if (ctx === "table") {
      return this.renderInContext(
        c,
        `<div class="relative">
                <input type="text" inputmode="decimal" class="w-full p-1 pr-6 border rounded text-xs math-input ${alignClasses}" value="${v}" placeholder="0.00">
                <span class="absolute right-1 top-1 text-gray-400 text-[10px] font-bold pointer-events-none">${symbol}</span>
             </div>`,
        ctx
      );
    }

    return this.renderInContext(
      c,
      `<div class="relative">
            <input type="text" inputmode="decimal" class="w-full p-2 pr-8 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 font-mono math-input ${alignClasses}" value="${v}" placeholder="${
        c.placeholder || "0.00"
      }">
            <span class="absolute right-3 top-2 text-gray-500 font-bold select-none pointer-events-none">${symbol}</span>
         </div>`,
      ctx
    );
  }

  attachListeners(container) {
    const input = container.querySelector(".math-input");
    if (!input) return;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur(); // Dispara el evento blur
      }
    });

    input.addEventListener("blur", () => {
      const raw = input.value;
      if (!raw) return;

      try {
        // Sanitización: Permitir números y operadores
        const expression = raw
          .replace(/,/g, ".")
          .replace(/[^0-9+\-*/().\s]/g, "");

        // Si es solo texto/numero sin operadores, salimos
        if (!/[+\-*/]/.test(expression)) return;

        // Evaluación segura
        const result = new Function("return " + expression)();

        if (isFinite(result)) {
          // Formato Moneda: 2 decimales fijos suele ser mejor, pero flexible
          input.value = result.toFixed(2);
        }
      } catch (e) {
        console.warn("Fórmula inválida");
      }
    });
  }

  renderPrint(c, v, ctx) {
    const symbol = c.symbol || "$";
    // Intentamos formatear si es numérico
    const num = parseFloat(v);
    const valFormatted = !isNaN(num)
      ? num.toLocaleString("es-ES", { minimumFractionDigits: 2 })
      : v || "0.00";
    const displayValue = `${symbol} ${valFormatted}`;

    if (ctx === "table") {
      return `<div class="text-right font-mono">${displayValue}</div>`;
    }
    return `<div><strong>${c.label}:</strong> <span class="font-mono">${displayValue}</span></div>`;
  }
}
