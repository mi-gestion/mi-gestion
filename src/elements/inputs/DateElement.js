import { BaseInput } from "./BaseInput.js";

export class DateElement extends BaseInput {
  constructor() {
    super("date", "📅", "Fecha");
  }
  renderEditor(c, v = "", ctx = "form") {
    return this.renderInContext(
      c,
      `<input type="date" class="w-full p-2 border rounded" value="${v}">`,
      ctx
    );
  }
  renderPrint(c, v, ctx) {
    return `<div><strong>${c.label}:</strong> ${v}</div>`;
  }
  renderWhatsapp(c, v) {
    const val = v || "---";
    return `*${c.label}:* _${val}_\n`; // Cursiva para fechas
  }
}
