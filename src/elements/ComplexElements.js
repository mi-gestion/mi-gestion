import { BaseElement } from "./BaseElement.js";
import { ElementRegistry } from "./ElementRegistry.js";

// --- UTILIDADES GLOBALES PARA LA TABLA ---
// Definimos esto fuera de la clase para que esté disponible globalmente
// sin depender de la ejecución de scripts inline.
window.TableDesignerUtils = {
  renderCols: (id) => {
    const list = document.getElementById(`cols-list-${id}`);
    const input = document.getElementById(`columns-input-${id}`);
    if (!list || !input) return;

    let cols = [];
    try {
      cols = JSON.parse(input.value || "[]");
    } catch (e) {
      cols = [];
    }

    if (cols.length === 0) {
      list.innerHTML =
        '<div class="text-xs text-gray-400 italic text-center">Sin columnas definidas</div>';
      return;
    }

    list.innerHTML = cols
      .map(
        (c, idx) => `
            <div class="flex items-center justify-between bg-white p-2 border rounded shadow-sm animate-fade-in">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-700">${c.header}</span>
                    <span class="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold border border-blue-100">${c.type}</span>
                </div>
                <button type="button" onclick="window.TableDesignerUtils.removeCol('${id}', ${idx})" class="text-gray-300 hover:text-red-500 font-bold px-2">×</button>
            </div>
        `
      )
      .join("");
  },

  addCol: (id) => {
    const headerInput = document.getElementById(`new-col-header-${id}`);
    const typeInput = document.getElementById(`new-col-type-${id}`);
    const hiddenInput = document.getElementById(`columns-input-${id}`);

    const header = headerInput.value.trim();
    const type = typeInput.value;

    if (!header) {
      headerInput.focus();
      headerInput.classList.add("border-red-400");
      return;
    }
    headerInput.classList.remove("border-red-400");

    let cols = JSON.parse(hiddenInput.value || "[]");
    cols.push({ header, type });
    hiddenInput.value = JSON.stringify(cols);

    headerInput.value = ""; // Limpiar input
    window.TableDesignerUtils.renderCols(id); // Re-pintar lista
  },

  removeCol: (id, idx) => {
    const hiddenInput = document.getElementById(`columns-input-${id}`);
    let cols = JSON.parse(hiddenInput.value || "[]");
    cols.splice(idx, 1);
    hiddenInput.value = JSON.stringify(cols);
    window.TableDesignerUtils.renderCols(id);
  },
};

// --- CLASE DEL ELEMENTO TABLA ---

export class TableElement extends BaseElement {
  constructor() {
    super("table", "▦", "Tabla Dinámica", "complex");
  }

  // --- MODO DISEÑO (TEMPLATE) ---
  renderTemplate(id, data = {}) {
    const columns = data.columns || [];
    // Obtenemos los tipos de inputs disponibles dinámicamente
    const inputTypes = ElementRegistry.getGrouped().input.items;
    const columnsJson = JSON.stringify(columns).replace(/"/g, "&quot;");

    // Generamos el HTML inicial de la lista de columnas "Pre-renderizado"
    // para que se vea bien antes de cualquier interacción
    const initialListHtml =
      columns.length === 0
        ? '<div class="text-xs text-gray-400 italic text-center">Sin columnas definidas</div>'
        : columns
            .map(
              (c, idx) => `
                <div class="flex items-center justify-between bg-white p-2 border rounded shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold text-gray-700">${c.header}</span>
                        <span class="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded uppercase font-bold border border-blue-100">${c.type}</span>
                    </div>
                    <button type="button" onclick="window.TableDesignerUtils.removeCol('${id}', ${idx})" class="text-gray-300 hover:text-red-500 font-bold px-2">×</button>
                </div>`
            )
            .join("");

    return `
            <div class="space-y-4 table-designer" data-id="${id}">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-500">Título de la Tabla</label>
                    <input type="text" name="label" value="${
                      data.label || ""
                    }" class="w-full p-2 border rounded text-sm font-bold text-gray-700 placeholder-gray-300">
                </div>
                
                <div class="border rounded-lg p-3 bg-gray-50 border-gray-200">
                    <label class="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Columnas de Datos</label>
                    
                    <div class="columns-list space-y-2 mb-3" id="cols-list-${id}">
                        ${initialListHtml}
                    </div>

                    <div class="flex gap-2 items-end border-t border-gray-200 pt-3">
                        <div class="flex-1">
                            <label class="text-[10px] text-gray-400 font-bold uppercase">Encabezado</label>
                            <input type="text" id="new-col-header-${id}" class="w-full p-1.5 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" placeholder="Ej: Precio Unitario">
                        </div>
                        <div class="w-32">
                            <label class="text-[10px] text-gray-400 font-bold uppercase">Tipo de Dato</label>
                            <select id="new-col-type-${id}" class="w-full p-1.5 border rounded text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none">
                                ${inputTypes
                                  .map(
                                    (t) =>
                                      `<option value="${t.type}">${t.label}</option>`
                                  )
                                  .join("")}
                            </select>
                        </div>
                        <button type="button" class="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg text-sm font-bold w-8 h-8 flex items-center justify-center shadow-sm transition" onclick="window.TableDesignerUtils.addCol('${id}')">
                            +
                        </button>
                    </div>
                    
                    <input type="hidden" name="columns" id="columns-input-${id}" value="${columnsJson}">
                </div>
            </div>
        `;
  }

  extractConfig(c) {
    return {
      label: c.querySelector('[name="label"]').value,
      columns: JSON.parse(c.querySelector('[name="columns"]').value || "[]"),
    };
  }

  // --- MODO EDITOR (USO) ---
  renderEditor(config, value = []) {
    const cols = config.columns || [];
    const rows = Array.isArray(value) ? value : [];
    const rowsHtml = rows
      .map((row) => this.generateRowHtml(cols, row))
      .join("");
    const colsConfigJson = JSON.stringify(cols).replace(/"/g, "&quot;");

    return `
            <div class="mb-8 table-container" data-cols='${colsConfigJson}'>
                <div class="flex justify-between items-end mb-2">
                    <label class="block text-sm font-bold text-blue-800 uppercase tracking-wide">${
                      config.label
                    }</label>
                </div>
                
                <div class="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-500 uppercase text-[10px]">
                            <tr>
                                ${cols
                                  .map(
                                    (c) =>
                                      `<th class="px-3 py-2 border-b font-bold tracking-wider">${c.header}</th>`
                                  )
                                  .join("")}
                                <th class="w-8 border-b"></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
                
                <button type="button" class="mt-2 text-blue-600 text-xs font-bold hover:text-blue-800 hover:underline add-row-btn flex items-center gap-1 transition">
                    <span class="bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center">+</span> Agregar Fila
                </button>
            </div>`;
  }

  generateRowHtml(cols, rowData = {}) {
    const cells = cols
      .map((col) => {
        const elementStrategy = ElementRegistry.get(col.type);
        // Renderizamos con contexto 'table' para inputs compactos
        const inputHtml = elementStrategy.renderEditor(
          { label: col.header },
          rowData[col.header] || "",
          "table"
        );
        return `<td class="p-1 border-b align-top bg-white" data-header="${col.header}">${inputHtml}</td>`;
      })
      .join("");
    return `
            <tr class="group hover:bg-blue-50/50 transition">
                ${cells}
                <td class="p-1 border-b text-center align-middle">
                    <button type="button" class="text-gray-300 hover:text-red-500 delete-row-btn transition p-1 rounded hover:bg-red-50">×</button>
                </td>
            </tr>
        `;
  }

  attachListeners(container) {
    // Agregar Fila
    container.querySelectorAll(".add-row-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const wrapper = e.target.closest(".table-container");
        const tbody = wrapper.querySelector("tbody");
        const cols = JSON.parse(wrapper.dataset.cols);

        const tr = document.createElement("tr");
        tr.className = "group hover:bg-blue-50/50 transition animate-fade-in";
        tr.innerHTML = this.generateRowHtml(cols, {});
        tbody.appendChild(tr);

        // Listener borrar para la nueva fila
        tr.querySelector(".delete-row-btn").onclick = () => tr.remove();
      };
    });

    // Borrar Fila existente
    container.querySelectorAll(".delete-row-btn").forEach((btn) => {
      btn.onclick = (e) => e.target.closest("tr").remove();
    });
  }

  extractValue(container) {
    const rows = [];
    container.querySelectorAll("tbody tr").forEach((tr) => {
      const rowData = {};
      tr.querySelectorAll("td[data-header]").forEach((td) => {
        const header = td.dataset.header;
        const input = td.querySelector("input, select, textarea");
        if (input) rowData[header] = input.value;
      });
      // Filtrar filas vacías (opcional)
      if (Object.keys(rowData).length > 0) rows.push(rowData);
    });
    return rows;
  }

  // --- IMPRESIÓN ---
  renderPrint(config, value) {
    if (!value || value.length === 0) return "";
    const cols = config.columns || [];

    const rowsHtml = value
      .map((row) => {
        const cells = cols
          .map((col) => {
            const elementStrategy = ElementRegistry.get(col.type);
            const val = elementStrategy.renderPrint(
              { label: col.header },
              row[col.header],
              "table"
            );
            return `<td class="border border-gray-300 p-2 align-top">${val}</td>`;
          })
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `
            <div class="mb-6 break-inside-avoid">
                <h4 class="font-bold text-sm mb-2 uppercase border-l-4 border-blue-500 pl-2 text-gray-700">${
                  config.label
                }</h4>
                <table class="w-full text-xs border-collapse border border-gray-300">
                    <thead>
                        <tr class="bg-gray-100 text-gray-600">
                            ${cols
                              .map(
                                (c) =>
                                  `<th class="border border-gray-300 p-2 text-left font-bold">${c.header}</th>`
                              )
                              .join("")}
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
  }
}
