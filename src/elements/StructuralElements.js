import { BaseElement } from "./BaseElement.js";

class BaseStructure extends BaseElement {
  constructor(type, icon, label) {
    super(type, icon, label, "structure");
  }

  renderTemplate(id, data = {}) {
    // Texto y Listas ocupan 4 de edición por defecto
    return `
            <div>
                <label class="text-xs font-bold text-gray-500 uppercase">Texto / Título</label>
                <input type="text" name="text" value="${
                  data.text || ""
                }" class="w-full p-2 border rounded font-bold" placeholder="Escribe aquí...">
            </div>
            ${BaseElement.renderLayoutConfig(data, 4, 8)}`;
  }
  extractConfig(c) {
    const base = super.extractConfig(c);
    return { ...base, text: c.querySelector('[name="text"]').value };
  }
  extractValue() {
    return null;
  }
}

// Paragraph necesita textarea, sobreescribimos template
export class ParagraphElement extends BaseElement {
  constructor() {
    super("paragraph", "¶", "Párrafo", "structure");
  }
  renderTemplate(id, data) {
    return `<div><label class="text-xs text-gray-500">Contenido</label><textarea name="text" class="w-full p-2 border rounded" rows="3">${
      data.text || ""
    }</textarea></div>${BaseElement.renderLayoutConfig(data, 4, 8)}`;
  }
  extractConfig(c) {
    const base = super.extractConfig(c);
    return { ...base, text: c.querySelector('[name="text"]').value };
  }
  renderEditor(c) {
    return `<p class="text-gray-600 mb-4 text-justify leading-relaxed">${c.text}</p>`;
  }
  renderPrint(c) {
    return `<p class="mb-2 text-justify text-sm">${c.text}</p>`;
  }
  renderWhatsapp(c, v) {
    // Usamos cursiva para notas/párrafos explicativos
    return `\n_${c.text}_\n`;
  }
}

// Listas
export class ListElement extends BaseElement {
  constructor(type = "list", icon = "•=", label = "Lista") {
    super(type, icon, label, "structure");
  }
  renderTemplate(id, data) {
    return `<div><label class="text-xs text-gray-500">Items (uno por línea)</label><textarea name="items" class="w-full p-2 border rounded h-24">${
      data.items ? data.items.join("\n") : ""
    }</textarea></div>${BaseElement.renderLayoutConfig(data, 4, 8)}`;
  }
  extractConfig(c) {
    const base = super.extractConfig(c);
    return {
      ...base,
      items: c
        .querySelector('[name="items"]')
        .value.split("\n")
        .filter((i) => i.trim() !== ""),
    };
  }
  renderEditor(c) {
    return `<ul class="list-disc pl-5 mb-4 space-y-1 text-gray-700">${(
      c.items || []
    )
      .map((i) => `<li>${i}</li>`)
      .join("")}</ul>`;
  }
  renderPrint(c) {
    return `<ul class="list-disc pl-5 mb-2 text-sm">${(c.items || [])
      .map((i) => `<li>${i}</li>`)
      .join("")}</ul>`;
  }
  renderWhatsapp(c, v) {
    return `\n📋\n ${(c.items || []).map((it) => `- ${it}\n`).join("")}\n`;
  }
}

export class SectionElement extends BaseStructure {
  constructor() {
    super("section", "🟦", "Sección");
  }
  renderEditor(c) {
    return `<div class="mt-8 mb-4 border-b-2 border-blue-100 pb-1"><h3 class="text-xl font-bold text-blue-800">${c.text}</h3></div>`;
  }
  renderPrint(c) {
    return `<h2 class="text-lg font-bold mt-6 mb-2 border-b border-gray-300 uppercase">${c.text}</h2>`;
  }
  renderWhatsapp(c, v) {
    return `\n🔹 *${c.text}* 🔹\n`;
  }
}
export class TitleElement extends BaseStructure {
  constructor() {
    super("title", "H1", "Título");
  }
  renderEditor(c) {
    return `<h1 class="text-3xl font-black text-gray-900 mb-4 text-center">${c.text}</h1>`;
  }
  renderPrint(c) {
    return `<h1 class="text-3xl font-bold text-center mb-6">${c.text}</h1>`;
  }
  renderWhatsapp(c, v) {
    return `\n👉 *${c.text.toUpperCase()}*\n`;
  }
}
export class SubtitleElement extends BaseStructure {
  constructor() {
    super("subtitle", "H2", "Subtítulo");
  }
  renderEditor(c) {
    return `<h2 class="text-xl font-bold text-gray-700 mb-2">${c.text}</h2>`;
  }
  renderPrint(c) {
    return `<h3 class="text-lg font-bold text-gray-700 mt-4 mb-2">${c.text}</h3>`;
  }
  renderWhatsapp(c, v) {
    return `\n👉 *${c.text.toUpperCase()}*\n`;
  }
}
export class EnumListElement extends ListElement {
  constructor() {
    super("enum-list", "123", "Lista Enum.");
  }
  renderEditor(c) {
    return `<ol class="list-decimal pl-5 mb-4 space-y-1 text-gray-700">${(
      c.items || []
    )
      .map((i) => `<li>${i}</li>`)
      .join("")}</ol>`;
  }
  renderPrint(c) {
    return `<ol class="list-decimal pl-5 mb-2 text-sm">${(c.items || [])
      .map((i) => `<li>${i}</li>`)
      .join("")}</ol>`;
  }
  renderWhatsapp(c, v) {
    return `\n📋\n ${(c.items || [])
      .map((it, i) => `*${i + 1}.* ${it}\n`)
      .join("")}\n`;
  }
}
