import { ElementRegistry } from "../elements/ElementRegistry.js";

export class TemplateEditor {
  /**
   * @param {Array} categories - Categorías globales
   * @param {Function} onSave - Callback guardar
   * @param {Function} onCancel - Callback cancelar
   * @param {Function} onActivity - Callback para reportar actividad (evitar logout por tiempo)
   * @param {Object} initialData - Datos para editar (opcional)
   */
  constructor(categories, onSave, onCancel, onActivity, initialData = null) {
    this.categories = categories || [];
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.onActivity = onActivity || (() => {}); // Función para mantener viva la sesión
    this.initialData = initialData;

    this.elements = [];
    this.selectedColor = initialData ? initialData.color : "blue";
  }

  render() {
    const overlay = document.createElement("div");
    overlay.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in";

    const modal = document.createElement("div");
    modal.className =
      "bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex overflow-hidden";

    const nameVal = this.initialData ? this.initialData.name : "";
    const iconVal = this.initialData ? this.initialData.icon : "📄";
    const catVal = this.initialData ? this.initialData.category : "";

    modal.innerHTML = `
            <div class="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="font-bold text-gray-700">Herramientas</h3>
                    <p class="text-xs text-gray-400">Clic para añadir elemento</p>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-6">
                    ${this.renderTools()}
                </div>
            </div>

            <div class="flex-1 flex flex-col bg-gray-100">
                <div class="bg-white p-4 border-b border-gray-200 flex gap-4 items-center shadow-sm z-10">
                    <input type="text" id="tmpl-icon" value="${iconVal}" class="w-10 h-10 text-center text-xl border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <div class="flex-1">
                        <input type="text" id="tmpl-name" value="${nameVal}" placeholder="Nombre de la Plantilla" class="w-full font-bold text-lg outline-none placeholder-gray-300">
                        <div class="flex gap-2 mt-1">
                            <select id="tmpl-cat" class="text-xs border rounded bg-gray-50 p-1 bg-white">
                                ${this.categories
                                  .map(
                                    (c) =>
                                      `<option value="${c.id}" ${
                                        c.id === catVal ? "selected" : ""
                                      }>${c.label}</option>`
                                  )
                                  .join("")}
                            </select>
                            <div id="color-selector" class="flex gap-1 items-center"></div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button type="button" id="cancel-btn" class="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="button" id="save-btn" class="px-4 py-2 text-sm font-bold bg-black text-white rounded-lg hover:bg-gray-800 shadow-lg transition transform active:scale-95">
                            ${this.initialData ? "Actualizar" : "Guardar"}
                        </button>
                    </div>
                </div>

                <div id="canvas-area" class="flex-1 overflow-y-auto p-8 relative">
                    <div id="elements-container" class="max-w-3xl mx-auto bg-white min-h-[500px] shadow-sm rounded-xl border border-gray-200 p-8 space-y-4 pb-20 relative">
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

    // --- 1. FUNCIÓN PARA AGREGAR ELEMENTOS VISUALES ---
    const addVisualElement = (type, existingId = null, existingConfig = {}) => {
      const elementStrategy = ElementRegistry.get(type);
      const id = existingId || Date.now().toString();

      // Guardamos referencia interna
      this.elements.push({ id, type, config: existingConfig });

      emptyMsg.style.display = "none";

      // Crear el bloque visual en el DOM
      const elDiv = document.createElement("div");
      elDiv.className =
        "group relative p-4 border border-transparent hover:border-blue-300 rounded-xl hover:bg-blue-50/30 transition animate-fade-in bg-white";
      elDiv.dataset.id = id;

      elDiv.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-lg cursor-grab active:cursor-grabbing">${
                          elementStrategy.icon
                        }</span>
                        <span class="text-xs font-bold uppercase text-blue-600 select-none">${
                          elementStrategy.label
                        }</span>
                    </div>
                    <button type="button" class="delete-btn opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition">🗑️</button>
                </div>
                <div class="element-config-area">
                    ${elementStrategy.renderTemplate(id, existingConfig)}
                </div>
            `;

      // Lógica de borrado
      elDiv.querySelector(".delete-btn").onclick = () => {
        this.onActivity(); // Reportamos actividad
        this.elements = this.elements.filter((e) => e.id !== id);
        elDiv.remove();
        if (container.children.length <= 1) emptyMsg.style.display = "block"; // <=1 porque emptyMsg es un hijo
      };

      container.appendChild(elDiv);

      // Scroll al fondo si es nuevo
      if (!existingId) {
        const canvas = modal.querySelector("#canvas-area");
        canvas.scrollTop = canvas.scrollHeight;
      }
    };

    // --- 2. CARGAR DATOS EXISTENTES (SI HAY) ---
    if (this.initialData && this.initialData.elements) {
      this.initialData.elements.forEach((el) =>
        addVisualElement(el.type, el.id, el)
      );
    }

    // --- 3. LISTENERS HERRAMIENTAS ---
    modal.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.onclick = () => {
        this.onActivity(); // Mantener sesión viva
        addVisualElement(btn.dataset.type);
      };
    });

    // --- 4. SELECTOR DE COLOR ---
    const colors = ["blue", "green", "red", "purple", "yellow", "gray"];
    const colorContainer = modal.querySelector("#color-selector");

    const renderColors = () => {
      colorContainer.innerHTML = "";
      colors.forEach((c) => {
        const dot = document.createElement("div");
        const isSelected = this.selectedColor === c;
        dot.className = `w-4 h-4 rounded-full bg-${
          c === "yellow" ? "yellow-400" : c + "-500"
        } cursor-pointer hover:scale-125 transition ${
          isSelected ? "ring-2 ring-offset-1 ring-black" : ""
        }`;
        dot.onclick = () => {
          this.onActivity();
          this.selectedColor = c;
          renderColors();
        };
        colorContainer.appendChild(dot);
      });
    };
    renderColors();

    // --- 5. BOTONES DE ACCIÓN (FINAL) ---

    modal.querySelector("#cancel-btn").onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.remove();
      this.onCancel();
    };

    modal.querySelector("#save-btn").onclick = (e) => {
      // CRÍTICO: Evitar cualquier comportamiento de submit por defecto
      e.preventDefault();
      e.stopPropagation();

      const name = modal.querySelector("#tmpl-name").value;
      if (!name) return alert("Falta el nombre de la plantilla");

      const finalElements = [];

      // Recorremos el DOM para respetar el orden visual
      Array.from(container.children).forEach((child) => {
        if (child.id === "empty-msg") return;

        const id = child.dataset.id;
        // Buscamos el tipo en nuestro registro interno
        const cachedEl = this.elements.find((e) => e.id === id);
        if (!cachedEl) return;

        const strategy = ElementRegistry.get(cachedEl.type);
        const configArea = child.querySelector(".element-config-area");

        // Extraemos la configuración fresca del formulario
        const config = strategy.extractConfig(configArea);

        // Guardamos todo junto plano: { id, type, label: "...", required: true, ... }
        finalElements.push({ id, type: cachedEl.type, ...config });
      });

      if (finalElements.length === 0)
        return alert("Agrega al menos un elemento");

      // Llamamos al callback de guardado en main.js
      this.onSave({
        name,
        icon: modal.querySelector("#tmpl-icon").value,
        category: modal.querySelector("#tmpl-cat").value,
        color: this.selectedColor,
        elements: finalElements,
      });
      overlay.remove();
    };
  }
}
