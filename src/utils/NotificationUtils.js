export class NotificationUtils {
  /**
   * Muestra una notificación flotante
   * @param {string} message - El texto a mostrar
   * @param {'success'|'error'|'warning'|'info'} type - El tipo de alerta
   * @param {number} duration - Duración en ms (default 3000)
   */
  static show(message, type = "success", duration = 3000) {
    // 1. Definir estilos según el tipo
    const styles = {
      success: {
        bg: "bg-slate-800", // Fondo oscuro elegante
        text: "text-white",
        icon: "✅",
      },
      error: {
        bg: "bg-red-600",
        text: "text-white",
        icon: "⚠️",
      },
      warning: {
        bg: "bg-amber-500",
        text: "text-white",
        icon: "🔸",
      },
      info: {
        bg: "bg-blue-600",
        text: "text-white",
        icon: "ℹ️",
      },
    };

    const style = styles[type] || styles.success;

    // 2. Crear contenedor si no existe (para apilar notificaciones)
    let container = document.getElementById("notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "notification-container";
      // Posición fija abajo-centro (ideal para móvil y desktop)
      container.className =
        "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 items-center pointer-events-none";
      document.body.appendChild(container);
    }

    // 3. Crear el elemento Toast
    const toast = document.createElement("div");
    toast.className = `
            ${style.bg} ${style.text} 
            px-6 py-3 rounded-full shadow-2xl 
            flex items-center gap-3 
            transform transition-all duration-300 ease-out translate-y-10 opacity-0
            font-medium text-sm pointer-events-auto
        `;
    toast.innerHTML = `<span>${style.icon}</span> <span>${message}</span>`;

    // 4. Añadir al DOM
    container.appendChild(toast);

    // 5. Animar Entrada (pequeño delay para que el navegador renderice la clase inicial)
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-10", "opacity-0");
    });

    // 6. Programar Salida
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-4"); // Desvanecer hacia abajo

      // Eliminar del DOM tras la animación CSS
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 300); // Coincide con duration-300
    }, duration);
  }
}
