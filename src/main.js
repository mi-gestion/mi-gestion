import "./style.css";
import { auth, authService } from "./services/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { CryptoManager } from "./utils/crypto.js";
import { AuthView } from "./components/AuthView.js";
import { Navbar } from "./components/Navbar.js";
import { ProfileView } from "./components/ProfileView.js";
import {
  collection,
  doc,
  updateDoc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { db } from "./services/firebase.js";

// --- ESTADO GLOBAL DE LA APLICACIÓN (En Memoria Volátil) ---
let currentUser = null;
let userKey = null; // Nivel 1: Seguridad Intermedia (Login)
let vaultKey = null; // Nivel 2: Seguridad Máxima (Bóveda)

const app = document.getElementById("app");

async function checkAndRecordServerActivity() {
  if (!currentUser) return false;

  const userRef = doc(db, "user_metadata", currentUser.uid);
  const userDoc = await getDoc(userRef);
  const now = Date.now();

  if (userDoc.exists()) {
    const lastActivity = userDoc.data().lastActivity?.toMillis() || 0;
    const diffMinutes = (now - lastActivity) / 1000 / 60;

    // Regla 1: Si pasaron más de 3 minutos, cerrar todo (Bóveda y Puerta)
    if (diffMinutes >= 3) {
      vaultKey = null;
      userKey = null;
      await authService.logout();
      alert("Sesión cerrada por inactividad prolongada (servidor).");
      return false;
    }

    // Regla 2: Si pasaron más de 1 minuto, cerrar solo la Bóveda
    if (diffMinutes >= 1 && vaultKey) {
      vaultKey = null;
      alert(
        "La bóveda se ha bloqueado por inactividad. Reingrese su frase en Perfil."
      );
      renderDashboard();
    }
  }

  // Actualizamos la marca de tiempo en el servidor para la siguiente interacción
  await updateDoc(userRef, { lastActivity: serverTimestamp() });
  return true;
}

/**
 * Lógica de Autenticación Principal (Nivel 1)
 */
async function handleAuth(email, password, isLogin) {
  try {
    const userCredential = isLogin
      ? await authService.login(email, password)
      : await authService.register(email, password);

    // Generamos la llave de Nivel 1 inmediatamente usando la clave de login
    // Usamos el email como 'salt' para que sea única por usuario
    userKey = await CryptoManager.deriveKey(password, email);
    console.log("Llave de Seguridad Intermedia generada.");
  } catch (error) {
    console.error("Error de Auth:", error.code);
    alert("Error: " + error.message);
  }
}

/**
 * Lógica para la Llave Maestra (Nivel 2)
 * Esta llave no se guarda en ningún sitio, solo vive en memoria.
 */
async function handleSetupVault(masterPhrase) {
  try {
    // Usamos un salt diferente y fijo para la bóveda para que sea
    // una llave distinta a la de login
    vaultKey = await CryptoManager.deriveKey(
      masterPhrase,
      "vault-security-layer-salt"
    );
    console.log("Llave de Seguridad Máxima (Bóveda) generada.");

    // Refrescamos la vista de perfil para mostrar el estado activo
    renderProfile();
  } catch (error) {
    alert("Error al generar la llave de la bóveda.");
  }
}

/**
 * Observador de Firebase para detectar cambios de sesión
 */
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    renderDashboard();
  } else {
    userKey = null;
    vaultKey = null;
    renderLogin();
  }
});

// --- FUNCIONES DE NAVEGACIÓN Y RENDERIZADO ---

function renderLogin() {
  app.innerHTML = "";
  const authView = new AuthView(handleAuth);
  app.appendChild(authView.render());
}

function renderDashboard() {
  app.innerHTML = "";

  // Inyectamos la Navbar siempre que estemos logueados
  const nav = new Navbar(
    currentUser.email,
    () => authService.logout(), // Acción Logout
    () => renderProfile() // Acción ir a Perfil
  );
  app.appendChild(nav.render());

  const main = document.createElement("main");
  main.className = "p-8 max-w-4xl mx-auto";
  main.innerHTML = `
        <h1 class="text-3xl font-bold text-gray-800">Panel de Gestión</h1>
        <p class="text-gray-600 mt-2">Bienvenido al sistema de archivos seguros.</p>
        
        <div class="mt-8 p-6 bg-white border rounded-2xl shadow-sm">
            <h2 class="font-bold mb-4">Estado de Seguridad</h2>
            <div class="flex gap-4">
                <span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Nivel 1: ACTIVO</span>
                ${
                  vaultKey
                    ? '<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Nivel 2: BÓVEDA ABIERTA</span>'
                    : '<span class="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">Nivel 2: BLOQUEADO</span>'
                }
            </div>
        </div>
    `;
  app.appendChild(main);
}

function renderProfile() {
  // Limpiamos contenido debajo de la Navbar
  app.innerHTML = "";

  // Re-render Navbar para mantener navegación
  const nav = new Navbar(
    currentUser.email,
    () => authService.logout(),
    () => renderProfile()
  );
  app.appendChild(nav.render());

  // Renderizamos la vista de Perfil
  const profile = new ProfileView(currentUser, vaultKey, (phrase) =>
    handleSetupVault(phrase)
  );
  app.appendChild(profile.render());

  // Botón para volver al Dashboard
  const backBtn = document.createElement("button");
  backBtn.className =
    "mt-4 ml-8 text-blue-600 hover:underline flex items-center gap-2";
  backBtn.innerHTML = "← Volver al Panel";
  backBtn.onclick = () => renderDashboard();
  app.appendChild(backBtn);
}

async function logActivity(action, details = "") {
  if (!currentUser) return;
  const logsRef = collection(
    db,
    "user_metadata",
    currentUser.uid,
    "activity_logs"
  );
  await addDoc(logsRef, {
    action: action,
    details: details,
    timestamp: serverTimestamp(),
  });
}
