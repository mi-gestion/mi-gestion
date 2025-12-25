import { BaseInput } from "./BaseInput.js";

export class UrlElement extends BaseInput {
  constructor() {
    super("url", "🔗", "Enlace");
  }

  parseValue(v) {
    // Normaliza la entrada para asegurar que siempre sea un objeto {url, text}
    if (typeof v === "object" && v !== null) {
      return { url: v.url || "", text: v.text || "" };
    }
    if (typeof v === "string" && v.trim().startsWith("{")) {
      try {
        return JSON.parse(v);
      } catch {
        return { url: v, text: "" };
      }
    }
    // Fallback para strings simples (legacy)
    return { url: v || "", text: "" };
  }

  renderEditor(c, v = "", ctx = "form") {
    const val = this.parseValue(v);

    // NOTA: Se eliminaron los atributos 'oninput="${syncer}"' y el input hidden .url-storage
    // Ahora usamos data-role para identificar los inputs en JS.

    if (ctx === "table") {
      return `
            <div class="url-group min-w-[200px] flex flex-col gap-1">
                <input type="text" data-role="text" class="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.text}" placeholder="Texto">
                <input type="url" data-role="url" class="w-full p-1 border rounded text-xs text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.url}" placeholder="URL">
            </div>
        `;
    }

    return this.renderInContext(
      c,
      `
        <div class="url-group grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Texto del Enlace</span>
                <input type="text" data-role="text" class="w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm" 
                    value="${val.text}" placeholder="Ej: Web Oficial">
            </div>
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Dirección (URL)</span>
                <input type="url" data-role="url" class="w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm font-mono text-blue-600" 
                    value="${val.url}" placeholder="https://...">
            </div>
        </div>
    `,
      ctx
    );
  }

  attachListeners(container, onChange) {
    const textInput = container.querySelector('[data-role="text"]');
    const urlInput = container.querySelector('[data-role="url"]');

    if (!textInput || !urlInput) return;

    const updateState = () => {
      const newVal = {
        text: textInput.value,
        url: urlInput.value,
      };

      // Notificar al StateManager
      if (typeof onChange === "function") {
        onChange(newVal);
      }

      // Compatibilidad con TableElement antiguo (si se usa extractValue)
      container.value = newVal;
    };

    textInput.addEventListener("input", updateState);
    urlInput.addEventListener("input", updateState);
  }

  // Mantenemos extractValue por si acaso algún proceso legacy lo llama,
  // pero intentará leer del valor adjunto al contenedor o del DOM como fallback.
  extractValue(container) {
    if (container.value) return container.value;

    const t = container.querySelector('[data-role="text"]')?.value || "";
    const u = container.querySelector('[data-role="url"]')?.value || "";
    return { text: t, url: u };
  }

  renderPrint(c, v, ctx) {
    const val = this.parseValue(v);
    if (!val.url) return ctx === "table" ? "-" : "";

    const displayText = val.text || val.url;
    // Sanitización básica de URL para evitar href="javascript:..."
    const safeUrl = val.url.replace(/["'<>;]/g, "");

    const link = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${displayText} ↗</a>`;

    if (ctx === "table") return link;
    return `<div><strong>${c.label}:</strong> ${link}</div>`;
  }
}
