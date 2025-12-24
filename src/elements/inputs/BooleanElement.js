import { BaseInput } from "./BaseInput.js";

export class BooleanElement extends BaseInput {
  constructor() {
    super("boolean", "☑️", "Si/No");
  }
  renderEditor(c, v, ctx = "form") {
    return this.renderInContext(
      c,
      `<select class="w-full p-2 border rounded"><option>No</option><option>Si</option></select>`,
      ctx
    );
  }
}
