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
  constructor(user, userKey, vaultKey, onActivity) {
    this.user = user;
    this.userKey = userKey;
    this.vaultKey = vaultKey;
    this.onActivity = onActivity || (() => {});

    this.existingSecret = null;
    this.currentTemplate = null;
    this.onClose = () => {};
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-100 min-h-[80vh] flex flex-col animate-fade-in relative";

    // Datos visuales
    const isEditing = !!this.existingSecret;
    const templateIcon = this.currentTemplate?.icon || "📄";
    const templateName = this.currentTemplate?.name || "Documento General";
    const initialTitle = isEditing ? this.existingSecret.title : "";
    const initialLevel = isEditing ? this.existingSecret.level : "1";

    container.innerHTML = `
            <div id="print-backdrop" class="fixed inset-0 z-10 hidden" style="cursor: default;"></div>

            <div style="opacity: 0; position: absolute; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;">
                <input type="text" name="fake_email_honey" autocomplete="username">
                <input type="password" name="fake_password_honey" autocomplete="current-password">
            </div>

            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 relative z-0">
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
                        <input type="text" id="doc-title" placeholder="Título del Documento" 
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
                
                <div class="relative">
                    <button type="button" id="print-btn" class="relative z-20 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 hover:border-blue-300 px-3 py-2 rounded-lg transition flex items-center gap-2 shadow-sm">
                        <span>🖨️</span> <span class="text-sm font-bold">Imprimir</span>
                    </button>
                    
                    <div id="print-menu" class="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 hidden overflow-hidden z-30 animate-slide-up">
                        <div class="p-2 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Modo de Impresión</div>
                        <button type="button" class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 font-medium border-b border-gray-50 flex justify-between" data-mode="normal">
                            📄 Normal
                        </button>
                        <button type="button" class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 font-medium border-b border-gray-50 flex justify-between" data-mode="compact">
                            📊 Compacta
                        </button>
                        <button type="button" class="print-opt w-full text-left px-4 py-3 text-sm hover:bg-blue-50 hover:text-blue-700 font-medium flex justify-between" data-mode="easy">
                            👓 Lectura Fácil
                        </button>
                    </div>
                </div>
            </div>
        `;

    // --- INICIALIZACIÓN ---
    const formContainer = container.querySelector("#dynamic-form-container");
    const spinner = container.querySelector("#loading-spinner");

    if (isEditing) {
      spinner.classList.remove("hidden");
      this.decryptAndRender(formContainer, spinner);
    } else {
      this.renderFormFields(formContainer, {});
    }

    // --- LISTENERS ---
    container.querySelector("#back-btn").onclick = () => this.onClose();

    container.addEventListener("input", () => {
      const status = container.querySelector("#status-indicator");
      status.innerText = "Cambios sin guardar...";
      status.className = "text-xs font-bold text-yellow-500";
      this.onActivity();
    });

    container.querySelector("#save-btn").onclick = (e) => {
      console.log("🛠️ [Template] Compilando estructura de la plantilla...");
      e.preventDefault();
      this.handleSave(container);
    };

    // --- LÓGICA DEL MENÚ DE IMPRESIÓN (TOGGLE) ---
    const printBtn = container.querySelector("#print-btn");
    const printMenu = container.querySelector("#print-menu");
    const backdrop = container.querySelector("#print-backdrop");

    // 1. Abrir/Cerrar menú
    printBtn.onclick = (e) => {
      e.stopPropagation(); // Evitar que el clic suba
      const isHidden = printMenu.classList.contains("hidden");
      if (isHidden) {
        // Abrir
        printMenu.classList.remove("hidden");
        backdrop.classList.remove("hidden"); // Activar telón de fondo
      } else {
        // Cerrar
        printMenu.classList.add("hidden");
        backdrop.classList.add("hidden");
      }
    };

    // 2. Cerrar al hacer clic fuera (en el backdrop)
    backdrop.onclick = () => {
      printMenu.classList.add("hidden");
      backdrop.classList.add("hidden");
    };

    // 3. Cerrar al seleccionar opción
    container.querySelectorAll(".print-opt").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        // Cerrar menú
        printMenu.classList.add("hidden");
        backdrop.classList.add("hidden");
        // Ejecutar impresión
        this.generatePrintDocument(container, btn.dataset.mode);
      };
    });

    return container;
  }

  // --- MANEJO DE DATOS ---

  async decryptAndRender(container, spinner) {
    const level = this.existingSecret.level;
    console.log(`📖 [Secret] Abriendo documento Nivel ${level}...`);
    try {
      const keyToUse =
        this.existingSecret.level === "2" ? this.vaultKey : this.userKey;
      if (!keyToUse) throw new Error("Llave de seguridad no disponible.");

      const jsonString = await CryptoManager.decrypt(
        this.existingSecret.content,
        keyToUse
      );
      console.log("📄 [Secret] Contenido recuperado y parseado.");
      let values = {};
      try {
        values = JSON.parse(jsonString);
      } catch (e) {
        values = { _legacy: jsonString };
      }

      spinner.classList.add("hidden");
      this.renderFormFields(container, values);
    } catch (error) {
      console.error("❌ [Secret] Error al abrir documento:", error);
      spinner.innerHTML = `<span class="text-red-500 font-bold">Error al descifrar: ${error.message}</span>`;
    }
  }

  renderFormFields(container, values) {
    if (!this.currentTemplate?.elements) return;

    // 2. MAPA DE CLASES ESTÁTICAS (Solución al problema de Tailwind)
    // Al escribir las cadenas completas aquí, Tailwind las detecta y genera el CSS.
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

      // Obtenemos el valor (por defecto 4 si no existe)
      const span = element.colSpanEditor || 4;

      // Usamos el mapa para obtener la clase. Si falla, fallback a col-span-4
      const gridClass = colSpanClasses[span] || "col-span-4";

      // Aplicamos la clase estática
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
    console.log("💾 [Secret] Iniciando proceso de guardado...");
    const title = container.querySelector("#doc-title").value.trim();
    if (!title) return alert("El documento necesita un título.");

    const level = container.querySelector(
      'input[name="security-level"]:checked'
    ).value;
    const keyToUse = level === "2" ? this.vaultKey : this.userKey;

    if (level === "2" && !this.vaultKey)
      return alert("Debes abrir la Bóveda para guardar en Nivel 2.");

    console.log("User key: ", this.userKey, { level });
    if (!this.userKey) return alert("Error de sesión: Falta llave personal.");

    const formValues = this.getFormValues(container);
    console.log("📝 [Secret] Datos capturados del formulario:", formValues);

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

      alert("Guardado exitosamente.");
      console.log("✅ [Firebase] Documento guardado en Firestore.");
      this.onClose();
    } catch (e) {
      console.error("❌ [Secret] Error al guardar:", e);
      console.error(e);
      alert("Error al guardar: " + e.message);
    }
  }

  // --- SISTEMA DE IMPRESIÓN ---

  generatePrintDocument(container, mode) {
    const currentValues = this.getFormValues(container);
    const title =
      container.querySelector("#doc-title").value || "Documento sin título";
    const date = new Date().toLocaleDateString();

    let contentHtml = '<div class="print-grid">'; // Inicio del Grid

    if (this.currentTemplate && this.currentTemplate.elements) {
      this.currentTemplate.elements.forEach((el) => {
        const strategy = ElementRegistry.get(el.type);
        const val = currentValues[el.id];

        // Obtenemos el span de impresión (Default 8)
        const span = el.colSpanPrint || 8;

        const renderedEl = strategy.renderPrint(el, val, mode);
        // Envolvemos cada elemento en su contenedor de columna
        contentHtml += `<div class="print-col-span-${span}">${renderedEl}</div>`;
      });
    }
    contentHtml += "</div>"; // Fin del Grid

    const styles = this.getPrintStyles(mode);

    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow)
      return alert("Permite las ventanas emergentes para imprimir.");

    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir: ${title}</title>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 20px; color: #1a202c; }
                    h1 { margin-bottom: 5px; }
                    .meta { color: #718096; font-size: 12px; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; pb: 10px; }
                    table { border-collapse: collapse; width: 100%; }
                    
                    ${styles}
                    
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-4 { margin-bottom: 1rem; }
                    .mb-6 { margin-bottom: 1.5rem; }
                    .text-xs { font-size: 0.75rem; }
                    .text-sm { font-size: 0.875rem; }
                    .border { border: 1px solid #e2e8f0; }
                    .border-b { border-bottom: 1px solid #e2e8f0; }
                    .p-2 { padding: 0.5rem; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">
                    Plantilla: ${
                      this.currentTemplate.name
                    } • Impreso: ${date} • Modo: ${mode.toUpperCase()}
                </div>
                <div class="content">
                    ${contentHtml}
                </div>
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);
    printWindow.document.close();
  }

  getPrintStyles(mode) {
    // CSS Base para Grid de impresión
    const gridCSS = `
        .print-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 15px; }
        .print-col-span-1 { grid-column: span 1; }
        .print-col-span-2 { grid-column: span 2; }
        .print-col-span-3 { grid-column: span 3; }
        .print-col-span-4 { grid-column: span 4; }
        .print-col-span-5 { grid-column: span 5; }
        .print-col-span-6 { grid-column: span 6; }
        .print-col-span-7 { grid-column: span 7; }
        .print-col-span-8 { grid-column: span 8; }
    `;

    if (mode === "compact") {
      // Compacto ahora usa Grid en lugar de column-count
      return `
            body { font-size: 11px; padding: 10px; }
            ${gridCSS}
            h1 { font-size: 18px; grid-column: span 8; }
            h2, h3 { font-size: 14px; margin-top: 10px; }
            p { margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; }
        `;
    } else {
      // Normal y Easy
      return `
            body { font-size: 14px; line-height: 1.5; max-width: 900px; margin: 0 auto; }
            ${gridCSS}
            h1 { font-size: 24px; color: #2b6cb0; grid-column: span 8; }
            h2, h3 { grid-column: span 8; } /* Títulos fuerzan ancho completo a menos que se configure */
            table th { background-color: #f7fafc; text-align: left; padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; }
            table td { padding: 8px; border: 1px solid #e2e8f0; }
        `;
    }
  }
}
