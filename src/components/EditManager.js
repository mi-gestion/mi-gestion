import { db } from "../services/firebase.js";
import { CryptoManager } from "../utils/crypto.js";
import {
  updateDoc,
  addDoc,
  collection,
  doc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ElementRegistry } from "../elements/ElementRegistry.js";
import { StateManager } from "../utils/StateManager.js"; // IMPORTANTE: Importar el nuevo gestor

export class EditManager {
  constructor(user, userKey, vaultKey, onActivity, onSaveSuccess, onCancel) {
    this.user = user;
    this.userKey = userKey;
    this.vaultKey = vaultKey;
    this.onActivity = onActivity || (() => {});
    this.onSaveSuccess = onSaveSuccess;
    this.onCancel = onCancel;

    this.existingSecret = null;
    this.currentTemplate = null;
    this.stateManager = null; // Inicializamos referencia
  }

  // ... (render y otros métodos de UI se mantienen igual hasta renderFormFields) ...

  // Mantenemos render() igual, pero asegúrate de que use this.renderFormFields actualizado

  render() {
    // ... (Código de renderizado del contenedor igual que antes) ...
    // Copia el contenido del método render() original aquí si es necesario,
    // lo importante es que al final llama a this.renderFormFields

    // NOTA: Para brevedad, asumo que mantienes el método render() original.
    // Solo cambiaré la lógica interna de manejo de datos abajo.

    // IMPORTANTE: Debemos recrear el render completo para instanciar listeners
    // Aquí te doy la versión resumida con los cambios CLAVE:

    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[80vh] flex flex-col animate-fade-in relative";

    // ... (Header y HTML estructura igual al original) ...
    container.innerHTML = `
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 relative z-0">
             <div class="flex items-center gap-4 w-full">
                <button type="button" id="cancel-btn-top" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">✕</button>
                <div class="flex-1">
                    <input type="text" id="doc-title" placeholder="Título del Documento" 
                        class="text-2xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none w-full bg-transparent focus:ring-0 p-0">
                </div>
                <div class="flex items-center gap-3">
                     <span id="status-indicator" class="text-xs font-bold text-gray-300 hidden sm:block">Sin cambios</span>
                     <button type="button" id="save-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-100 flex items-center gap-2">
                        <span>💾</span> Guardar
                    </button>
                </div>
            </div>
        </div>
        <div id="dynamic-form-container" class="grid grid-cols-4 gap-6 pb-10 z-0"></div>
        <div class="mt-6 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl flex items-center justify-between z-20 relative">
             <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer group select-none">
                    <input type="radio" name="security-level" value="1" class="hidden peer" checked>
                    <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 peer-checked:bg-green-100 peer-checked:text-green-700 peer-checked:border-green-200 transition flex items-center gap-2">
                        <span>🛡️</span> <span class="text-sm font-bold">Estándar</span>
                    </div>
                </label>
                 <label class="flex items-center gap-2 cursor-pointer group relative select-none">
                    <input type="radio" name="security-level" value="2" class="hidden peer" ${
                      !this.vaultKey ? "disabled" : ""
                    }>
                    <div class="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-500 peer-checked:bg-blue-100 peer-checked:text-blue-700 peer-checked:border-blue-200 transition flex items-center gap-2">
                        <span>🔒</span> <span class="text-sm font-bold">Bóveda</span>
                    </div>
                </label>
             </div>
        </div>
    `;

    // Lógica de carga
    const formContainer = container.querySelector("#dynamic-form-container");
    const titleInput = container.querySelector("#doc-title");
    const levelInputs = container.querySelectorAll(
      'input[name="security-level"]'
    );

    if (this.existingSecret) {
      titleInput.value = this.existingSecret.title;
      // Set level...
      levelInputs.forEach((r) => {
        if (r.value === this.existingSecret.level) r.checked = true;
      });
      this.decryptAndRender(formContainer);
    } else {
      // Nuevo documento: Inicializamos StateManager vacío
      this.stateManager = new StateManager({});
      this.renderFormFields(formContainer, {});
    }

    // Eventos UI
    container.querySelector("#cancel-btn-top").onclick = this.onCancel;
    container.querySelector("#save-btn").onclick = (e) => {
      e.preventDefault();
      this.handleSave(container);
    };

    // Suscribir indicador de estado a cambios del StateManager
    // Esto es un ejemplo de "Reactivity" real, no DOM listening
    // (Se hará efectivo cuando renderFormFields configure el manager)

    return container;
  }

  async decryptAndRender(container) {
    try {
      const keyToUse =
        this.existingSecret.level === "2" ? this.vaultKey : this.userKey;
      if (!keyToUse) throw new Error("Llave no disponible.");

      const jsonString = await CryptoManager.decrypt(
        this.existingSecret.content,
        keyToUse
      );
      let values = {};
      try {
        values = JSON.parse(jsonString);
      } catch (e) {
        values = { _legacy: jsonString };
      }

      // Inicializamos el StateManager con los datos recuperados
      this.stateManager = new StateManager(values);

      this.renderFormFields(container, values);
    } catch (error) {
      container.innerHTML = `<span class="text-red-500 font-bold col-span-4">Error: ${error.message}</span>`;
    }
  }

  renderFormFields(container, values) {
    if (!this.currentTemplate?.elements) return;

    // Suscribirnos a cambios globales para marcar "Sin guardar"
    this.stateManager.subscribe(() => {
      const status = document.querySelector("#status-indicator");
      if (status) {
        status.innerText = "Cambios sin guardar...";
        status.className = "text-xs font-bold text-yellow-500 hidden sm:block";
      }
      this.onActivity();
    });

    const colSpanClasses = {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
    };

    this.currentTemplate.elements.forEach((element) => {
      const strategy = ElementRegistry.get(element.type);
      if (!strategy) return;

      const wrapper = document.createElement("div");
      const span = element.colSpanEditor || 4;
      wrapper.className = `field-wrapper animate-fade-in ${
        colSpanClasses[span] || "col-span-4"
      }`;
      wrapper.dataset.id = element.id;

      const val = values[element.id] !== undefined ? values[element.id] : "";

      // Renderizamos el HTML inicial
      wrapper.innerHTML = strategy.renderEditor(element, val, "form");
      container.appendChild(wrapper);

      // NUEVO: Pasamos el callback de actualización
      if (typeof strategy.attachListeners === "function") {
        strategy.attachListeners(wrapper, (newValue) => {
          // Cuando el input cambie, actualizamos el estado central
          this.stateManager.update(element.id, newValue);
        });
      }
    });
  }

  // ELIMINADO: getFormValues(container)
  // Ya no necesitamos raspar el DOM.

  async handleSave(container) {
    const title = container.querySelector("#doc-title").value.trim();
    if (!title) return alert("El documento necesita un título.");

    const level = container.querySelector(
      'input[name="security-level"]:checked'
    ).value;
    const keyToUse = level === "2" ? this.vaultKey : this.userKey;

    if (level === "2" && !this.vaultKey) return alert("Falta llave de Bóveda.");
    if (!this.userKey) return alert("Falta llave personal.");

    // NUEVO: Obtenemos los datos directamente de la memoria
    const formValues = this.stateManager.get();

    try {
      this.onActivity();
      const jsonString = JSON.stringify(formValues);
      const encryptedContent = await CryptoManager.encrypt(
        jsonString,
        keyToUse
      );

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

      this.onSaveSuccess();
    } catch (e) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    }
  }
}
