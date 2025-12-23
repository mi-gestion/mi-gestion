import { db } from "../services/firebase.js";
import { CryptoManager } from "../utils/crypto.js";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ElementRegistry } from "../elements/ElementRegistry.js";

export class SecretManager {
  /**
   * @param {Object} user - Usuario actual
   * @param {String} userKey - Llave Nivel 1
   * @param {String} vaultKey - Llave Nivel 2
   * @param {Function} onActivity - Callback para mantener sesión viva
   */
  constructor(user, userKey, vaultKey, onActivity) {
    this.user = user;
    this.userKey = userKey;
    this.vaultKey = vaultKey;
    this.onActivity = onActivity || (() => {});

    // Propiedades a inyectar antes de render()
    this.existingSecret = null; // Documento a editar (si existe)
    this.currentTemplate = null; // Plantilla base (obligatoria)

    this.onClose = () => {};
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[80vh] flex flex-col animate-fade-in";

    // Datos visuales
    const isEditing = !!this.existingSecret;
    const templateIcon = this.currentTemplate?.icon || "📄";
    const templateName = this.currentTemplate?.name || "Documento General";
    const initialTitle = isEditing ? this.existingSecret.title : "";
    const initialLevel = isEditing ? this.existingSecret.level : "1";

    container.innerHTML = `
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div class="flex items-center gap-4">
                    <button type="button" id="back-btn" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">←</button>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <span class="text-xl">${templateIcon}</span>
                            <span class="uppercase tracking-wider font-bold text-xs text-blue-600">${templateName}</span>
                            <span class="text-xs">• ${
                              isEditing ? "Editando" : "Nuevo"
                            }</span>
                        </div>
                        <input type="text" id="doc-title" placeholder="Título del Documento (Visible)" 
                            class="text-2xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none w-full bg-transparent focus:ring-0 p-0"
                            value="${initialTitle}">
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span id="status-indicator" class="text-xs font-bold text-gray-300">Sin cambios</span>
                    <button type="button" id="save-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-100 flex items-center gap-2 transform active:scale-95">
                        <span>💾</span> Guardar
                    </button>
                </div>
            </div>

            <div id="dynamic-form-container" class="flex-1 relative space-y-6 pb-10">
                <div id="loading-spinner" class="text-center py-10 text-gray-400 hidden">
                    <span class="animate-pulse">🔓 Descifrando información segura...</span>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <span class="text-xs font-bold text-gray-400 uppercase">Protección:</span>
                    
                    <label class="flex items-center gap-2 cursor-pointer group select-none">
                        <input type="radio" name="security-level" value="1" class="hidden peer" ${
                          initialLevel === "1" ? "checked" : ""
                        }>
                        <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 peer-checked:bg-green-100 peer-checked:text-green-700 peer-checked:border-green-200 transition flex items-center gap-2 group-hover:shadow-sm">
                            <span>🛡️</span> <span class="text-sm font-bold">Estándar</span>
                        </div>
                    </label>

                    <label class="flex items-center gap-2 cursor-pointer group relative select-none">
                        <input type="radio" name="security-level" value="2" class="hidden peer" ${
                          initialLevel === "2" ? "checked" : ""
                        } ${!this.vaultKey ? "disabled" : ""}>
                        <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 peer-checked:bg-blue-100 peer-checked:text-blue-700 peer-checked:border-blue-200 transition flex items-center gap-2 ${
                          !this.vaultKey
                            ? "opacity-50 cursor-not-allowed"
                            : "group-hover:shadow-sm"
                        }">
                            <span>🔒</span> <span class="text-sm font-bold">Bóveda</span>
                        </div>
                        ${
                          !this.vaultKey
                            ? '<span class="absolute -top-8 left-0 w-max bg-gray-800 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition">Requiere abrir bóveda</span>'
                            : ""
                        }
                    </label>
                </div>
                
                <button type="button" id="print-btn" class="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-200 transition" title="Vista de Impresión">
                    🖨️
                </button>
            </div>
        `;

    // --- INICIALIZACIÓN ---

    // 1. Renderizar Formulario
    // Si estamos editando, primero desciframos, luego pintamos.
    // Si es nuevo, pintamos vacío.
    const formContainer = container.querySelector("#dynamic-form-container");
    const spinner = container.querySelector("#loading-spinner");

    if (isEditing) {
      spinner.classList.remove("hidden");
      this.decryptAndRender(formContainer, spinner);
    } else {
      this.renderFormFields(formContainer, {}); // Valores vacíos
    }

    // --- LISTENERS ---

    container.querySelector("#back-btn").onclick = () => this.onClose();

    // Detectar cambios en inputs para el indicador "Sin cambios"
    container.addEventListener("input", () => {
      const status = container.querySelector("#status-indicator");
      status.innerText = "Cambios sin guardar...";
      status.className = "text-xs font-bold text-yellow-500";
      this.onActivity(); // Keep-alive
    });

    // Guardar
    container.querySelector("#save-btn").onclick = (e) => {
      e.preventDefault();
      this.handleSave(container);
    };

    // Impresión (Placeholder por ahora, siguiente paso)
    container.querySelector("#print-btn").onclick = () => {
      alert(
        "La funcionalidad de Impresión (Normal/Compacta/Fácil) será el siguiente paso."
      );
    };

    return container;
  }

  // --- LÓGICA CORE ---

  async decryptAndRender(container, spinner) {
    try {
      const keyToUse =
        this.existingSecret.level === "2" ? this.vaultKey : this.userKey;

      if (!keyToUse) throw new Error("Llave de seguridad no disponible.");

      const jsonString = await CryptoManager.decrypt(
        this.existingSecret.content,
        keyToUse
      );
      let values = {};
      try {
        values = JSON.parse(jsonString);
      } catch (e) {
        // Soporte legacy o error
        console.warn(
          "El contenido no es un JSON válido, mostrando como texto plano en un campo genérico.",
          e
        );
        values = { _legacy: jsonString };
      }

      spinner.classList.add("hidden");
      this.renderFormFields(container, values);
    } catch (error) {
      spinner.innerHTML = `<span class="text-red-500 font-bold">Error al descifrar: ${error.message}</span>`;
      console.error(error);
    }
  }

  renderFormFields(container, values) {
    if (!this.currentTemplate || !this.currentTemplate.elements) {
      container.innerHTML = `<div class="text-gray-400 text-center">La plantilla está vacía.</div>`;
      return;
    }

    this.currentTemplate.elements.forEach((element) => {
      const strategy = ElementRegistry.get(element.type);
      if (!strategy) return; // Tipo desconocido, ignorar

      // Crear wrapper para el campo
      const wrapper = document.createElement("div");
      wrapper.className = "field-wrapper animate-fade-in";
      // Guardamos metadatos en el DOM para poder extraer el valor después
      wrapper.dataset.id = element.id;
      wrapper.dataset.type = element.type;

      // Obtener valor (o vacío)
      const val = values[element.id] !== undefined ? values[element.id] : "";

      // Renderizar HTML del editor
      // Notar el contexto 'form' explicito
      wrapper.innerHTML = strategy.renderEditor(element, val, "form");

      container.appendChild(wrapper);

      // ACTIVAR LISTENERS DEL ELEMENTO (Ej: Botón Agregar Fila en Tabla)
      // Si la estrategia tiene un método attachListeners, lo llamamos pasando el wrapper
      // Las tablas definidas en ComplexElements.js usan esto.
      if (typeof strategy.attachListeners === "function") {
        strategy.attachListeners(wrapper);
      }
    });
  }

  async handleSave(container) {
    const title = container.querySelector("#doc-title").value.trim();
    if (!title) return alert("El documento necesita un título.");

    const level = container.querySelector(
      'input[name="security-level"]:checked'
    ).value;
    const keyToUse = level === "2" ? this.vaultKey : this.userKey;

    if (!keyToUse)
      return alert("No tienes acceso a la llave necesaria (Bóveda cerrada).");

    // 1. RECOLECCIÓN DE DATOS
    const formValues = {};
    const fieldWrappers = container.querySelectorAll(".field-wrapper");

    fieldWrappers.forEach((wrapper) => {
      const id = wrapper.dataset.id;
      const type = wrapper.dataset.type;
      const strategy = ElementRegistry.get(type);

      // Cada elemento sabe cómo extraer su propio valor del DOM
      const value = strategy.extractValue(wrapper);

      // Solo guardamos si no es null (los elementos estructurales como Títulos devuelven null)
      if (value !== null) {
        formValues[id] = value;
      }
    });

    // 2. ENCRIPTACIÓN
    try {
      const jsonString = JSON.stringify(formValues);
      const encryptedContent = await CryptoManager.encrypt(
        jsonString,
        keyToUse
      );

      // 3. ENVÍO A FIREBASE
      // Reportamos actividad antes de guardar (seguridad)
      // Nota: Aquí pasamos el título a checkAndRecordServerActivity, importado en main.js
      // O podemos usar this.onActivity() si solo queremos actualizar el timestamp local.
      // Lo ideal es validar con el servidor. Asumiremos que onActivity maneja lo básico o importamos la fn.
      // Para mantener encapsulamiento, usaremos la lógica pasada por props o importada.
      // Vamos a importar checkAndRecordServerActivity dinámicamente o asumir que onActivity es suficiente por ahora.
      this.onActivity();

      const payload = {
        uid: this.user.uid,
        title: title,
        content: encryptedContent,
        level: level,
        templateId: this.currentTemplate.id,
        updatedAt: serverTimestamp(),
      };

      if (this.existingSecret) {
        await updateDoc(doc(db, "secrets", this.existingSecret.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, "secrets"), payload);
      }

      alert("Documento guardado y encriptado exitosamente.");
      this.onClose(); // Volver al dashboard
    } catch (e) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    }
  }
}
