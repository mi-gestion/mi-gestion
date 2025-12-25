import { BaseElement } from "./BaseElement.js";
import { ElementRegistry } from "./ElementRegistry.js";

// --- UTILIDADES GLOBALES PARA EL DISEÑADOR (CONFIGURACIÓN DE PLANTILLA) ---
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

  getColsHtml: (id, cols) => {
    if (!cols || cols.length === 0) {
      return '<div class="text-xs text-gray-400 italic text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white/50">Sin columnas definidas.<br>Añade una abajo.</div>';
    }
    return cols
      .map((col, idx) => {
        const strategy = ElementRegistry.get(col.type);
        const colId = `${id}-col-${idx}`;
        const innerTemplate = strategy.renderTemplate(
          colId,
          col.config || {},
          "table"
        );
        return `
            <div class="table-col-block group relative bg-white border border-gray-200 rounded-xl p-3 mb-3 hover:border-blue-400 hover:shadow-md transition animate-fade-in" data-type="${
              col.type
            }">
                <div class="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">${strategy.icon}</span>
                        <span class="text-xs font-bold uppercase text-blue-600">${
                          strategy.label
                        }</span>
                    </div>
                    <div class="flex gap-1 items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
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

  renderCols: (id, cols) => {
    const list = document.getElementById(`cols-list-${id}`);
    const hiddenInput = document.getElementById(`columns-input-${id}`);
    if (!list || !hiddenInput) return;
    hiddenInput.value = JSON.stringify(cols);
    list.innerHTML = window.TableDesignerUtils.getColsHtml(id, cols);
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

// --- UTILIDADES GLOBALES PARA EL EDITOR (MODAL DE DATOS) ---
window.TableEditorUtils = {
  activeContainer: null,
  activeRow: null,
  activeCols: [],

  openModal: (btn, isEdit = false) => {
    const container = btn.closest(".table-container");
    window.TableEditorUtils.activeContainer = container;
    window.TableEditorUtils.activeCols = JSON.parse(
      container.dataset.cols || "[]"
    );
    window.TableEditorUtils.activeRow = isEdit ? btn.closest("tr") : null;

    let currentValues = {};
    if (isEdit && window.TableEditorUtils.activeRow) {
      window.TableEditorUtils.activeRow
        .querySelectorAll("td[data-header]")
        .forEach((td) => {
          const header = td.dataset.header;
          const input = td.querySelector(
            "input.real-value, textarea.real-value, select.real-value"
          );
          const storage = td.querySelector(".url-storage");

          let val = "";
          if (storage) val = storage.value;
          else if (input) val = input.value;

          currentValues[header] = val;
        });
    }

    const overlay = document.createElement("div");
    overlay.id = "table-editor-modal";
    overlay.className =
      "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in";

    const modalHtml = `
            <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 class="font-bold text-gray-800 text-lg">
                        ${isEdit ? "✏️ Editar Fila" : "➕ Agregar Nuevo Item"}
                    </h3>
                    <button onclick="document.getElementById('table-editor-modal').remove()" class="text-gray-400 hover:text-red-500 font-bold text-xl px-2">×</button>
                </div>
                
                <div id="table-modal-form" class="p-6 overflow-y-auto space-y-5"></div>

                <div class="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
                    <button onclick="document.getElementById('table-editor-modal').remove()" class="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancelar</button>
                    <button onclick="window.TableEditorUtils.saveData()" class="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">
                        ${isEdit ? "Guardar Cambios" : "Agregar Item"}
                    </button>
                </div>
            </div>
        `;
    overlay.innerHTML = modalHtml;
    document.body.appendChild(overlay);

    const formContainer = overlay.querySelector("#table-modal-form");

    window.TableEditorUtils.activeCols.forEach((col) => {
      const strategy = ElementRegistry.get(col.type);
      const header = col.config ? col.config.label : col.header;
      const cellConfig = col.config || { label: header };
      const val = currentValues[header] || "";

      const wrapper = document.createElement("div");
      wrapper.className = "table-modal-field";
      wrapper.dataset.type = col.type;
      wrapper.dataset.header = header;

      wrapper.innerHTML = strategy.renderEditor(cellConfig, val, "form");
      formContainer.appendChild(wrapper);

      if (strategy.attachListeners) {
        strategy.attachListeners(wrapper);
      }
    });
  },

  saveData: () => {
    const modal = document.getElementById("table-editor-modal");
    const fields = modal.querySelectorAll(".table-modal-field");
    const rowData = {};

    fields.forEach((field) => {
      const type = field.dataset.type;
      const header = field.dataset.header;
      const strategy = ElementRegistry.get(type);
      const val = strategy.extractValue(field);
      rowData[header] = val;
    });

    const tableEl = new TableElement();
    const trHtml = tableEl.generateRowInnerHtml(
      window.TableEditorUtils.activeCols,
      rowData
    );

    if (window.TableEditorUtils.activeRow) {
      window.TableEditorUtils.activeRow.innerHTML = trHtml;
      tableEl.attachRowListeners(window.TableEditorUtils.activeRow);
    } else {
      const tbody =
        window.TableEditorUtils.activeContainer.querySelector("tbody");
      const tr = document.createElement("tr");
      tr.className = "group hover:bg-blue-50/50 transition animate-fade-in";
      tr.innerHTML = trHtml;
      tbody.appendChild(tr);
      tableEl.attachRowListeners(tr);
    }
    modal.remove();
  },
};

// --- CLASE DEL ELEMENTO TABLA ---

export class TableElement extends BaseElement {
  constructor() {
    super("table", "▦", "Tabla Dinámica", "complex");
  }

  renderTemplate(id, data = {}) {
    const columns = data.columns || [];
    const columnsJson = JSON.stringify(columns).replace(/"/g, "&quot;");
    const inputTypes = ElementRegistry.getGrouped().input.items;
    const initialColumnsHtml = window.TableDesignerUtils.getColsHtml(
      id,
      columns
    );

    return `
            <div class="space-y-4 table-designer" data-id="${id}">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-500">Título de la Tabla</label>
                    <input type="text" name="label" value="${
                      data.label || ""
                    }" class="w-full p-2 border rounded text-sm font-bold text-gray-700 placeholder-gray-300">
                </div>
                <div class="border rounded-lg p-3 bg-white border-gray-200">
                     <label class="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Configuración de Columnas</label>
                     <div class="columns-list mb-4 min-h-[50px] bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-inner" id="cols-list-${id}">
                        ${initialColumnsHtml}
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
                        <button type="button" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition" onclick="window.TableDesignerUtils.addCol('${id}')">
                            + Añadir
                        </button>
                     </div>
                     <input type="hidden" name="columns" id="columns-input-${id}" value="${columnsJson}">
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

  // --- MODO EDITOR (DATOS) ---

  renderEditor(config, value = []) {
    const cols = config.columns || [];
    const rows = Array.isArray(value) ? value : [];

    const rowsHtml = rows
      .map((row) => {
        const inner = this.generateRowInnerHtml(cols, row);
        return `<tr class="group hover:bg-blue-50/50 transition">${inner}</tr>`;
      })
      .join("");

    const colsConfigJson = JSON.stringify(cols).replace(/"/g, "&quot;");

    const hasNumericCols = cols.some(
      (c) => c.type === "number" || c.type === "currency"
    );

    let tfootHtml = "";
    if (hasNumericCols) {
      const footerCells = cols
        .map((c, idx) => {
          if (idx === 0 && c.type !== "number" && c.type !== "currency") {
            return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50 text-left font-bold text-gray-600 uppercase text-[10px]">Totales</th>`;
          }
          if (c.type === "number" || c.type === "currency") {
            return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50 text-right font-bold text-blue-800 text-sm" data-total-col="${idx}" data-type="${
              c.type
            }" data-symbol="${c.config?.symbol || ""}">-</th>`;
          }
          return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50"></th>`;
        })
        .join("");
      tfootHtml = `<tfoot><tr>${footerCells}<th class="border-t-2 border-gray-300 bg-gray-50"></th></tr></tfoot>`;
    }
    // Se agrega data-label para facilitar la exportación CSV con nombre correcto
    return `
            <div class="mb-8 table-container" data-cols="${colsConfigJson}" data-label="${
      config.label || "Tabla"
    }" id="container-${config.id}">
                <div class="flex flex-wrap justify-between items-end mb-3 gap-2">
                    <label class="block text-sm font-bold text-blue-800 uppercase tracking-wide">
                        ${config.label}
                    </label>
                    <div class="flex items-center gap-2 flex-wrap">
                        <div class="table-search-box hidden opacity-0 transition-all duration-300 relative">
                             <input type="text" placeholder="Buscar (AND)..." class="pl-7 pr-2 py-1 border rounded-lg text-xs w-48 focus:w-64 focus:ring-2 focus:ring-blue-500 transition-all outline-none bg-white">
                             <span class="absolute left-2 top-1.5 text-gray-400 text-xs">🔍</span>
                        </div>
                        
                        <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full table-row-counter">
                            ${rows.length} items
                        </span>

                        <div class="h-4 w-px bg-gray-300 mx-1"></div>

                        <label class="cursor-pointer text-gray-500 hover:text-green-600 transition" title="Importar CSV">
                            <span class="text-lg">📥</span>
                            <input type="file" accept=".csv" class="hidden table-import-csv">
                        </label>
                        <button type="button" class="text-gray-500 hover:text-blue-600 transition table-export-csv" title="Exportar CSV">
                            <span class="text-lg">📤</span>
                        </button>
                    </div>
                </div>

                <div class="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white relative">
                    <table class="w-full text-sm text-left">
                        <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] sticky top-0 z-10">
                            <tr>
                                ${cols
                                  .map((c) => {
                                    const header = c.config
                                      ? c.config.label
                                      : c.header;
                                    // ALINEACIÓN DE HEADER SEGÚN TIPO
                                    const isNumeric =
                                      c.type === "number" ||
                                      c.type === "currency";
                                    const alignClass = isNumeric
                                      ? "text-right"
                                      : "text-left";

                                    return `<th class="px-3 py-2 border-b font-bold tracking-wider min-w-[120px] whitespace-nowrap ${alignClass}">${header}</th>`;
                                  })
                                  .join("")}
                                <th class="w-24 border-b text-center font-bold text-gray-400 bg-gray-50">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">${rowsHtml}</tbody>
                        ${tfootHtml}
                    </table>
                    
                    <div class="table-empty-state ${
                      rows.length === 0 ? "" : "hidden"
                    } p-8 text-center text-gray-400 italic bg-gray-50/50">
                        No hay registros.
                    </div>
                </div>
                
                <button type="button" onclick="window.TableEditorUtils.openModal(this, false)" class="mt-2 text-blue-600 text-xs font-bold hover:text-blue-800 hover:underline flex items-center gap-1 transition">
                    <span class="bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center">+</span> Agregar Fila
                </button>
            </div>`;
  }

  generateRowInnerHtml(cols, rowData = {}) {
    const cells = cols
      .map((col) => {
        const elementStrategy = ElementRegistry.get(col.type);
        const header = col.config ? col.config.label : col.header;
        const cellConfig = col.config || { label: header };
        const val = rowData[header] || "";

        const displayHtml = elementStrategy.renderPrint(
          cellConfig,
          val,
          "table"
        );

        let hiddenInput = "";
        if (typeof val === "object") {
          const jsonVal = JSON.stringify(val).replace(/"/g, "&quot;");
          hiddenInput = `<input type="hidden" class="real-value url-storage" value="${jsonVal}">`;
        } else {
          hiddenInput = `<input type="hidden" class="real-value" value="${val
            .toString()
            .replace(/"/g, "&quot;")}">`;
        }

        return `<td class="p-2 border-b align-middle bg-white text-sm text-gray-700" data-header="${header}">
            ${displayHtml}
            ${hiddenInput}
        </td>`;
      })
      .join("");

    const actions = `
        <td class="p-1 border-b text-center align-middle whitespace-nowrap">
            <div class="flex items-center justify-center gap-1">
                 <button type="button" class="move-row-up-btn text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition" title="Subir">↑</button>
                <button type="button" class="move-row-down-btn text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition" title="Bajar">↓</button>
                <div class="w-px h-4 bg-gray-200 mx-1"></div>
                <button type="button" onclick="window.TableEditorUtils.openModal(this, true)" class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition" title="Editar Fila">✏️</button>
                <button type="button" class="delete-row-btn text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition" title="Eliminar Fila">🗑️</button>
            </div>
        </td>
    `;
    return cells + actions;
  }

  attachRowListeners(tr) {
    const delBtn = tr.querySelector(".delete-row-btn");
    if (delBtn) {
      delBtn.onclick = () => {
        if (confirm("¿Eliminar esta fila?")) tr.remove();
      };
    }

    const upBtn = tr.querySelector(".move-row-up-btn");
    if (upBtn) {
      upBtn.onclick = () => {
        const prev = tr.previousElementSibling;
        if (prev) {
          tr.parentNode.insertBefore(tr, prev);
        }
      };
    }

    const downBtn = tr.querySelector(".move-row-down-btn");
    if (downBtn) {
      downBtn.onclick = () => {
        const next = tr.nextElementSibling;
        if (next) {
          tr.parentNode.insertBefore(next, tr);
        }
      };
    }
  }

  attachListeners(container) {
    const tbody = container.querySelector("tbody");

    container
      .querySelectorAll("tbody tr")
      .forEach((tr) => this.attachRowListeners(tr));

    const searchInput = container.querySelector(".table-search-box input");
    const searchBox = container.querySelector(".table-search-box");

    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const terms = e.target.value.toLowerCase().split(/\s+/).filter(Boolean);
        const rows = tbody.querySelectorAll("tr");
        rows.forEach((row) => {
          const text = row.textContent.toLowerCase();
          const matches = terms.every((term) => text.includes(term));
          row.style.display = matches ? "" : "none";
        });
        this.updateTotals(container);
      });
    }

    const exportBtn = container.querySelector(".table-export-csv");
    if (exportBtn) {
      exportBtn.onclick = () => this.exportToCSV(container);
    }

    const importInput = container.querySelector(".table-import-csv");
    if (importInput) {
      importInput.onchange = (e) =>
        this.importFromCSV(container, e.target.files[0]);
    }

    const observer = new MutationObserver(() => {
      this.updateUIState(container, searchBox);
      this.updateTotals(container);
    });

    if (tbody) {
      observer.observe(tbody, { childList: true, subtree: true });
    }

    this.updateUIState(container, searchBox);
    this.updateTotals(container);
  }

  updateUIState(container, searchBox) {
    const rows = container.querySelectorAll("tbody tr");
    const count = rows.length;

    const counterEl = container.querySelector(".table-row-counter");
    if (counterEl) counterEl.textContent = `${count} items`;

    const emptyState = container.querySelector(".table-empty-state");
    if (emptyState) {
      emptyState.classList.toggle("hidden", count > 0);
    }

    if (searchBox) {
      if (count > 10) {
        searchBox.classList.remove("hidden", "opacity-0");
      } else {
        const input = searchBox.querySelector("input");
        if (!input.value) {
          searchBox.classList.add("hidden", "opacity-0");
        }
      }
    }
  }

  updateTotals(container) {
    const tfoot = container.querySelector("tfoot");
    if (!tfoot) return;

    const visibleRows = Array.from(
      container.querySelectorAll("tbody tr")
    ).filter((r) => r.style.display !== "none");
    const footerCells = tfoot.querySelectorAll("th[data-total-col]");

    footerCells.forEach((cell) => {
      const colIdx = parseInt(cell.dataset.totalCol);
      const type = cell.dataset.type;
      const symbol = cell.dataset.symbol || "";

      let sum = 0;
      visibleRows.forEach((row) => {
        const td = row.children[colIdx];
        if (td) {
          const input = td.querySelector(".real-value");
          if (input) {
            const val = parseFloat(input.value);
            if (!isNaN(val)) sum += val;
          }
        }
      });

      if (type === "currency") {
        cell.textContent = `${symbol} ${sum.toLocaleString("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      } else {
        cell.textContent = parseFloat(sum.toFixed(4)) * 1;
      }
    });
  }

  exportToCSV(container) {
    container = document.getElementById(`container-${container.dataset.id}`);
    const colsConfig = JSON.parse(container.dataset.cols || "[]");
    const rows = Array.from(container.querySelectorAll("tbody tr"));
    console.log(colsConfig);

    if (rows.length === 0) return alert("No hay datos para exportar.");

    // --- CORRECCIÓN DE ENCABEZADOS Y GENERACIÓN DE NOMBRE ---

    // 1. Obtener datos para el nombre del archivo
    // <plantilla> - <identificacion> - <label table>.csv
    const templateNameEl = document.getElementById("template-name-display");
    const templateName = templateNameEl
      ? templateNameEl.textContent.trim()
      : "Plantilla";

    const docTitleEl = document.getElementById("doc-title");
    const docTitle = docTitleEl ? docTitleEl.value.trim() : "Documento";

    const tableLabel = container.dataset.label || "Tabla";

    // Sanitizar nombre de archivo (remover caracteres inválidos)
    const cleanFileName = `${templateName} - ${docTitle} - ${tableLabel}`
      .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ \-_]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const finalFileName = `${cleanFileName}.csv`;

    // 2. Generar Headers robustos
    const headers = colsConfig.map((c) => {
      // Priorizar config.label, luego header, luego un default
      if (c.config && c.config.label) return c.config.label;
      if (c.header) return c.header;
      return "Columna";
    });

    const csvContent = [headers.join(",")];

    rows.forEach((row) => {
      const rowData = [];
      row.querySelectorAll("td[data-header]").forEach((td) => {
        const input = td.querySelector(".real-value, .url-storage");
        let val = input ? input.value : "";
        val = val.replace(/"/g, '""');
        if (val.includes(",") || val.includes('"')) {
          val = `"${val}"`;
        }
        rowData.push(val);
      });
      csvContent.push(rowData.join(","));
    });

    const blob = new Blob([csvContent.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", finalFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  importFromCSV(container, file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length < 2)
        return alert("El archivo CSV parece vacío o inválido.");

      const colsConfig = JSON.parse(container.dataset.cols || "[]");
      const tbody = container.querySelector("tbody");

      let addedCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];

        const cleanCells = cells.map((c) =>
          c.replace(/^"|"$/g, "").replace(/""/g, '"')
        );

        if (cleanCells.length > 0) {
          const rowData = {};
          colsConfig.forEach((col, idx) => {
            const header = col.config ? col.config.label : col.header;
            rowData[header] = cleanCells[idx] || "";
          });

          const trHtml = this.generateRowInnerHtml(colsConfig, rowData);
          const tr = document.createElement("tr");
          tr.className = "group hover:bg-blue-50/50 transition animate-fade-in";
          tr.innerHTML = trHtml;
          tbody.appendChild(tr);
          this.attachRowListeners(tr);
          addedCount++;
        }
      }

      container.querySelector(".table-import-csv").value = "";
      alert(`Se importaron ${addedCount} registros.`);
    };
    reader.readAsText(file);
  }

  extractValue(container) {
    const rows = [];
    container.querySelectorAll("tbody tr").forEach((tr) => {
      const rowData = {};
      tr.querySelectorAll("td[data-header]").forEach((td) => {
        const header = td.dataset.header;
        const input = td.querySelector(
          "input.real-value, textarea.real-value, select.real-value"
        );
        const storage = td.querySelector(".url-storage");

        if (storage) {
          rowData[header] = storage.value;
        } else if (input) {
          rowData[header] = input.value;
        }
      });
      if (Object.keys(rowData).length > 0) rows.push(rowData);
    });
    return rows;
  }

  renderPrint(config, value) {
    if (!value || value.length === 0) return "";
    const cols = config.columns || [];

    let totals = {};
    cols.forEach((c) => {
      if (c.type === "number" || c.type === "currency")
        totals[c.config?.label || c.header] = 0;
    });

    const rowsHtml = value
      .map((row) => {
        const cells = cols
          .map((col) => {
            const elementStrategy = ElementRegistry.get(col.type);
            const header = col.config ? col.config.label : col.header;
            const cellConfig = col.config || { label: header };

            if (col.type === "number" || col.type === "currency") {
              const valNum = parseFloat(row[header]);
              if (!isNaN(valNum)) totals[header] += valNum;
            }

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
                                // ALINEACIÓN HEADER IMPRESIÓN
                                const isNumeric =
                                  c.type === "number" || c.type === "currency";
                                const alignClass = isNumeric
                                  ? "text-right"
                                  : "text-left";
                                return `<th class="border border-gray-300 p-2 font-bold ${alignClass}">${header}</th>`;
                              })
                              .join("")}
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
  }
}
