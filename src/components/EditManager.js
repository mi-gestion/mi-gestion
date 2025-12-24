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
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[80vh] flex flex-col animate-fade-in relative";

    const isEditing = !!this.existingSecret;
    const templateIcon = this.currentTemplate?.icon || "📄";
    const templateName = this.currentTemplate?.name || "Documento General";
    const initialTitle = isEditing ? this.existingSecret.title : "";
    const initialLevel = isEditing ? this.existingSecret.level : "1";

    container.innerHTML = `
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 relative z-0">
                <div class="flex items-center gap-4 w-full">
                    <button type="button" id="cancel-btn-top" class="p-2 hover:bg-gray-100 rounded-full transition text-gray-500" title="Cancelar">✕</button>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <span class="text-xl">${templateIcon}</span>
                            <span class="uppercase tracking-wider font-bold text-xs text-blue-600">${templateName}</span>
                            <span class="text-xs">• ${
                              isEditing ? "Editando" : "Nuevo"
                            }</span>
                        </div>
                        <input type="text" id="doc-title" placeholder="Título del Documento" 
                            class="text-2xl font-bold text-gray-800 placeholder-gray-300 border-none outline-none w-full bg-transparent focus:ring-0 p-0"
                            value="${initialTitle}">
                    </div>
                    <div class="flex items-center gap-3">
                         <span id="status-indicator" class="text-xs font-bold text-gray-300 hidden sm:block">Sin cambios</span>
                         <button type="button" id="save-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-100 flex items-center gap-2 transform active:scale-95">
                            <span>💾</span> Guardar
                        </button>
                    </div>
                </div>
            </div>

            <div id="dynamic-form-container" class="grid grid-cols-4 gap-6 pb-10 z-0">
                <div id="loading-spinner" class="text-center py-10 text-gray-400 hidden col-span-4">
                    <span class="animate-pulse">🔓 Descifrando información segura...</span>
                </div>
            </div>

            <div class="mt-6 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl flex items-center justify-between z-20 relative">
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
                    </label>
                </div>
            </div>
        `;

    // Inicialización
    const formContainer = container.querySelector("#dynamic-form-container");
    const spinner = container.querySelector("#loading-spinner");

    if (isEditing) {
      spinner.classList.remove("hidden");
      this.decryptAndRender(formContainer, spinner);
    } else {
      this.renderFormFields(formContainer, {});
    }

    // Listeners
    container.querySelector("#cancel-btn-top").onclick = this.onCancel;

    container.addEventListener("input", () => {
      const status = container.querySelector("#status-indicator");
      status.innerText = "Cambios sin guardar...";
      status.className = "text-xs font-bold text-yellow-500 hidden sm:block";
      this.onActivity();
    });

    container.querySelector("#save-btn").onclick = (e) => {
      e.preventDefault();
      this.handleSave(container);
    };

    return container;
  }

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
        values = { _legacy: jsonString };
      }

      spinner.classList.add("hidden");
      this.renderFormFields(container, values);
    } catch (error) {
      console.error(error);
      spinner.innerHTML = `<span class="text-red-500 font-bold col-span-4">Error al descifrar: ${error.message}</span>`;
    }
  }

  renderFormFields(container, values) {
    if (!this.currentTemplate?.elements) return;

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
      const gridClass = colSpanClasses[span] || "col-span-4";
      wrapper.className = `field-wrapper animate-fade-in ${gridClass}`;

      wrapper.dataset.id = element.id;
      wrapper.dataset.type = element.type;

      const val = values[element.id] !== undefined ? values[element.id] : "";
      wrapper.innerHTML = strategy.renderEditor(element, val, "form");
      container.appendChild(wrapper);

      if (typeof strategy.attachListeners === "function") {
        strategy.attachListeners(wrapper);
      }
    });
  }

  getFormValues(container) {
    const formValues = {};
    const fieldWrappers = container.querySelectorAll(".field-wrapper");
    fieldWrappers.forEach((wrapper) => {
      const id = wrapper.dataset.id;
      const type = wrapper.dataset.type;
      const strategy = ElementRegistry.get(type);
      const value = strategy.extractValue(wrapper);
      if (value !== null) formValues[id] = value;
    });
    return formValues;
  }

  async handleSave(container) {
    const title = container.querySelector("#doc-title").value.trim();
    if (!title) return alert("El documento necesita un título.");

    const level = container.querySelector(
      'input[name="security-level"]:checked'
    ).value;
    const keyToUse = level === "2" ? this.vaultKey : this.userKey;

    if (level === "2" && !this.vaultKey)
      return alert("Debes abrir la Bóveda para guardar en Nivel 2.");
    if (!this.userKey) return alert("Error de sesión: Falta llave personal.");

    const formValues = this.getFormValues(container);

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

      this.onSaveSuccess(); // Callback para volver al dashboard
    } catch (e) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    }
  }
}
