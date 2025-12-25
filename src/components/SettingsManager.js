import {
  getAuth,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  writeBatch,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../services/firebase.js";
import { CryptoManager } from "../utils/crypto.js";

export class SettingsManager {
  /**
   * @param {Object} params
   * @param {Object} params.currentUser - Usuario autenticado de Firebase
   * @param {CryptoKey} params.vaultKey - Llave actual de Nivel 2 (Bóveda)
   * @param {CryptoKey} params.userKey - Llave actual de Nivel 1 (Login)
   * @param {Array} params.allSecrets - Lista actual de documentos
   * @param {Function} params.onVaultKeyChange - Callback al cambiar frase maestra
   * @param {Function} params.onUserKeyChange - Callback al cambiar password login
   * @param {Function} params.onClose - Callback para cerrar la vista
   */
  constructor({
    currentUser,
    vaultKey,
    userKey,
    allSecrets,
    onVaultKeyChange,
    onUserKeyChange,
    onClose,
  }) {
    this.currentUser = currentUser;
    this.vaultKey = vaultKey;
    this.userKey = userKey;
    this.allSecrets = allSecrets;
    this.onVaultKeyChange = onVaultKeyChange;
    this.onUserKeyChange = onUserKeyChange;
    this.onClose = onClose;
  }

  /**
   * Valida reglas estrictas de contraseña
   */
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return "Mínimo 8 caracteres.";
    if (!hasUpperCase) return "Falta una letra mayúscula.";
    if (!hasLowerCase) return "Falta una letra minúscula.";
    if (!hasNumbers) return "Falta un número.";
    if (!hasSpecialChar) return "Falta un carácter especial (!@#$...).";
    return null; // Válida
  }

  render() {
    const container = document.createElement("div");
    container.className =
      "max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100 animate-fade-in relative mb-10";

    // --- HEADER ---
    container.innerHTML = `
            <div class="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                <div class="flex items-center gap-4">
                    <button type="button" id="back-btn" class="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Configuración</h1>
                        <p class="text-xs text-slate-400">Seguridad y Gestión de Datos</p>
                    </div>
                </div>
            </div>

            <div class="grid gap-8 md:grid-cols-2">
                
                <section class="space-y-4">
                    <div class="flex items-center gap-2 text-blue-600 mb-1">
                        <div class="p-1.5 bg-blue-100 rounded-lg">
                            <span class="text-xl">🔐</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-700">Acceso (Nivel 1)</h3>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 leading-relaxed">
                            <strong>Nota:</strong> Cambiar tu contraseña re-encriptará automáticamente todos tus documentos de Nivel 1.
                        </div>
                        <form id="change-pwd-form" class="space-y-3">
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Contraseña Actual</label>
                                <input type="password" id="current-pwd" class="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required>
                            </div>
                            
                            <div>
                                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nueva Contraseña</label>
                                <input type="password" id="new-pwd" class="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required>
                                <p class="text-[10px] text-slate-400 mt-1 ml-1 leading-tight">Mín. 8 chars, 1 mayúscula, 1 minúscula, 1 número, 1 símbolo.</p>
                            </div>
                            
                            <div>
                                <input type="password" id="confirm-pwd" placeholder="Confirmar Nueva" class="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" required>
                            </div>

                            <button type="submit" id="btn-change-pwd" class="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-900/10 active:scale-95 text-sm">Actualizar Todo</button>
                        </form>
                    </div>
                </section>

                <section class="space-y-4">
                    <div class="flex items-center gap-2 text-indigo-600 mb-1">
                        <div class="p-1.5 bg-indigo-100 rounded-lg">
                            <span class="text-xl">🗝️</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-700">Bóveda (Nivel 2)</h3>
                    </div>
                    <div class="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div class="bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs text-indigo-800 leading-relaxed">
                             <strong>Nota:</strong> Esto re-encriptará todos los documentos confidenciales de la Bóveda.
                        </div>
                        
                        ${
                          !this.vaultKey
                            ? `<div class="flex items-center justify-center gap-2 text-red-600 text-xs font-bold bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                                🔒 Abre la Bóveda primero para configurarla.
                            </div>`
                            : `
                            <form id="change-phrase-form" class="space-y-3">
                                <div>
                                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nueva Frase Maestra</label>
                                    <input type="password" id="new-phrase" class="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required minlength="10">
                                </div>
                                <div>
                                    <input type="password" id="confirm-phrase" placeholder="Confirmar Frase" class="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" required>
                                </div>
                                <button type="submit" id="btn-reencrypt" class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20 active:scale-95 text-sm">Re-Encriptar Bóveda</button>
                            </form>
                            `
                        }
                    </div>
                </section>
                
                <section class="md:col-span-2 pt-6 border-t border-slate-100 mt-2">
                    <h3 class="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span class="text-xl">💾</span> Gestión de Respaldo
                    </h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        
                        <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <h4 class="font-bold text-slate-700 mb-1 group-hover:text-green-600 transition-colors">Exportar Datos (JSON)</h4>
                            <p class="text-xs text-slate-500 mb-4">Descarga una copia de seguridad <strong>desencriptada</strong>. Guárdala en un lugar seguro.</p>
                            <button id="btn-export" class="flex items-center justify-center gap-2 w-full py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-bold hover:bg-green-600 hover:text-white transition active:scale-95 text-sm">
                                ⬇️ Descargar Copia
                            </button>
                        </div>

                        <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <h4 class="font-bold text-slate-700 mb-1 group-hover:text-amber-600 transition-colors">Restaurar Copia</h4>
                            <p class="text-xs text-slate-500 mb-4">Importar un archivo JSON. Los datos se <strong>re-encriptarán</strong> con tus claves actuales.</p>
                            <label class="flex items-center justify-center gap-2 w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-bold hover:bg-amber-600 hover:text-white transition active:scale-95 cursor-pointer text-sm">
                                ⬆️ Seleccionar Archivo
                                <input type="file" id="file-import" accept=".json" class="hidden">
                            </label>
                        </div>
                    </div>
                </section>
            </div>
        `;

    this.attachListeners(container);
    return container;
  }

  attachListeners(container) {
    // Volver
    container.querySelector("#back-btn").onclick = this.onClose;

    // ============================================================
    // 1. CAMBIO DE PASSWORD LOGIN (Nivel 1)
    // ============================================================
    const pwdForm = container.querySelector("#change-pwd-form");
    if (pwdForm) {
      pwdForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const currentPwd = container.querySelector("#current-pwd").value;
        const newPwd = container.querySelector("#new-pwd").value;
        const confirmPwd = container.querySelector("#confirm-pwd").value;

        if (newPwd !== confirmPwd)
          return alert("❌ Las contraseñas nuevas no coinciden.");

        const validationError = this.validatePassword(newPwd);
        if (validationError)
          return alert("❌ Contraseña insegura:\n" + validationError);

        if (
          !confirm(
            "⚠️ ¿Estás seguro de cambiar tu contraseña de acceso?\n\nLa app procesará y re-guardará tus datos de Nivel 1."
          )
        )
          return;

        const btn = container.querySelector("#btn-change-pwd");
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "⏳ Re-encriptando Nivel 1...";

        try {
          const auth = getAuth();
          const user = auth.currentUser;

          // 1. Re-autenticar (Obligatorio)
          const credential = EmailAuthProvider.credential(
            user.email,
            currentPwd
          );
          await reauthenticateWithCredential(user, credential);

          // 2. Generar NUEVA llave Nivel 1 (PBKDF2 del nuevo password)
          const newUserKey = await CryptoManager.deriveKey(newPwd, user.email);

          // 3. Filtrar docs Nivel 1
          const level1Docs = this.allSecrets.filter((s) => s.level === "1");

          const batch = writeBatch(db);
          let count = 0;

          // 4. Re-encriptación
          for (const docData of level1Docs) {
            // A. Desencriptar con llave ACTUAL (this.userKey)
            const rawJson = await CryptoManager.decrypt(
              docData.content,
              this.userKey
            );
            // B. Encriptar con NUEVA llave (newUserKey)
            const newContent = await CryptoManager.encrypt(rawJson, newUserKey);

            const docRef = doc(db, "secrets", docData.id);
            batch.update(docRef, { content: newContent });
            count++;
          }

          // 5. Actualizar Auth en Firebase
          await updatePassword(user, newPwd);

          // 6. Guardar lote en Firestore
          if (count > 0) await batch.commit();

          // 7. Actualizar memoria local
          this.onUserKeyChange(newUserKey);

          alert(
            `✅ Contraseña actualizada correctamente.\n${count} documentos re-protegidos.`
          );
          e.target.reset();
        } catch (error) {
          console.error(error);
          alert("❌ Error: " + error.message);
        } finally {
          btn.disabled = false;
          btn.innerText = originalText;
        }
      });
    }

    // ============================================================
    // 2. CAMBIO DE FRASE MAESTRA (Nivel 2)
    // ============================================================
    const phraseForm = container.querySelector("#change-phrase-form");
    if (phraseForm) {
      phraseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const newPhrase = container.querySelector("#new-phrase").value;
        const confirmPhrase = container.querySelector("#confirm-phrase").value;

        if (newPhrase !== confirmPhrase)
          return alert("❌ Las frases no coinciden.");
        if (newPhrase.length < 10)
          return alert("❌ La frase debe tener al menos 10 caracteres.");

        if (
          !confirm(
            "⚠️ ATENCIÓN:\nSe van a descifrar y volver a cifrar todos los datos de la Bóveda.\n¿Continuar?"
          )
        )
          return;

        const btn = container.querySelector("#btn-reencrypt");
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "⏳ Procesando Bóveda...";

        try {
          // 1. Generar nueva llave Nivel 2
          const newVaultKey = await CryptoManager.deriveKey(
            newPhrase,
            "vault-salt-unique-v1"
          );

          // 2. Filtrar docs Nivel 2
          const vaultDocs = this.allSecrets.filter((s) => s.level === "2");

          const batch = writeBatch(db);
          let count = 0;

          // 3. Re-encriptación
          for (const docData of vaultDocs) {
            const rawJson = await CryptoManager.decrypt(
              docData.content,
              this.vaultKey
            );
            const newContent = await CryptoManager.encrypt(
              rawJson,
              newVaultKey
            );

            const docRef = doc(db, "secrets", docData.id);
            batch.update(docRef, { content: newContent });
            count++;
          }

          // 4. Commit
          if (count > 0) await batch.commit();

          // 5. Actualizar memoria
          this.onVaultKeyChange(newVaultKey);

          alert(
            `✅ Frase Maestra cambiada con éxito.\n${count} documentos de bóveda actualizados.`
          );
          phraseForm.reset();
        } catch (err) {
          console.error(err);
          alert("❌ Error crítico: " + err.message);
        } finally {
          btn.disabled = false;
          btn.innerText = originalText;
        }
      });
    }

    // ============================================================
    // 3. EXPORTAR DATOS (Desencriptados)
    // ============================================================
    const btnExport = container.querySelector("#btn-export");
    if (btnExport) {
      btnExport.onclick = async () => {
        // Verificar que tenemos las llaves necesarias
        if (!this.userKey)
          return alert("Error: No hay llave de usuario disponible.");

        const hasLevel2 = this.allSecrets.some((s) => s.level === "2");
        if (hasLevel2 && !this.vaultKey) {
          if (
            !confirm(
              "⚠️ La Bóveda está cerrada.\nLos documentos de Nivel 2 NO se incluirán en el respaldo.\n¿Deseas continuar solo con Nivel 1?"
            )
          )
            return;
        }

        if (
          !confirm(
            "⚠️ ADVERTENCIA DE SEGURIDAD:\n\nEl archivo descargado contendrá tus contraseñas en TEXTO PLANO (legibles).\n\nCualquiera con acceso al archivo podrá ver tus datos.\n\n¿Entendido?"
          )
        )
          return;

        try {
          const backupData = {
            meta: {
              version: "1.0",
              date: new Date().toISOString(),
              user: this.currentUser.email,
            },
            items: [],
          };

          for (const doc of this.allSecrets) {
            try {
              let plainText = null;

              // Descifrar según nivel
              if (doc.level === "1") {
                plainText = await CryptoManager.decrypt(
                  doc.content,
                  this.userKey
                );
              } else if (doc.level === "2" && this.vaultKey) {
                plainText = await CryptoManager.decrypt(
                  doc.content,
                  this.vaultKey
                );
              }

              if (plainText) {
                backupData.items.push({
                  id: doc.id,
                  title: doc.title,
                  level: doc.level,
                  templateId: doc.templateId || "default", // Preservar tipo
                  data: JSON.parse(plainText),
                });
              }
            } catch (e) {
              console.error(`Error exportando ${doc.id}`, e);
            }
          }

          const blob = new Blob([JSON.stringify(backupData, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `backup_gestion_${new Date()
            .toISOString()
            .slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          alert("Error al generar respaldo: " + e.message);
        }
      };
    }

    // ============================================================
    // 4. IMPORTAR DATOS (Restauración)
    // ============================================================
    const fileImport = container.querySelector("#file-import");
    if (fileImport) {
      fileImport.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const json = JSON.parse(event.target.result);

            if (!json.items || !Array.isArray(json.items)) {
              throw new Error("Formato de archivo inválido (falta 'items').");
            }

            // Verificar si el backup tiene items Nivel 2 y si tenemos la llave
            const hasLevel2 = json.items.some((i) => i.level === "2");
            if (hasLevel2 && !this.vaultKey) {
              alert(
                "❌ El respaldo contiene datos de Bóveda (Nivel 2).\nDebes ABRIR LA BÓVEDA antes de importar para poder encriptarlos correctamente."
              );
              fileImport.value = "";
              return;
            }

            if (
              !confirm(
                `⚠️ RESTAURACIÓN:\n\nSe encontraron ${json.items.length} documentos.\nSe añadirán a tu base de datos y se encriptarán con tus claves actuales.\n\n¿Proceder?`
              )
            ) {
              fileImport.value = "";
              return;
            }

            const batch = writeBatch(db);
            let importedCount = 0;

            // Procesar cada item
            for (const item of json.items) {
              // Determinar qué llave usar para ENCRIPTAR antes de guardar
              let keyToUse = null;
              if (item.level === "1") keyToUse = this.userKey;
              else if (item.level === "2") keyToUse = this.vaultKey;

              if (keyToUse) {
                // Encriptamos el objeto de datos
                const encryptedContent = await CryptoManager.encrypt(
                  JSON.stringify(item.data),
                  keyToUse
                );

                // Referencia: Si tiene ID, intentamos usarlo (sobrescribe), si no, nuevo.
                // Nota: Para evitar conflictos raros, mejor crear nuevos docs o usar set con merge.
                // Usaremos el ID del backup para mantener consistencia si es una restauración total.
                const docRef = item.id
                  ? doc(db, "secrets", item.id)
                  : doc(collection(db, "secrets"));

                batch.set(
                  docRef,
                  {
                    title: item.title,
                    level: item.level,
                    templateId: item.templateId || "default",
                    content: encryptedContent,
                    updatedAt: new Date().toISOString(),
                    uid: this.currentUser.uid,
                  },
                  { merge: true }
                );

                importedCount++;
              }
            }

            if (importedCount > 0) {
              await batch.commit();
              alert(
                `✅ Restauración completada: ${importedCount} documentos importados.`
              );
              // Opcional: Recargar dashboard
              this.onClose();
            } else {
              alert("⚠️ No se pudo importar ningún documento.");
            }
          } catch (err) {
            console.error(err);
            alert("❌ Error al leer archivo: " + err.message);
          }
          fileImport.value = ""; // Limpiar input
        };
        reader.readAsText(file);
      };
    }
  }
}
