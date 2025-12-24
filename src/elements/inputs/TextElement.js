import { BaseInput } from "./BaseInput.js";

export class TextElement extends BaseInput {
  constructor() {
    super("text", "¶¶", "Texto Largo");
  }
  renderEditor(c, v = "", ctx = "form") {
    if (ctx === "table")
      return `<input type="text" class="w-full p-1 border rounded text-xs" value="${v}" title="${v}">`;
    return this.renderInContext(
      c,
      `<textarea class="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-100 outline-none border-gray-300" placeholder="${
        c.placeholder || ""
      }">${v}</textarea>`,
      ctx
    );
  }
}
