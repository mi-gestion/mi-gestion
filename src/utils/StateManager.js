// src/utils/StateManager.js

export class StateManager {
  constructor(initialState = {}) {
    // Creamos una copia profunda para romper referencias
    this.state = structuredClone(initialState);
    this.listeners = [];
  }

  /**
   * Obtiene el estado actual completo
   */
  get() {
    return this.state;
  }

  /**
   * Obtiene un valor específico usando notación de punto (ej: "items.0.precio")
   */
  getValue(path) {
    return path
      .split(".")
      .reduce(
        (obj, key) => (obj && obj[key] !== "undefined" ? obj[key] : undefined),
        this.state
      );
  }

  /**
   * Actualiza una propiedad específica y notifica a los suscriptores
   * @param {string} path - Ruta de la propiedad (ej: "usuario.nombre" o "id_campo")
   * @param {any} value - Nuevo valor
   */
  update(path, value) {
    const keys = path.split(".");
    let current = this.state;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    this.notify(path, value);
  }

  /**
   * Suscribe una función para recibir notificaciones de cambios
   */
  subscribe(callback) {
    this.listeners.push(callback);
    // Retorna función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  notify(path, value) {
    this.listeners.forEach((cb) => cb(this.state, path, value));
  }
}
