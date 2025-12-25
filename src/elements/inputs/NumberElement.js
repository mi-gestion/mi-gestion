import { BaseInput } from "./BaseInput.js";

export class NumberElement extends BaseInput {
  constructor() {
    super("number", "#", "Numérico");
  }

  // Se agrega este método para controlar la visualización (no edición)
  renderPrint(c, v, ctx) {
    const val = v || "";

    if (ctx === "table") {
      // Alineación a la derecha específicamente para la tabla
      return `<div class="text-right">${val}</div>`;
    }

    // Vista estándar para impresión o detalles (Layout vertical)
    return `<div><strong>${c.label}:</strong> ${val}</div>`;
  }

  renderEditor(c, v = "", ctx = "form") {
    // Usamos type="text" y inputmode="decimal" para permitir fórmulas y teclado numérico en móviles
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

  attachListeners(container) {
    const input = container.querySelector(".math-input");
    if (!input) return;

    // 1. Al presionar ENTER, quitamos el foco para activar el cálculo
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      }
    });

    // 2. Al perder el foco: Evaluar operación y alinear a la derecha
    input.addEventListener("blur", () => {
      const raw = input.value;
      if (!raw) return;

      try {
        // Permitimos solo caracteres seguros: números, operadores y puntos/comas
        // Reemplazamos comas por puntos para JS
        const expression = raw
          .replace(/,/g, ".")
          .replace(/[^0-9+\-*/().\s]/g, "");

        // Si no hay operadores, no hacemos nada (es solo un número)
        if (!/[+\-*/]/.test(expression)) return;

        // Evaluamos de forma segura
        const result = new Function("return " + expression)();

        if (isFinite(result)) {
          // Redondeamos a 2 decimales si es necesario y eliminamos decimales .00
          input.value = parseFloat(result.toFixed(4)) * 1;
        }
      } catch (e) {
        // Si la fórmula está mal, dejamos el texto tal cual para que el usuario corrija
        console.warn("Error en fórmula matemática", e);
      }
    });
  }
}
