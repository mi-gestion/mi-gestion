import {
  SectionElement,
  TitleElement,
  SubtitleElement,
  ParagraphElement,
  ListElement,
  EnumListElement,
} from "./StructuralElements.js";
import {
  StringElement,
  TextElement,
  PasswordElement,
  NumberElement,
  CurrencyElement,
  PercentageElement,
  BooleanElement,
  SelectElement,
  DateElement,
  EmailElement,
  UrlElement,
} from "./InputElements.js";
import { TableElement } from "./ComplexElements.js";

class Registry {
  constructor() {
    this.elements = {};
    this.categories = {
      structure: { label: "Estructura", items: [] },
      input: { label: "Campos de Datos", items: [] },
      complex: { label: "Avanzado", items: [] },
    };
  }

  register(ClassRef) {
    const instance = new ClassRef();
    this.elements[instance.type] = instance;
    if (this.categories[instance.category]) {
      this.categories[instance.category].items.push(instance);
    }
  }

  get(type) {
    return this.elements[type];
  }
  getGrouped() {
    return this.categories;
  }
}

export const ElementRegistry = new Registry();

// REGISTRO DE TODOS LOS ELEMENTOS
const allElements = [
  // Estructura
  TitleElement,
  SubtitleElement,
  SectionElement,
  ParagraphElement,
  ListElement,
  EnumListElement,
  // Inputs
  StringElement,
  TextElement,
  PasswordElement,
  NumberElement,
  CurrencyElement,
  PercentageElement,
  BooleanElement,
  SelectElement,
  DateElement,
  EmailElement,
  UrlElement,
  // Complejos
  TableElement,
];

allElements.forEach((El) => ElementRegistry.register(El));
