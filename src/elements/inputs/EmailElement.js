import { BaseInput } from "./BaseInput.js";

export class EmailElement extends BaseInput {
  constructor() {
    super("email", "@", "Email");
  }
  renderEditor(c, v = "", ctx = "form") {
    return this.renderInContext(
      c,
      `<input type="email" class="w-full p-2 border rounded" value="${v}" placeholder="${
        c.placeholder || ""
      }">`,
      ctx
    );
  }
}
