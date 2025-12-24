import { BaseInput } from "./BaseInput.js";

export class PercentageElement extends BaseInput {
  constructor() {
    super("percentage", "%", "Porcentaje");
  }

  renderEditor(c, v = "", ctx = "form") {
    // En tabla input directo, en form con contenedor relativo
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

  attachListeners(container) {
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
      if (!raw) return;
      try {
        const expression = raw
          .replace(/,/g, ".")
          .replace(/[^0-9+\-*/().\s]/g, "");
        if (!/[+\-*/]/.test(expression)) return;

        const result = new Function("return " + expression)();
        if (isFinite(result)) {
          input.value = parseFloat(result.toFixed(2));
        }
      } catch (e) {}
    });
  }

  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}%</div>`;
  }
}
