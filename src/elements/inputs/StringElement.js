import { BaseInput } from "./BaseInput.js";

export class StringElement extends BaseInput {
  constructor() {
    super("string", "Abc", "Texto Corto");
  }
  renderEditor(c, v = "", ctx = "form") {
    const cls =
      ctx === "table"
        ? "w-full p-1 border rounded text-xs"
        : "w-full p-2 border rounded transition focus:ring-2 focus:ring-blue-100 outline-none border-gray-300";
    return this.renderInContext(
      c,
      `<input type="text" class="${cls}" value="${v}" placeholder="${
        c.placeholder || ""
      }">`,
      ctx
    );
  }
}
