import { ElementRegistry } from "../elements/ElementRegistry.js";

export class TemplateEditor {
  constructor(categories, onSave, onCancel, onActivity, initialData = null) {
    this.categories = categories || [];
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.onActivity = onActivity || (() => {});

    // ESTADO
    this.initialData = initialData;
    this.elements = []; // Fuente de la verdad
    this.selectedColor = initialData ? initialData.color : "blue";

    // ESTADO DEL MODAL
    this.editingElementId = null;
  }

  render() {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in";

    const modal = document.createElement("div");
    modal.className =
      "bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden relative";

    const nameVal = this.initialData ? this.initialData.name : "";
    const iconVal = this.initialData ? this.initialData.icon : "📄";
    const catVal = this.initialData ? this.initialData.category : "";

    modal.innerHTML = `
            <div id="config-modal-overlay" class="absolute inset-0 z-50 bg-black/50 backdrop-blur-[2px] hidden flex items-center justify-center">
                <div class="bg-white w-full max-w-2xl rounded-xl shadow-2xl transform scale-95 transition-all flex flex-col max-h-[85vh]">
                    <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                        <h3 class="font-bold text-gray-800 flex items-center gap-2">
                            <span id="modal-icon" class="text-xl"></span>
                            <span class="text-sm uppercase tracking-wider text-blue-600">Configurar Elemento</span>
                        </h3>
                        <button type="button" id="modal-close-x" class="text-gray-400 hover:text-red-500 font-bold text-xl px-2">×</button>
                    </div>
                    
                    <div id="modal-body" class="p-6 overflow-y-auto">
                        </div>

                    <div class="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-2">
                        <button type="button" id="modal-cancel-btn" class="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>
                        <button type="button" id="modal-save-btn" class="px-6 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">Guardar Cambios</button>
                    </div>
                </div>
            </div>

            <div class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="font-bold text-gray-700">Herramientas</h3>
                    <p class="text-xs text-gray-400">Clic para añadir</p>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-6">
                    ${this.renderTools()}
                </div>
            </div>

            <div class="flex-1 flex flex-col bg-gray-100">
                <div class="bg-white p-4 border-b border-gray-200 flex gap-4 items-center shadow-sm z-10">
                    <input type="text" id="tmpl-icon" value="${iconVal}" class="w-10 h-10 text-center text-xl border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" title="Icono">
                    <div class="flex-1">
                        <input type="text" id="tmpl-name" value="${nameVal}" placeholder="Nombre de la Plantilla" class="w-full font-bold text-lg outline-none placeholder-gray-300">
                        <div class="flex gap-2 mt-1">
                            <select id="tmpl-cat" class="text-xs border rounded bg-gray-50 p-1 bg-white cursor-pointer hover:border-blue-400">
                                ${this.categories
                                  .map(
                                    (c) =>
                                      `<option value="${c.id}" ${
                                        c.id === catVal ? "selected" : ""
                                      }>${c.label}</option>`
                                  )
                                  .join("")}
                            </select>
                            <div id="color-selector" class="flex gap-1 items-center ml-2"></div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" id="cancel-btn" class="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Salir</button>
                        <button type="button" id="save-btn" class="px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 shadow-lg transition transform active:scale-95">
                            Guardar Plantilla
                        </button>
                    </div>
                </div>

                <div id="canvas-area" class="flex-1 overflow-y-auto p-8 relative">
                    <div id="elements-container" class="max-w-3xl mx-auto bg-white min-h-[500px] shadow-sm rounded-xl border border-gray-200 p-8 space-y-3 pb-20 relative">
                        <div id="empty-msg" class="text-center py-20 text-gray-300 border-2 border-dashed border-gray-100 rounded-xl select-none" style="display: block;">
                            Selecciona elementos del panel izquierdo
                        </div>
                    </div>
                </div>
            </div>
        `;

    overlay.appendChild(modal);
    this.setupLogic(modal, overlay);
    return overlay;
  }

  renderTools() {
    const groups = ElementRegistry.getGrouped();
    return Object.values(groups)
      .map(
        (group) => `
            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">${
                  group.label
                }</h4>
                <div class="grid grid-cols-2 gap-2">
                    ${group.items
                      .map(
                        (item) => `
                        <button type="button" class="tool-btn flex flex-col items-center justify-center p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition active:scale-95" data-type="${item.type}">
                            <span class="text-xl mb-1">${item.icon}</span>
                            <span class="text-[10px] font-bold text-gray-600 text-center leading-tight">${item.label}</span>
                        </button>
                    `
                      )
                      .join("")}
                </div>
            </div>
        `
      )
      .join("");
  }

  setupLogic(modal, overlay) {
    const container = modal.querySelector("#elements-container");
    const emptyMsg = modal.querySelector("#empty-msg");
    const configModal = modal.querySelector("#config-modal-overlay");
    const modalBody = modal.querySelector("#modal-body");

    // --- MANEJO DE ARRAY ---

    // Función centralizada para pintar la lista
    const renderCanvas = () => {
      // Limpiamos todo excepto el mensaje de vacío
      const children = Array.from(container.children);
      children.forEach((child) => {
        if (child.id !== "empty-msg") child.remove();
      });

      if (this.elements.length === 0) {
        emptyMsg.style.display = "block";
        return;
      } else {
        emptyMsg.style.display = "none";
      }

      this.elements.forEach((el, index) => {
        const strategy = ElementRegistry.get(el.type);
        const displayText = el.config.label || el.config.text || strategy.label;

        // Badges
        const badgesHtml = [
          el.config.required
            ? '<span class="text-[10px] bg-red-50 text-red-600 px-1.5 rounded font-bold">* Req</span>'
            : "",
          el.config.colSpanEditor
            ? `<span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded font-mono">W:${el.config.colSpanEditor}</span>`
            : "",
        ].join("");

        // Estado de botones de mover
        const isFirst = index === 0;
        const isLast = index === this.elements.length - 1;
        const btnClass =
          "w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition disabled:opacity-20 disabled:cursor-not-allowed";

        const card = document.createElement("div");
        card.className =
          "group relative p-3 border border-gray-200 bg-white rounded-lg hover:border-blue-400 hover:shadow-md transition animate-fade-in flex items-center justify-between gap-4 cursor-pointer";
        card.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-lg flex-shrink-0">
                        ${strategy.icon}
                    </div>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-bold text-gray-700 truncate select-none">${displayText}</span>
                        <div class="flex gap-1">${badgesHtml}</div>
                    </div>
                </div>

                <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white pl-2">
                    <div class="flex mr-2 bg-gray-50 rounded-lg p-0.5">
                        <button type="button" class="move-up-btn ${btnClass}" title="Subir" ${
          isFirst ? "disabled" : ""
        }>↑</button>
                        <button type="button" class="move-down-btn ${btnClass}" title="Bajar" ${
          isLast ? "disabled" : ""
        }>↓</button>
                    </div>

                    <button type="button" class="config-btn p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Configurar">⚙️</button>
                    <div class="w-px h-4 bg-gray-200 mx-1"></div>
                    <button type="button" class="delete-btn p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Eliminar">🗑️</button>
                </div>
            `;

        // Listeners
        card.onclick = () => openModal(el.id);

        card.querySelector(".config-btn").onclick = (e) => {
          e.stopPropagation();
          openModal(el.id);
        };

        card.querySelector(".delete-btn").onclick = (e) => {
          e.stopPropagation();
          if (!confirm("¿Eliminar elemento?")) return;
          this.elements.splice(index, 1);
          renderCanvas();
        };

        card.querySelector(".move-up-btn").onclick = (e) => {
          e.stopPropagation();
          moveElement(index, -1);
        };

        card.querySelector(".move-down-btn").onclick = (e) => {
          e.stopPropagation();
          moveElement(index, 1);
        };

        container.appendChild(card);
      });
    };

    // Agregar nuevo elemento
    const addElement = (type, existingId = null, existingConfig = {}) => {
      const id = existingId || Date.now().toString();
      // Evitamos duplicados al cargar data inicial
      if (!this.elements.find((e) => e.id === id)) {
        this.elements.push({ id, type, config: existingConfig });
        // Scroll al fondo si es nuevo
        if (!existingId) {
          setTimeout(() => {
            const canvas = modal.querySelector("#canvas-area");
            canvas.scrollTop = canvas.scrollHeight;
            openModal(id);
          }, 50);
        }
      }
      renderCanvas();
    };

    // Mover elemento
    const moveElement = (index, direction) => {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= this.elements.length) return;

      // Swap
      [this.elements[index], this.elements[newIndex]] = [
        this.elements[newIndex],
        this.elements[index],
      ];
      renderCanvas();
    };

    // --- MODAL CONFIG ---
    const openModal = (elementId) => {
      this.editingElementId = elementId;
      const el = this.elements.find((e) => e.id === elementId);
      if (!el) return;

      const strategy = ElementRegistry.get(el.type);
      modal.querySelector("#modal-icon").innerText = strategy.icon;
      modalBody.innerHTML = strategy.renderTemplate(elementId, el.config);
      configModal.classList.remove("hidden");
      configModal.classList.add("flex");
    };

    const closeModal = () => {
      configModal.classList.add("hidden");
      configModal.classList.remove("flex");
      modalBody.innerHTML = "";
      this.editingElementId = null;
    };

    const saveModal = () => {
      if (!this.editingElementId) return;
      const idx = this.elements.findIndex(
        (e) => e.id === this.editingElementId
      );
      if (idx === -1) return;

      const el = this.elements[idx];
      const strategy = ElementRegistry.get(el.type);

      try {
        const newConfig = strategy.extractConfig(modalBody);
        this.elements[idx].config = newConfig;
        renderCanvas(); // Refrescar vista
        closeModal();
      } catch (e) {
        alert("Error: " + e.message);
      }
    };

    // --- INICIALIZACIÓN ---

    // Cargar data existente
    if (this.initialData && this.initialData.elements) {
      this.initialData.elements.forEach((el) => addElement(el.type, el.id, el));
    }

    // Listeners herramientas
    modal.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.onclick = () => {
        this.onActivity();
        addElement(btn.dataset.type);
      };
    });

    // Listeners Modal
    modal.querySelector("#modal-close-x").onclick = closeModal;
    modal.querySelector("#modal-cancel-btn").onclick = closeModal;
    modal.querySelector("#modal-save-btn").onclick = saveModal;

    // Colores
    const colors = ["blue", "green", "red", "purple", "yellow", "gray"];
    const colorContainer = modal.querySelector("#color-selector");
    const renderColors = () => {
      colorContainer.innerHTML = "";
      colors.forEach((c) => {
        const isSelected = this.selectedColor === c;
        const dot = document.createElement("div");
        dot.className = `w-4 h-4 rounded-full bg-${c}-500 cursor-pointer ${
          isSelected
            ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
            : "opacity-70 hover:opacity-100"
        }`;
        dot.onclick = () => {
          this.selectedColor = c;
          renderColors();
        };
        colorContainer.appendChild(dot);
      });
    };
    renderColors();

    // Guardar Final
    modal.querySelector("#save-btn").onclick = (e) => {
      e.preventDefault();
      const name =
        modal.querySelector("#tmpl-name").value.trim() ||
        "Plantilla Sin Nombre";
      const icon = modal.querySelector("#tmpl-icon").value.trim() || "📄";
      const category = modal.querySelector("#tmpl-cat").value;

      if (this.elements.length === 0) {
        alert("⚠️ Añade al menos un elemento.");
        return;
      }

      // Preparar payload aplanado
      const finalElements = this.elements.map((el) => ({
        id: el.id,
        type: el.type,
        ...el.config,
      }));

      this.onSave({
        name,
        category,
        icon,
        color: this.selectedColor,
        elements: finalElements,
        lastUpdate: new Date().toISOString(),
      });
    };

    modal.querySelector("#cancel-btn").onclick = () => {
      overlay.remove();
      this.onCancel();
    };
  }
}
