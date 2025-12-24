import { ElementRegistry } from "../elements/ElementRegistry.js";

export class PrintManager {
  /**
   * Genera la ventana de impresión
   * @param {string} title - Título del documento
   * @param {object} template - Objeto de la plantilla
   * @param {object} values - Objeto con los valores descifrados { id: valor }
   * @param {string} mode - 'normal', 'compact', 'easy'
   */
  static print(title, template, values, mode) {
    const date = new Date().toLocaleDateString();
    let contentHtml = '<div class="print-grid">'; // Usamos el grid definido anteriormente

    if (template && template.elements) {
      template.elements.forEach((el) => {
        const strategy = ElementRegistry.get(el.type);
        const val = values[el.id];
        const span = el.colSpanPrint || 8; // Default 8 columnas para impresión

        if (strategy) {
          const renderedEl = strategy.renderPrint(el, val, mode);
          contentHtml += `<div class="print-col-span-${span}">${renderedEl}</div>`;
        }
      });
    }
    contentHtml += "</div>";

    const styles = this.getPrintStyles(mode);

    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      return alert("Permite las ventanas emergentes para imprimir.");
    }

    printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir: ${title}</title>
                <style>
                    body { font-family: sans-serif; margin: 0; padding: 20px; color: #1a202c; }
                    h1 { margin-bottom: 5px; }
                    .meta { color: #718096; font-size: 12px; margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; pb: 10px; }
                    table { border-collapse: collapse; width: 100%; }
                    
                    ${styles}
                    
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .text-xs { font-size: 0.75rem; }
                    .text-sm { font-size: 0.875rem; }
                    .border { border: 1px solid #e2e8f0; }
                    .p-2 { padding: 0.5rem; }
                    .font-mono { font-family: monospace; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">
                    Plantilla: ${template.name} • Impreso: ${date}
                </div>
                <div class="content">
                    ${contentHtml}
                </div>
                <script>
                    window.onload = function() { window.print(); };
                </script>
            </body>
            </html>
        `);
    printWindow.document.close();
  }

  static getPrintStyles(mode) {
    const gridCSS = `
        .print-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 15px; }
        .print-col-span-1 { grid-column: span 1; }
        .print-col-span-2 { grid-column: span 2; }
        .print-col-span-3 { grid-column: span 3; }
        .print-col-span-4 { grid-column: span 4; }
        .print-col-span-5 { grid-column: span 5; }
        .print-col-span-6 { grid-column: span 6; }
        .print-col-span-7 { grid-column: span 7; }
        .print-col-span-8 { grid-column: span 8; }
    `;

    if (mode === "compact") {
      return `
                body { font-size: 11px; padding: 10px; }
                ${gridCSS}
                h1 { font-size: 18px; grid-column: span 8; }
                h2, h3 { font-size: 14px; margin-top: 10px; }
                p { margin-bottom: 5px; }
            `;
    } else if (mode === "easy") {
      return `
                body { font-size: 18px; line-height: 1.6; max-width: 800px; margin: 0 auto; }
                h1 { font-size: 32px; text-align: center; border-bottom: 3px solid black; padding-bottom: 10px; }
                .print-grid { display: block; } /* En lectura fácil quitamos el grid */
                .print-grid > div { margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px dashed #cbd5e0; }
            `;
    } else {
      // NORMAL
      return `
                body { font-size: 14px; line-height: 1.5; max-width: 900px; margin: 0 auto; }
                ${gridCSS}
                h1 { font-size: 24px; color: #2b6cb0; grid-column: span 8; }
                h2, h3 { grid-column: span 8; }
            `;
    }
  }
}
