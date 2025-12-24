import "./style.css";
import { auth, authService, db } from "./services/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  deleteDoc,
  query,
  orderBy,
  getDocs,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { CryptoManager } from "./utils/crypto.js";
import { AuthView } from "./components/AuthView.js";
import { Navbar } from "./components/Navbar.js";
import { TemplateEditor } from "./components/TemplateEditor.js";
// NUEVOS COMPONENTES
import { EditManager } from "./components/EditManager.js";
import { ViewManager } from "./components/ViewManager.js";

// --- ESTADO GLOBAL ---
let currentUser = null;
let userKey = null;
let vaultKey = null;
let allSecrets = [];
let allTemplates = [];

let appMode = "documents";
let searchTerm = "";
let currentCategory = "all";

const app = document.getElementById("app");

const CATEGORIES = [
  { id: "all", label: "Todo", icon: "📂" },
  { id: "personal", label: "Personal", icon: "👤" },
  { id: "finance", label: "Finanzas", icon: "💰" },
  { id: "health", label: "Salud", icon: "🏥" },
  { id: "legal", label: "Legal", icon: "⚖️" },
  { id: "work", label: "Trabajo", icon: "💼" },
];

// --- LOGGING Y TIEMPOS ---
export async function checkAndRecordServerActivity(
  action = "Interacción",
  details = ""
) {
  if (!currentUser) return false;
  const userRef = doc(db, "user_metadata", currentUser.uid);
  const userDoc = await getDoc(userRef);
  const now = Date.now();

  if (userDoc.exists()) {
    const lastActivity = userDoc.data().lastActivity?.toMillis() || now;
    const diffMin = (now - lastActivity) / 1000 / 60;

    if (diffMin >= 300) {
      await logActivity("Sesión Expirada", "> 300min");
      authService.logout();
      return false;
    }
    if (diffMin >= 100 && vaultKey) {
      vaultKey = null;
      await logActivity("Bóveda Bloqueada", "> 100min");
      renderDashboard(); // Refrescar UI para mostrar bóveda cerrada
      return true;
    }
  }
  await updateDoc(userRef, { lastActivity: serverTimestamp() });
  return true;
}

async function logActivity(action, details) {
  if (!currentUser) return;
  try {
    await addDoc(
      collection(db, "user_metadata", currentUser.uid, "activity_logs"),
      {
        action,
        details,
        timestamp: serverTimestamp(),
      }
    );
  } catch (e) {
    console.error(e);
  }
}

// --- GESTIÓN DE DATOS ---

async function fetchData() {
  if (!currentUser) return;
  console.log(
    "📡 [Firebase] Cargando documentos y plantillas para:",
    currentUser.email
  );
  try {
    // 1. Cargar Documentos (Secrets)
    const qSecrets = query(
      collection(db, "secrets"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const snapSecrets = await getDocs(qSecrets);
    allSecrets = snapSecrets.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 2. Cargar Plantillas
    const qTemplates = query(
      collection(db, "templates"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );
    const snapTemplates = await getDocs(qTemplates);
    allTemplates = snapTemplates.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(
      `✅ [Data] Carga completa: ${allSecrets.length} documentos, ${allTemplates.length} plantillas.`
    );
    renderDashboard();
  } catch (error) {
    console.error("Error cargando datos:", error);
    if (error.code === "failed-precondition") {
      alert(
        "Falta crear un índice en Firebase. Revisa la consola (F12) para el enlace."
      );
    }
  }
}

async function deleteItem(collectionName, id) {
  if (!confirm("¿Borrar elemento permanentemente?")) return;
  if (
    await checkAndRecordServerActivity("Eliminar", `${collectionName}/${id}`)
  ) {
    await deleteDoc(doc(db, collectionName, id));
    fetchData();
  }
}

// --- RENDERIZADO PRINCIPAL (DASHBOARD) ---

function renderDashboard() {
  app.innerHTML = "";
  const isDocsMode = appMode === "documents";
  const viewTitle = isDocsMode ? "Mis Documentos" : "Galería de Plantillas";

  const nav = new Navbar(
    currentUser.email,
    viewTitle,
    !!vaultKey,
    () => authService.logout(),
    () => handleVaultToggle(),
    (text) => {
      searchTerm = text;
      renderDashboard();
    },
    () => {
      appMode = "documents";
      currentCategory = "all";
      renderDashboard();
    }
  );
  app.appendChild(nav.render());

  const container = document.createElement("main");
  container.className = "max-w-7xl mx-auto p-6";

  // Filtros
  const filterBar = document.createElement("div");
  filterBar.className = "flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide";
  filterBar.innerHTML = CATEGORIES.map(
    (cat) => `
        <button class="px-4 py-2 rounded-full text-sm font-bold transition whitespace-nowrap flex items-center gap-2
            ${
              currentCategory === cat.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
            }"
            onclick="window.setCategory('${cat.id}')">
            <span>${cat.icon}</span> ${cat.label}
        </button>
    `
  ).join("");
  container.appendChild(filterBar);

  // Exponer setCategory al scope global para el onclick string
  window.setCategory = (id) => {
    currentCategory = id;
    renderDashboard();
  };

  // Grilla
  const grid = document.createElement("div");
  grid.className =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";

  if (isDocsMode) {
    // MODO DOCUMENTOS
    grid.appendChild(
      createActionCard("+", "Nuevo Documento", "blue", () => {
        appMode = "templates";
        currentCategory = "all";
        searchTerm = "";
        renderDashboard();
      })
    );

    const docsToShow = allSecrets.filter((doc) => {
      if (currentCategory !== "all") {
        const tmpl = allTemplates.find((t) => t.id === doc.templateId);
        const docCat = tmpl ? tmpl.category : "personal";
        if (docCat !== currentCategory) return false;
      }
      if (
        searchTerm &&
        doc.title &&
        !doc.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
    docsToShow.forEach((doc) => renderDocumentCard(doc, grid));
  } else {
    // MODO PLANTILLAS
    grid.appendChild(
      createActionCard("✨", "Diseñar Plantilla", "indigo", () =>
        renderTemplateEditor()
      )
    );

    const tmplsToShow = allTemplates.filter((t) => {
      if (
        currentCategory !== "all" &&
        (t.category || "personal") !== currentCategory
      )
        return false;
      if (
        searchTerm &&
        !t.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    });
    tmplsToShow.forEach((tmpl) => renderTemplateCard(tmpl, grid));
  }

  container.appendChild(grid);
  app.appendChild(container);
}

// --- UI COMPONENTS ---

function createActionCard(icon, text, color, action) {
  const card = document.createElement("div");
  card.className = `h-56 border-2 border-dashed border-${color}-300 bg-${color}-50/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-${color}-50 transition group`;
  card.innerHTML = `
        <div class="w-14 h-14 bg-${color}-100 rounded-full flex items-center justify-center group-hover:scale-110 transition text-${color}-600 text-3xl mb-3 font-bold">${icon}</div>
        <span class="font-bold text-${color}-600">${text}</span>
    `;
  card.onclick = action;
  return card;
}

function renderDocumentCard(secret, container) {
  const template = allTemplates.find((t) => t.id === secret.templateId) || {
    icon: "📄",
    category: "personal",
    name: "Desconocida",
  };
  const isLocked = secret.level === "2" && !vaultKey;
  let title = secret.title || "Sin título";
  if (isLocked) title = "🔒 Protegido";

  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between h-56 border border-gray-100 relative group";
  card.innerHTML = `
        <div class="flex justify-between items-start">
            <span class="text-3xl">${template.icon}</span>
            <div class="flex gap-2">
                <span class="px-2 py-0.5 text-[10px] font-bold rounded ${
                  secret.level === "2"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-green-100 text-green-700"
                }">
                    ${secret.level === "2" ? "Nivel 2" : "Nivel 1"}
                </span>
                <button onclick="event.stopPropagation(); window.delItem('secrets', '${
                  secret.id
                }')" class="text-gray-300 hover:text-red-500">🗑️</button>
            </div>
        </div>
        <div class="mt-4 flex-1">
            <h3 class="font-bold text-gray-800 text-lg leading-tight line-clamp-3 ${
              isLocked ? "blur-sm select-none" : ""
            }">${title}</h3>
            <p class="text-xs text-gray-400 mt-2">${new Date(
              secret.createdAt?.toMillis()
            ).toLocaleDateString()}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-50">
             <button class="w-full text-sm font-medium ${
               isLocked ? "text-gray-400" : "text-blue-600 hover:text-blue-700"
             } flex items-center justify-center gap-2">
                ${isLocked ? "🔐 Abrir Bóveda" : "👁️ Ver Documento"}
            </button>
        </div>
    `;

  // ACCIÓN DE LA TARJETA
  card.onclick = () => {
    if (isLocked) handleVaultToggle();
    else renderViewer(secret, template); // <--- AHORA VA AL VISOR
  };
  container.appendChild(card);
}

function renderTemplateCard(template, container) {
  const card = document.createElement("div");
  card.className =
    "bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col h-56 hover:shadow-md transition relative group cursor-pointer hover:border-blue-300";

  card.innerHTML = `
        <div class="flex justify-between items-start">
            <span class="text-4xl mb-3">${template.icon || "📄"}</span>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button onclick="event.stopPropagation(); window.editTmpl('${
                  template.id
                }')" 
                    class="p-1.5 bg-gray-100 hover:bg-blue-100 text-blue-600 rounded" title="Editar Plantilla">
                    ⚙️
                </button>
                <button onclick="event.stopPropagation(); window.delItem('templates', '${
                  template.id
                }')" 
                    class="p-1.5 bg-gray-100 hover:bg-red-100 text-red-600 rounded" title="Borrar Plantilla">
                    🗑️
                </button>
            </div>
        </div>
        <h3 class="font-bold text-gray-800 text-lg mb-1 line-clamp-1">${
          template.name
        }</h3>
        <span class="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wide">
            ${
              CATEGORIES.find((c) => c.id === template.category)?.label ||
              "General"
            }
        </span>
        
        <button class="mt-auto w-full py-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold rounded-lg transition text-sm">
            Usar esta plantilla
        </button>
    `;

  // Acción principal: Crear NUEVO documento usando esta plantilla
  card.onclick = () => renderEditor(null, template);

  container.appendChild(card);
}

// Helpers globales para onclicks en strings HTML
window.editTmpl = (id) => {
  const tmpl = allTemplates.find((t) => t.id === id);
  if (tmpl) renderTemplateEditor(tmpl);
};
window.delItem = (col, id) => deleteItem(col, id);

// --- NAVEGACIÓN Y VISTAS (VIEWER / EDITOR / TEMPLATE) ---

// 1. VISOR DE DOCUMENTO (NUEVO)
function renderViewer(documentData, templateData) {
  app.innerHTML = "";

  const handleEditRequest = () => {
    renderEditor(documentData, templateData);
  };

  const vm = new ViewManager(
    documentData,
    templateData,
    userKey,
    vaultKey,
    handleEditRequest, // onEdit
    () => {
      // onClose
      appMode = "documents";
      renderDashboard();
    }
  );
  app.appendChild(vm.render());
}

// 2. EDITOR DE DOCUMENTO (AHORA USA EditManager)
function renderEditor(documentData, templateData) {
  const reportActivity = () => {
    if (currentUser) {
      const userRef = doc(db, "user_metadata", currentUser.uid);
      updateDoc(userRef, { lastActivity: serverTimestamp() }).catch(
        console.error
      );
    }
  };

  app.innerHTML = "";

  const em = new EditManager(
    currentUser,
    userKey,
    vaultKey,
    reportActivity,
    () => {
      // onSaveSuccess
      appMode = "documents";
      fetchData(); // Recargar y volver al dashboard
    },
    () => {
      // onCancel
      if (documentData) {
        // Si estábamos editando, volver al visor
        renderViewer(documentData, templateData);
      } else {
        // Si era nuevo, volver al dashboard
        appMode = "documents";
        renderDashboard();
      }
    }
  );

  em.currentTemplate = templateData;
  em.existingSecret = documentData;

  app.appendChild(em.render());
}

// 3. EDITOR DE PLANTILLA
function renderTemplateEditor(existingTemplate = null) {
  const reportActivity = () => {
    if (currentUser) {
      const userRef = doc(db, "user_metadata", currentUser.uid);
      updateDoc(userRef, { lastActivity: serverTimestamp() }).catch(
        console.error
      );
    }
  };

  const editor = new TemplateEditor(
    CATEGORIES,
    // Callback Guardar
    async (data) => {
      try {
        const actionName = existingTemplate
          ? "Editar Plantilla"
          : "Crear Plantilla";
        if (await checkAndRecordServerActivity(actionName, data.name)) {
          const payload = {
            uid: currentUser.uid,
            name: data.name,
            category: data.category,
            icon: data.icon,
            color: data.color,
            elements: data.elements,
            updatedAt: serverTimestamp(),
          };

          if (existingTemplate) {
            await updateDoc(doc(db, "templates", existingTemplate.id), payload);
            alert("Plantilla actualizada correctamente");
          } else {
            payload.createdAt = serverTimestamp();
            await addDoc(collection(db, "templates"), payload);
            alert("Plantilla creada correctamente");
          }
          fetchData();
        }
      } catch (e) {
        console.error(e);
        alert("Error al guardar: " + e.message);
      }
    },
    // Callback Cancelar
    () => {},
    reportActivity,
    existingTemplate
  );

  app.appendChild(editor.render());
}

// --- AUTH & VAULT LOGIC ---

async function handleVaultToggle() {
  if (vaultKey) {
    vaultKey = null;
    await logActivity("Cierre Manual", "Usuario cerró bóveda");
    renderDashboard();
  } else {
    const phrase = prompt("🔐 INGRESO A BÓVEDA\nIntroduce tu frase maestra:");
    if (phrase) await handleSetupVault(phrase);
  }
}

async function handleSetupVault(phrase) {
  console.log("🔓 [Vault] Intentando abrir la bóveda con frase maestra...");
  try {
    const tempKey = await CryptoManager.deriveKey(
      phrase,
      "vault-salt-unique-v1"
    );
    const userRef = doc(db, "user_metadata", currentUser.uid);
    const userData = (await getDoc(userRef)).data();

    if (!userData || !userData.vaultTest) {
      const test = await CryptoManager.encrypt("VAULT_VERIFIED", tempKey);
      await updateDoc(userRef, {
        vaultTest: test,
        lastActivity: serverTimestamp(),
      });
      vaultKey = tempKey;
      alert("¡Bóveda configurada!");
    } else {
      const dec = await CryptoManager.decrypt(userData.vaultTest, tempKey);
      if (dec === "VAULT_VERIFIED") {
        vaultKey = tempKey;
        await checkAndRecordServerActivity(
          "Bóveda Abierta",
          "Acceso concedido"
        );
      }
    }
    console.log("✅ [Vault] Bóveda abierta.");
    renderDashboard();
  } catch (e) {
    console.error("❌ [Vault] Frase incorrecta.");
    alert("⛔ Frase incorrecta.");
  }
}

async function handleAuth(email, password, isLogin) {
  console.log(
    `🚀 [Auth] Intento de ${isLogin ? "Login" : "Registro"} para:`,
    email
  );
  try {
    const res = isLogin
      ? await authService.login(email, password)
      : await authService.register(email, password);

    console.log("✅ [Auth] Autenticación de Firebase exitosa.");

    // Generamos la llave maestra en memoria
    userKey = await CryptoManager.deriveKey(password, email);

    await setDoc(
      doc(db, "user_metadata", res.user.uid),
      { lastActivity: serverTimestamp() },
      { merge: true }
    );
    fetchData();
  } catch (e) {
    console.error("❌ [Auth] Error:", e.message);
    alert(e.message);
  }
}

// --- DETECTOR DE ESTADO (CORREGIDO PARA E2EE) ---
onAuthStateChanged(auth, (user) => {
  currentUser = user;

  // CASO 1: Usuario detectado y Llave presente (Login normal)
  if (user && userKey) {
    fetchData();
    return;
  }

  // CASO 2: Usuario detectado pero FALTA la llave (Recarga de página F5)
  if (user && !userKey) {
    console.warn(
      "🔒 [Security] Sesión sin llave de cifrado. Requerida autenticación."
    );
    app.innerHTML = "";
    // Forzamos la vista de Login para regenerar la llave
    app.appendChild(new AuthView(handleAuth).render());
    return;
  }

  // CASO 3: No hay usuario (Logout o inicio limpio)
  app.innerHTML = "";
  app.appendChild(new AuthView(handleAuth).render());
});
