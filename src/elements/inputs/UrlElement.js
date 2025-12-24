import { BaseInput } from "./BaseInput.js";

export class UrlElement extends BaseInput {
  constructor() {
    super("url", "🔗", "Enlace");
  }

  renderEditor(c, v = "", ctx = "form") {
    let val = { url: "", text: "" };
    if (typeof v === "string" && v) {
      if (v.trim().startsWith("{")) {
        try {
          val = JSON.parse(v);
        } catch {
          val = { url: v, text: "" };
        }
      } else {
        val = { url: v, text: "" };
      }
    } else if (typeof v === "object" && v) {
      val = v;
    }

    const jsonVal = JSON.stringify(val).replace(/"/g, "&quot;");
    const hidden = `<input type="hidden" class="url-storage" value="${jsonVal}">`;

    const syncer = `
        const container = this.closest('.url-group');
        const u = container.querySelector('.url-input').value;
        const t = container.querySelector('.text-input').value;
        container.querySelector('.url-storage').value = JSON.stringify({ url: u, text: t });
    `;

    if (ctx === "table") {
      return `
            <div class="url-group min-w-[200px]">
                ${hidden}
                <input type="text" class="text-input w-full p-1 border rounded text-xs mb-1 focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.text}" placeholder="Texto" oninput="${syncer}">
                <input type="url" class="url-input w-full p-1 border rounded text-xs text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.url}" placeholder="URL" oninput="${syncer}">
            </div>
        `;
    }

    return this.renderInContext(
      c,
      `
        <div class="url-group grid grid-cols-1 sm:grid-cols-2 gap-2">
            ${hidden}
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Texto del Enlace</span>
                <input type="text" class="text-input w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm" 
                    value="${val.text}" placeholder="Ej: Web Oficial" oninput="${syncer}">
            </div>
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Dirección (URL)</span>
                <input type="url" class="url-input w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm font-mono text-blue-600" 
                    value="${val.url}" placeholder="https://..." oninput="${syncer}">
            </div>
        </div>
    `,
      ctx
    );
  }

  renderPrint(c, v, ctx) {
    let val = { url: "", text: "" };
    if (typeof v === "string" && v) {
      if (v.trim().startsWith("{")) {
        try {
          val = JSON.parse(v);
        } catch {
          val = { url: v, text: v };
        }
      } else {
        val = { url: v, text: v };
      }
    }

    if (!val.url) return ctx === "table" ? "-" : "";

    const displayText = val.text || val.url;
    const link = `<a href="${val.url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${displayText} ↗</a>`;

    if (ctx === "table") return link;
    return `<div><strong>${c.label}:</strong> ${link}</div>`;
  }
}
