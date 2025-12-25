import { BaseElement } from "./BaseElement.js";
import { ElementRegistry } from "./ElementRegistry.js";

// --- UTILIDADES GLOBALES PARA EL DISEÑADOR ---
window.TableDesignerUtils = {
  getColsFromDOM: (id) => {
    const container = document.getElementById(`cols-list-${id}`);
    const blocks = container.querySelectorAll(".table-col-block");
    return Array.from(blocks).map((block) => {
      const type = block.dataset.type;
      const strategy = ElementRegistry.get(type);
      const configArea = block.querySelector(".element-config-area");
      // Sin validación: si strategy es null, esto explotará. Correcto.
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
        // Sin validación: si col es null, explotará al acceder a col.type
        const strategy = ElementRegistry.get(col.type);
        const colId = `${id}-col-${idx}`;
        const innerTemplate = strategy.renderTemplate(
          colId,
          col.config, // Pasamos config directo
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
    [cols[idx], cols[newIdx]] = [cols[newIdx], cols[idx]];
    window.TableDesignerUtils.renderCols(id, cols);
  },
};

// --- EDITOR MODAL (Sin validaciones defensivas) ---
window.TableEditorUtils = {
  currentOnSave: null,

  openModal: (colsConfig, initialData, onSave, title = "Editar Item") => {
    window.TableEditorUtils.currentOnSave = onSave;

    console.log("🛠️ [Modal] Data:", initialData);
    console.log("🛠️ [Modal] Config:", colsConfig);

    const overlay = document.createElement("div");
    overlay.id = "table-editor-modal";
    overlay.className =
      "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in";

    overlay.innerHTML = `
            <div class="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <h3 class="font-bold text-gray-800 text-lg">${title}</h3>
                    <button id="modal-close-x" class="text-gray-400 hover:text-red-500 font-bold text-xl px-2">×</button>
                </div>
                <div id="table-modal-form" class="p-6 overflow-y-auto space-y-5"></div>
                <div class="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-2">
                    <button id="modal-cancel-btn" class="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancelar</button>
                    <button id="modal-save-btn" class="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200">Guardar</button>
                </div>
            </div>
        `;
    document.body.appendChild(overlay);

    const formContainer = overlay.querySelector("#table-modal-form");
    const tempState = { ...initialData };

    colsConfig.forEach((col, idx) => {
      // Sin validación: Si col es undefined, esto explota.
      const strategy = ElementRegistry.get(col.type);

      // Acceso directo a propiedades. Si col.config no existe, usamos fallback mínimo o explotará luego.
      const header = col.config ? col.config.label : col.header;
      const cellConfig = col.config || { label: header };
      const val = initialData[header] !== undefined ? initialData[header] : "";

      const wrapper = document.createElement("div");
      wrapper.className = "table-modal-field";
      wrapper.innerHTML = strategy.renderEditor(cellConfig, val, "form");
      formContainer.appendChild(wrapper);

      if (strategy.attachListeners) {
        strategy.attachListeners(wrapper, (newValue) => {
          tempState[header] = newValue;
        });
      } else {
        wrapper.addEventListener("input", (e) => {
          if (e.target.matches("input, select, textarea")) {
            tempState[header] = e.target.value;
          }
        });
      }
    });

    const closeModal = () => {
      document.getElementById("table-editor-modal").remove();
      window.TableEditorUtils.currentOnSave = null;
    };

    overlay.querySelector("#modal-close-x").onclick = closeModal;
    overlay.querySelector("#modal-cancel-btn").onclick = closeModal;
    overlay.querySelector("#modal-save-btn").onclick = () => {
      onSave(tempState); // Sin validación de tipo de función
      closeModal();
    };
  },
};

// --- CLASE TABLE ELEMENT (Sin validaciones defensivas) ---

export class TableElement extends BaseElement {
  constructor() {
    super("table", "▦", "Tabla Dinámica", "complex");
  }

  // Configuración del Diseñador
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
    // Esto explotará si getColsFromDOM falla. Correcto.
    const currentCols = window.TableDesignerUtils.getColsFromDOM(id);
    return {
      ...base,
      label: c.querySelector('[name="label"]').value,
      columns: currentCols,
    };
  }

  // --- RENDERIZADO DEL EDITOR ---
  renderEditor(config, value = []) {
    console.log(`🖼️ [TableElement] Render Config:`, config);
    console.log(`🖼️ [TableElement] Render Value:`, value);

    const rows = Array.isArray(value) ? value : [];
    const cols = config.columns; // Si config es null, explota aquí.
    const colsConfigJson = JSON.stringify(cols).replace(/"/g, "&quot;");
    const initialRowsJson = JSON.stringify(rows).replace(/"/g, "&quot;");

    // Headers directos
    const headersHtml = cols
      .map((c, i) => {
        // Acceso directo. Si c no tiene config, c.config.label explotará si c.config es undefined.
        // Pero normalmente config existe aunque sea vacio. Si c es undefined, explota.
        const header = c.config ? c.config.label : c.header;
        const isNumeric = c.type === "number" || c.type === "currency";
        const alignClass = isNumeric ? "text-right" : "text-left";
        return `<th class="px-3 py-2 border-b font-bold tracking-wider min-w-[120px] whitespace-nowrap ${alignClass}">${header}</th>`;
      })
      .join("");

    // Footer
    let tfootHtml = "";
    if (cols.some((c) => c.type === "number" || c.type === "currency")) {
      const footerCells = cols
        .map((c, idx) => {
          if (idx === 0 && c.type !== "number" && c.type !== "currency") {
            return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50 text-left font-bold text-gray-600 uppercase text-[10px]">Totales</th>`;
          }
          if (c.type === "number" || c.type === "currency") {
            // Acceso directo a c.config.symbol
            return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50 text-right font-bold text-blue-800 text-sm js-total-col" data-col-index="${idx}" data-type="${
              c.type
            }" data-symbol="${c.config ? c.config.symbol : ""}">-</th>`;
          }
          return `<th class="px-3 py-2 border-t-2 border-gray-300 bg-gray-50"></th>`;
        })
        .join("");
      tfootHtml = `<tfoot><tr>${footerCells}<th class="border-t-2 border-gray-300 bg-gray-50"></th></tr></tfoot>`;
    }

    return `
        <div class="mb-8 table-container" 
             data-cols="${colsConfigJson}" 
             data-label="${config.label || "Tabla"}" 
             data-initial-value="${initialRowsJson}">
            
            <div class="flex flex-wrap justify-between items-end mb-3 gap-2">
                <label class="block text-sm font-bold text-blue-800 uppercase tracking-wide">${
                  config.label
                }</label>
                <div class="flex items-center gap-2 flex-wrap">
                    <div class="table-search-box hidden opacity-0 transition-all duration-300 relative">
                         <input type="text" placeholder="Buscar..." class="pl-7 pr-2 py-1 border rounded-lg text-xs w-48 focus:w-64 outline-none bg-white">
                         <span class="absolute left-2 top-1.5 text-gray-400 text-xs">🔍</span>
                    </div>
                    <span class="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full js-row-counter">0 items</span>
                    <div class="h-4 w-px bg-gray-300 mx-1"></div>
                    <label class="cursor-pointer text-gray-500 hover:text-green-600 transition" title="Importar CSV">
                        <span class="text-lg">📥</span>
                        <input type="file" accept=".csv" class="hidden js-import-csv">
                    </label>
                    <button type="button" class="text-gray-500 hover:text-blue-600 transition js-export-csv" title="Exportar CSV">
                        <span class="text-lg">📤</span>
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white relative">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-50 text-gray-500 uppercase text-[10px] sticky top-0 z-10">
                        <tr>
                            ${headersHtml}
                            <th class="w-24 border-b text-center font-bold text-gray-400 bg-gray-50">ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 js-table-body"></tbody>
                    ${tfootHtml}
                </table>
                <div class="js-empty-state p-8 text-center text-gray-400 italic bg-gray-50/50">Cargando datos...</div>
            </div>
            
            <button type="button" class="mt-2 text-blue-600 text-xs font-bold hover:text-blue-800 hover:underline flex items-center gap-1 transition js-add-row-btn">
                <span class="bg-blue-100 text-blue-600 rounded-full w-4 h-4 flex items-center justify-center">+</span> Agregar Fila
            </button>
        </div>`;
  }

  // --- LÓGICA DE CONTROL ---
  attachListeners(container, onChange) {
    // CORRECCIÓN: Buscamos el elemento real que tiene la configuración
    // El 'container' que llega es el wrapper del EditManager, no la tabla en sí.
    const tableContainer = container.querySelector(".table-container");

    // Protección: Si por alguna razón no se renderizó bien
    if (!tableContainer) {
      console.error(
        "❌ [TableElement] No se encontró .table-container dentro del wrapper."
      );
      return;
    }

    // Ahora leemos del elemento correcto
    // Si dataset.cols está mal formado, JSON.parse lanzará error (comportamiento deseado)
    const colsConfig = JSON.parse(tableContainer.dataset.cols);
    const rows = JSON.parse(tableContainer.dataset.initialValue);

    console.log("⚡ [TableElement] Listeners Attached. Cols:", colsConfig);

    // Usamos tableContainer como referencia para buscar los elementos internos
    const tbody = tableContainer.querySelector(".js-table-body");
    const emptyState = tableContainer.querySelector(".js-empty-state");
    const counter = tableContainer.querySelector(".js-row-counter");
    const totalCells = tableContainer.querySelectorAll(".js-total-col");

    const renderTableRows = () => {
      tbody.innerHTML = "";

      if (rows.length === 0) {
        emptyState.classList.remove("hidden");
        emptyState.textContent = "No hay registros.";
      } else {
        emptyState.classList.add("hidden");

        rows.forEach((rowData, idx) => {
          const tr = document.createElement("tr");
          tr.className = "group hover:bg-blue-50/50 transition animate-fade-in";

          const cellsHtml = colsConfig
            .map((col) => {
              const strategy = ElementRegistry.get(col.type);
              const header = col.config ? col.config.label : col.header;
              const val = rowData[header];
              const safeConfig = col.config || { label: header };

              const displayHtml = strategy.renderPrint(
                safeConfig,
                val,
                "table"
              );
              return `<td class="p-2 border-b align-middle bg-white text-sm text-gray-700">${displayHtml}</td>`;
            })
            .join("");

          const actionsHtml = `
                    <td class="p-1 border-b text-center align-middle whitespace-nowrap">
                        <div class="flex items-center justify-center gap-1">
                             <button type="button" class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition js-btn-up" title="Subir">↑</button>
                            <button type="button" class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition js-btn-down" title="Bajar">↓</button>
                            <div class="w-px h-4 bg-gray-200 mx-1"></div>
                            <button type="button" class="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition js-btn-edit" title="Editar">✏️</button>
                            <button type="button" class="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition js-btn-del" title="Eliminar">🗑️</button>
                        </div>
                    </td>
                `;

          tr.innerHTML = cellsHtml + actionsHtml;
          tbody.appendChild(tr);

          tr.querySelector(".js-btn-del").onclick = () =>
            actions.deleteRow(idx);
          tr.querySelector(".js-btn-edit").onclick = () => actions.editRow(idx);
          tr.querySelector(".js-btn-up").onclick = () =>
            actions.moveRow(idx, -1);
          tr.querySelector(".js-btn-down").onclick = () =>
            actions.moveRow(idx, 1);
        });
      }

      counter.textContent = `${rows.length} items`;
      updateTotals();
    };

    const updateTotals = () => {
      totalCells.forEach((cell) => {
        const colIdx = parseInt(cell.dataset.colIndex);
        const colConfig = colsConfig[colIdx];
        const type = cell.dataset.type;
        const symbol = cell.dataset.symbol || "";
        const header = colConfig.config
          ? colConfig.config.label
          : colConfig.header;

        const sum = rows.reduce((acc, row) => {
          const val = parseFloat(row[header]);
          return acc + (isNaN(val) ? 0 : val);
        }, 0);

        if (type === "currency") {
          cell.textContent = `${symbol} ${sum.toLocaleString("es-ES", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`;
        } else {
          cell.textContent = parseFloat(sum.toFixed(4)) * 1;
        }
      });
    };

    const notifyChange = () => {
      onChange(rows);
    };

    const actions = {
      addRow: () => {
        window.TableEditorUtils.openModal(
          colsConfig,
          {},
          (newItem) => {
            rows.push(newItem);
            renderTableRows();
            notifyChange();
          },
          "Nuevo Item"
        );
      },
      editRow: (idx) => {
        const item = rows[idx];
        window.TableEditorUtils.openModal(
          colsConfig,
          item,
          (updatedItem) => {
            rows[idx] = updatedItem;
            renderTableRows();
            notifyChange();
          },
          "Editar Item"
        );
      },
      deleteRow: (idx) => {
        if (confirm("¿Eliminar esta fila?")) {
          rows.splice(idx, 1);
          renderTableRows();
          notifyChange();
        }
      },
      moveRow: (idx, dir) => {
        const newIdx = idx + dir;
        if (newIdx >= 0 && newIdx < rows.length) {
          [rows[idx], rows[newIdx]] = [rows[newIdx], rows[idx]];
          renderTableRows();
          notifyChange();
        }
      },
      importCSV: (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target.result;
          const lines = text.split("\n").filter((l) => l.trim() !== "");

          let added = 0;
          for (let i = 1; i < lines.length; i++) {
            const cells =
              lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            const cleanCells = cells.map((c) =>
              c.replace(/^"|"$/g, "").replace(/""/g, '"')
            );

            if (cleanCells.length > 0) {
              const newItem = {};
              colsConfig.forEach((col, cIdx) => {
                const header = col.config ? col.config.label : col.header;
                newItem[header] = cleanCells[cIdx] || "";
              });
              rows.push(newItem);
              added++;
            }
          }
          alert(`Importados ${added} items.`);
          renderTableRows();
          notifyChange();
        };
        reader.readAsText(file);
      },
      exportCSV: () => {
        if (rows.length === 0) return alert("Nada que exportar.");

        const headers = colsConfig.map((c) =>
          c.config ? c.config.label : c.header
        );
        const csvRows = [headers.join(",")];

        rows.forEach((row) => {
          const rowCells = colsConfig.map((c) => {
            const header = c.config ? c.config.label : c.header;
            let val = row[header] || "";
            val = String(val).replace(/"/g, '""');
            if (val.includes(",") || val.includes('"')) val = `"${val}"`;
            return val;
          });
          csvRows.push(rowCells.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${tableContainer.dataset.label || "export"}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      },
    };

    renderTableRows();

    // Actualizamos los listeners para buscar dentro de tableContainer, no container
    const addBtn = tableContainer.querySelector(".js-add-row-btn");
    if (addBtn) addBtn.onclick = actions.addRow;

    const importInput = tableContainer.querySelector(".js-import-csv");
    if (importInput) {
      importInput.onchange = (e) => {
        if (e.target.files[0]) {
          actions.importCSV(e.target.files[0]);
          e.target.value = "";
        }
      };
    }

    const exportBtn = tableContainer.querySelector(".js-export-csv");
    if (exportBtn) exportBtn.onclick = actions.exportCSV;

    const searchInput = tableContainer.querySelector(".table-search-box input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const trs = tbody.querySelectorAll("tr");
        trs.forEach((tr, i) => {
          const text = Object.values(rows[i]).join(" ").toLowerCase();
          tr.style.display = text.includes(term) ? "" : "none";
        });
      });
    }
  }

  // extractValue Legacy - Devolvemos array vacio ya que EditManager usa el estado.
  extractValue(container) {
    return [];
  }

  renderPrint(config, value) {
    if (!value || value.length === 0) return "";
    const cols = config.columns; // Si no hay columns, explota.

    let totals = {};
    cols.forEach((c) => {
      if (c.type === "number" || c.type === "currency")
        totals[c.config ? c.config.label : c.header] = 0;
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
