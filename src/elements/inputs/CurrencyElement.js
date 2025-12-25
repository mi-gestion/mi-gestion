import { BaseInput } from "./BaseInput.js";

export class CurrencyElement extends BaseInput {
  constructor() {
    super("currency", "💲", "Moneda");
  }

  // ... (renderTemplate y extractConfig se mantienen igual, no afectan la lógica runtime) ...
  // Se asume que heredas el renderTemplate del original o de BaseInput si no es específico.
  // Aquí incluyo extractConfig y renderTemplate mínimos necesarios si los tenías custom:

  extractConfig(c) {
    const base = super.extractConfig(c);
    base.symbol = c.querySelector('[name="symbol"]')?.value || "$";
    return base;
  }

  renderEditor(c, v = "", ctx = "form") {
    const symbol = c.symbol || "$";
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

  attachListeners(container, onChange) {
    const input = container.querySelector(".math-input");
    if (!input) return;

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    input.addEventListener("blur", () => {
      const raw = input.value;
      if (!raw) {
        if (typeof onChange === "function") onChange("");
        return;
      }

      // Sanitización
      const expression = raw
        .replace(/,/g, ".")
        .replace(/[^0-9+\-*/().\s]/g, "");

      // Cálculo seguro
      let resultVal = null;

      if (!isNaN(expression)) {
        resultVal = parseFloat(expression);
      } else if (/[+\-*/]/.test(expression)) {
        try {
          resultVal = new Function("return " + expression)();
        } catch (e) {}
      }

      if (resultVal !== null && isFinite(resultVal)) {
        // Visual: Formato moneda (2 decimales)
        input.value = resultVal.toFixed(2);
        // Estado: Guardamos el número flotante real
        if (typeof onChange === "function")
          onChange(parseFloat(resultVal.toFixed(2)));
      }
    });
  }

  renderPrint(c, v, ctx) {
    const symbol = c.symbol || "$";
    const num = parseFloat(v);
    const valFormatted = !isNaN(num)
      ? num.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : v || "0.00";

    const displayValue = `${symbol} ${valFormatted}`;

    if (ctx === "table") {
      return `<div class="text-right font-mono">${displayValue}</div>`;
    }
    return `<div><strong>${c.label}:</strong> <span class="font-mono">${displayValue}</span></div>`;
  }
  renderWhatsapp(c, v) {
    const val = v === null || v === undefined || v === "" ? "---" : v;
    const suffix = this.type === "percentage" ? "%" : "";
    // Los tres backticks ``` crean el bloque de código
    return `*${c.label}:* \`\`\`${val}${suffix}\`\`\`\n`;
  }
}
