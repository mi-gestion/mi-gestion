import { BaseInput } from "./BaseInput.js";

export class PasswordElement extends BaseInput {
  constructor() {
    super("password", "🔑", "Sensible");
  }

  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs bg-gray-50 pr-6"
        : "w-full p-2 border rounded bg-gray-50 border-gray-300 pr-10";

    const randomName = "safe_field_" + Math.random().toString(36).substring(7);

    const inputHtml = `
        <div class="relative">
            <input type="password" 
                class="${cls}" 
                value="${v}" 
                autocomplete="new-password" 
                name="${randomName}"
                id="${randomName}"
                readonly 
                onfocus="this.removeAttribute('readonly');"
            >
            <button type="button" class="toggle-pass-btn absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 focus:outline-none transition z-10" tabindex="-1">
                👁️
            </button>
        </div>
    `;

    return this.renderInContext(c, inputHtml, ctx);
  }

  attachListeners(container) {
    const btn = container.querySelector(".toggle-pass-btn");
    const input = container.querySelector("input");

    if (btn && input) {
      btn.onclick = (e) => {
        e.preventDefault();
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        btn.innerHTML = isPassword ? "👁️‍🗨️" : "👁️";
      };
    }
  }

  renderPrint(c, v, ctx) {
    return ctx === "table"
      ? "***"
      : `<div><strong>${c.label}:</strong> ***</div>`;
  }
}
