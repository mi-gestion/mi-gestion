import { CryptoManager } from "../utils/crypto.js";
import { db } from "../services/firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export class SecretManager {
  constructor(user, userKey) {
    this.user = user;
    this.userKey = userKey;
  }

  async saveSecret(title, plainText, level) {
    // Verificamos el tiempo con el servidor antes de proceder
    const isActivityValid = await checkAndRecordServerActivity();
    if (!isActivityValid) return; // Si la sesión expiró, la función anterior ya hizo el logout

    const encryptionKey = level === "2" ? this.vaultKey : this.userKey;

    if (!encryptionKey) {
      alert("Error: La llave de nivel " + level + " no está en memoria.");
      return;
    }

    const encryptedContent = await CryptoManager.encrypt(
      plainText,
      encryptionKey
    ); //

    await addDoc(collection(db, "secrets"), {
      uid: this.user.uid,
      title: title,
      content: encryptedContent,
      level: level,
      createdAt: serverTimestamp(), // Usamos el tiempo del servidor para consistencia
    });
  }

  render() {
    const section = document.createElement("section");
    section.className =
      "max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md";
    section.innerHTML = `
            <h3 class="text-lg font-bold mb-4">Nueva Gestión Encriptada</h3>
            <input id="secret-title" type="text" placeholder="Título" class="w-full mb-3 p-2 border rounded">
            <textarea id="secret-content" placeholder="Contenido sensible..." class="w-full p-2 border rounded h-32"></textarea>
            <button id="save-btn" class="mt-3 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Guardar con E2EE
            </button>
        `;

    section.querySelector("#save-btn").addEventListener("click", async () => {
      const title = section.querySelector("#secret-title").value;
      const content = section.querySelector("#secret-content").value;
      await this.saveSecret(title, content);
      alert("¡Guardado de forma segura!");
    });

    return section;
  }
}
