import { BaseInput } from "./BaseInput.js";

export class NumberElement extends BaseInput {
  constructor() {
    super("number", "#", "Numérico");
  }

  renderPrint(c, v, ctx) {
    const val = v !== undefined && v !== null ? v : "";
    if (ctx === "table") {
      return `<div class="text-right">${val}</div>`;
    }
    return `<div><strong>${c.label}:</strong> ${val}</div>`;
  }

  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs text-right focus:text-left transition-all"
        : "w-full p-2 border rounded text-right focus:text-left transition-all";

    return this.renderInContext(
      c,
      `<input type="text" inputmode="decimal" class="${cls} math-input" value="${v}" placeholder="${
        c.placeholder || ""
      }">`,
      ctx
    );
  }

  // Helper para cálculo seguro
  calculateSafe(expression) {
    try {
      // Solo permitimos números y operadores básicos
      if (/[^0-9+\-*/().\s]/.test(expression)) return null;
      return new Function("return " + expression)();
    } catch (e) {
      return null;
    }
  }

  attachListeners(container, onChange) {
    const input = container.querySelector(".math-input");
    if (!input) return;

    // Al presionar ENTER, quitamos el foco para activar el cálculo
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    // Al perder el foco: Calcular, formatear visualmente y guardar dato real
    input.addEventListener("blur", () => {
      const raw = input.value;
      if (!raw) {
        if (typeof onChange === "function") onChange("");
        return;
      }

      // Normalizar (coma por punto)
      const expression = raw.replace(/,/g, ".").trim();

      // Caso 1: Es solo un número
      if (!isNaN(expression)) {
        const val = parseFloat(expression);
        input.value = val * 1; // Visual: quitar ceros innecesarios
        if (typeof onChange === "function") onChange(val);
        return;
      }

      // Caso 2: Es una fórmula
      if (/[+\-*/]/.test(expression)) {
        const result = this.calculateSafe(expression);

        if (result !== null && isFinite(result)) {
          const finalVal = parseFloat(result.toFixed(4));
          input.value = finalVal * 1; // Actualizar DOM
          if (typeof onChange === "function") onChange(finalVal); // Actualizar Estado
        } else {
          // Si la fórmula es inválida, no guardamos basura, o guardamos el texto raw si prefieres
          // Por seguridad, mantenemos el valor previo en el estado si falla el cálculo
        }
      }
    });
  }
  renderWhatsapp(c, v) {
    const val = v === null || v === undefined || v === "" ? "---" : v;
    const suffix = this.type === "percentage" ? "%" : "";
    // Los tres backticks ``` crean el bloque de código
    return `*${c.label}:* \`\`\`${val}${suffix}\`\`\`\n`;
  }
}
