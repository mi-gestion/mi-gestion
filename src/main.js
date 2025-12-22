import "./style.css";
import { auth, authService } from "./services/firebase.js"; // Importamos 'auth' y el servicio
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { CryptoManager } from "./utils/crypto.js";
import { AuthView } from "./components/AuthView.js";
import { Navbar } from "./components/Navbar.js";

let userKey = null; // Llave en memoria volátil

const app = document.getElementById("app");

function showDashboard() {
  app.innerHTML = "";
  const nav = new Navbar("Usuario Demo", () => showLogin());
  app.appendChild(nav.render());

  const welcome = document.createElement("main");
  welcome.className = "p-8";
  welcome.innerHTML = `<h1 class="text-2xl font-bold">Bienvenido al sistema</h1>`;
  app.appendChild(welcome);
}

function showLogin() {
  const app = document.getElementById("app");
  app.innerHTML = "";
  const authView = new AuthView(handleAuth); // Pasamos la función handleAuth
  app.appendChild(authView.render());
}

async function handleAuth(email, password, isLogin) {
  try {
    if (isLogin) {
      await authService.login(email, password);
    } else {
      await authService.register(email, password);
    }

    // DERIVACIÓN DE LLAVE: Paso crítico para E2EE
    // Usamos el email como "salt" para que la llave sea única por usuario
    userKey = await CryptoManager.deriveKey(password, email);

    console.log("Autenticación exitosa y llave generada");
    showDashboard();
  } catch (error) {
    alert("Error: " + error.message);
    showLogin(); // Recargar para limpiar estado
  }
}

async function handleLogin(email, password) {
  try {
    await authService.login(email, password);
    // Derivamos la llave inmediatamente tras el login
    // El 'salt' idealmente debería ser único por usuario y público
    userKey = await CryptoManager.deriveKey(password, email);
    showDashboard();
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function handleRegister(email, password) {
  try {
    await authService.register(email, password);
    userKey = await CryptoManager.deriveKey(password, email);
    showDashboard();
  } catch (error) {
    alert("Error en registro: " + error.message);
  }
}

// Iniciar la app
showLogin();

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Sesión activa detectada:", user.email);
  } else {
    console.log("No hay sesión activa. Esperando registro/login.");
  }
});
