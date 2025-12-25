import { BaseInput } from "./BaseInput.js";

export class PercentageElement extends BaseInput {
  constructor() {
    super("percentage", "%", "Porcentaje");
  }

  renderEditor(c, v = "", ctx = "form") {
    if (ctx === "table") {
      return `<div class="relative">
             <input type="text" inputmode="decimal" class="w-full p-1 pr-4 border rounded text-xs text-right focus:text-left math-input" value="${v}" placeholder="0">
             <span class="absolute right-1 top-1 text-gray-400 text-[10px] pointer-events-none">%</span>
        </div>`;
    }

    return this.renderInContext(
      c,
      `<div class="relative">
            <input type="text" inputmode="decimal" class="w-full p-2 pr-8 border rounded text-right focus:text-left math-input font-mono" value="${v}" placeholder="${
        c.placeholder || ""
      }">
            <span class="absolute right-3 top-2 text-gray-500 pointer-events-none">%</span>
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

      const expression = raw
        .replace(/,/g, ".")
        .replace(/[^0-9+\-*/().\s]/g, "");
      let resultVal = null;

      if (!isNaN(expression)) {
        resultVal = parseFloat(expression);
      } else if (/[+\-*/]/.test(expression)) {
        try {
          resultVal = new Function("return " + expression)();
        } catch (e) {}
      }

      if (resultVal !== null && isFinite(resultVal)) {
        // Visual
        input.value = parseFloat(resultVal.toFixed(2));
        // Estado
        if (typeof onChange === "function")
          onChange(parseFloat(resultVal.toFixed(2)));
      }
    });
  }

  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}%</div>`;
  }
  renderWhatsapp(c, v) {
    const val = v === null || v === undefined || v === "" ? "---" : v;
    const suffix = this.type === "percentage" ? "%" : "";
    // Los tres backticks ``` crean el bloque de código
    return `*${c.label}:* \`\`\`${val}${suffix}\`\`\`\n`;
  }
}
