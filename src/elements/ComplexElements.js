import { BaseElement } from "./BaseElement.js";
import { ElementRegistry } from "./ElementRegistry.js";

// --- UTILIDADES GLOBALES PARA LA TABLA ---
window.TableDesignerUtils = {
  getColsFromDOM: (id) => {
    const container = document.getElementById(`cols-list-${id}`);
    if (!container) return [];
    const blocks = container.querySelectorAll(".table-col-block");
    return Array.from(blocks).map((block) => {
      const type = block.dataset.type;
      const strategy = ElementRegistry.get(type);
      const configArea = block.querySelector(".element-config-area");
      const config = strategy.extractConfig(configArea);
      return { type, config };
    });
  },

  renderCols: (id, cols) => {
    const list = document.getElementById(`cols-list-${id}`);
    const hiddenInput = document.getElementById(`columns-input-${id}`);
    hiddenInput.value = JSON.stringify(cols);

    if (cols.length === 0) {
      list.innerHTML =
        '<div class="text-xs text-gray-400 italic text-center py-6 border-2 border-dashed border-gray-100 rounded-lg">Sin columnas. Agrega una abajo.</div>';
      return;
    }

    list.innerHTML = cols
      .map((col, idx) => {
        const strategy = ElementRegistry.get(col.type);
        const colId = `${id}-col-${idx}`;

        // AQUI PASAMOS EL CONTEXTO 'table'
        const innerTemplate = strategy.renderTemplate(
          colId,
          col.config || {},
          "table"
        );

        return `
            <div class="table-col-block group relative bg-white border border-gray-200 rounded-xl p-3 mb-3 hover:border-blue-300 hover:shadow-sm transition animate-fade-in" data-type="${
              col.type
            }">
                <div class="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${strategy.icon}</span>
                        <span class="text-xs font-bold uppercase text-blue-600">${
                          strategy.label
                        }</span>
                    </div>
                    <div class="flex gap-1 items-center bg-gray-50 rounded-lg p-0.5">
                         <button type="button" title="Subir" onclick="window.TableDesignerUtils.moveCol('${id}', ${idx}, -1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed" ${
          idx === 0 ? "disabled" : ""
        }>↑</button>
                        <button type="button" title="Bajar" onclick="window.TableDesignerUtils.moveCol('${id}', ${idx}, 1)" class="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-blue-600 transition disabled:opacity-30 disabled:cursor-not-allowed" ${
          idx === cols.length - 1 ? "disabled" : ""
        }>↓</button>
                        <div class="w-px h-4 bg-gray-200 mx-1"></div>
                        <button type="button" title="Eliminar" onclick="window.TableDesignerUtils.removeCol('${id}', ${idx})" class="w-6 h-6 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-gray-400 hover:text-red-500 transition">🗑️</button>
                    </div>
                </div>
                <div class="element-config-area">
                    ${innerTemplate}
                </div>
            </div>
        `;
      })
      .join("");
  },

  addCol: (id) => {
    let cols = window.TableDesignerUtils.getColsFromDOM(id);
    const typeSelect = document.getElementById(`add-col-type-${id}`);
    const type = typeSelect.value;
    cols.push({ type, config: {} });
    window.TableDesignerUtils.renderCols(id, cols);
  },

  removeCol: (id, idx) => {
    let cols = window.TableDesignerUtils.getColsFromDOM(id);
    if (!confirm("¿Eliminar esta columna?")) return;
    cols.splice(idx, 1);
    window.TableDesignerUtils.renderCols(id, cols);
  },

  moveCol: (id, idx, dir) => {
    let cols = window.TableDesignerUtils.getColsFromDOM(id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= cols.length) return;
    [cols[idx], cols[newIdx]] = [cols[newIdx], cols[idx]];
    window.TableDesignerUtils.renderCols(id, cols);
  },
};

export class TableElement extends BaseElement {
  constructor() {
    super("table", "▦", "Tabla Dinámica", "complex");
  }

  renderTemplate(id, data = {}) {
    const columns = data.columns || [];
    const columnsJson = JSON.stringify(columns).replace(/"/g, "&quot;");
    const inputTypes = ElementRegistry.getGrouped().input.items;

    return `
            <div class="space-y-4 table-designer" data-id="${id}">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-500">Título de la Tabla</label>
                    <input type="text" name="label" value="${
                      data.label || ""
                    }" class="w-full p-2 border rounded text-sm font-bold text-gray-700 placeholder-gray-300">
                </div>
                
                <div class="border rounded-lg p-3 bg-gray-50 border-gray-200">
                     <label class="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Columnas</label>
                     <div class="columns-list mb-4 min-h-[50px]" id="cols-list-${id}">
                        <div class="text-center text-xs text-gray-400">Cargando columnas...</div>
                     </div>

                     <div class="flex gap-2 items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                        <div class="flex-1">
                             <select id="add-col-type-${id}" class="w-full p-2 border rounded text-xs bg-gray-50 outline-none cursor-pointer">
                                ${inputTypes
                                  .map(
                                    (t) =>
                                      `<option value="${t.type}">${t.icon} ${t.label}</option>`
                                  )
                                  .join("")}
                             </select>
                        </div>
                        <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold" onclick="window.TableDesignerUtils.addCol('${id}')">+</button>
                     </div>
                     
                     <input type="hidden" name="columns" id="columns-input-${id}" value="${columnsJson}">
                     <script>setTimeout(() => { const cols = JSON.parse(document.getElementById('columns-input-${id}').value || '[]'); window.TableDesignerUtils.renderCols('${id}', cols); }, 0);</script>
                </div>
            </div>
            ${BaseElement.renderLayoutConfig(data, 4, 8)} 
        `;
  }

  extractConfig(c) {
    const base = super.extractConfig(c);
    const designerDiv = c.querySelector(".table-designer");
    const id = designerDiv.dataset.id;
    const currentCols = window.TableDesignerUtils.getColsFromDOM(id);
    return {
      ...base,
      label: c.querySelector('[name="label"]').value,
      columns: currentCols,
    };
  }
  // renderEditor, renderPrint, etc. se mantienen igual
  renderEditor(config, value = []) {
    const cols = config.columns || [];
    const rows = Array.isArray(value) ? value : [];
    const rowsHtml = rows
      .map((row) => this.generateRowHtml(cols, row))
      .join("");
    const colsConfigJson = JSON.stringify(cols).replace(/"/g, "&quot;");

    return `
            <div class="mb-8 table-container" data-cols="${colsConfigJson}">
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
                                  .map((c) => {
                                    const header = c.config
                                      ? c.config.label
                                      : c.header;
                                    return `<th class="px-3 py-2 border-b font-bold tracking-wider min-w-[120px]">${header}</th>`;
                                  })
                                  .join("")}
                                <th class="w-8 border-b"></th>
                            </tr>
                        </thead>
                        <tbody>${rowsHtml}</tbody>
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
        const header = col.config ? col.config.label : col.header;
        const cellConfig = col.config || { label: header };
        const inputHtml = elementStrategy.renderEditor(
          cellConfig,
          rowData[header] || "",
          "table"
        );
        return `<td class="p-1 border-b align-top bg-white" data-header="${header}">${inputHtml}</td>`;
      })
      .join("");
    return `<tr class="group hover:bg-blue-50/50 transition">${cells}<td class="p-1 border-b text-center align-middle"><button type="button" class="text-gray-300 hover:text-red-500 delete-row-btn transition p-1 rounded hover:bg-red-50">×</button></td></tr>`;
  }

  attachListeners(container) {
    container.querySelectorAll(".add-row-btn").forEach((btn) => {
      btn.onclick = (e) => {
        const wrapper = e.target.closest(".table-container");
        const tbody = wrapper.querySelector("tbody");
        const cols = JSON.parse(wrapper.dataset.cols);
        const tr = document.createElement("tr");
        tr.className = "group hover:bg-blue-50/50 transition animate-fade-in";
        tr.innerHTML = this.generateRowHtml(cols, {});
        tbody.appendChild(tr);
        tr.querySelector(".delete-row-btn").onclick = () => tr.remove();
      };
    });
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
      if (Object.keys(rowData).length > 0) rows.push(rowData);
    });
    return rows;
  }

  renderPrint(config, value) {
    if (!value || value.length === 0) return "";
    const cols = config.columns || [];
    const rowsHtml = value
      .map((row) => {
        const cells = cols
          .map((col) => {
            const elementStrategy = ElementRegistry.get(col.type);
            const header = col.config ? col.config.label : col.header;
            const cellConfig = col.config || { label: header };
            const val = elementStrategy.renderPrint(
              cellConfig,
              row[header],
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
                              .map((c) => {
                                const header = c.config
                                  ? c.config.label
                                  : c.header;
                                return `<th class="border border-gray-300 p-2 text-left font-bold">${header}</th>`;
                              })
                              .join("")}
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
  }
}
