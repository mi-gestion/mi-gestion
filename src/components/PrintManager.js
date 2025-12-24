import { ElementRegistry } from "../elements/ElementRegistry.js";

export class PrintManager {
  /**
   * Genera la impresión usando un iframe oculto
   */
  static print(title, template, values, mode) {
    const date = new Date().toLocaleDateString();
    let contentHtml = '<div class="print-grid">';

    if (template && template.elements) {
      template.elements.forEach((el) => {
        const strategy = ElementRegistry.get(el.type);
        const val = values[el.id];
        const span = el.colSpanPrint || 8;

        if (strategy) {
          // Renderizamos el valor
          const renderedEl = strategy.renderPrint(el, val, mode);
          // Envolvemos en un contenedor con clase para aplicar estilos de borde/padding según el modo
          contentHtml += `<div class="print-col-span-${span} field-container">${renderedEl}</div>`;
        }
      });
    }
    contentHtml += "</div>";

    const styles = this.getPrintStyles(mode);

    // 1. Crear iframe
    const iframe = document.createElement("iframe");

    // 2. Ocultarlo
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    iframe.style.visibility = "hidden";

    // 3. Añadir al documento
    document.body.appendChild(iframe);

    // 4. Escribir contenido
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir: ${title}</title>
                <style>
                    /* Reset básico */
                    * { box-sizing: border-box; }
                    body { font-family: sans-serif; color: #1a202c; background: white; }
                    h1 { margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #333; }
                    .meta { color: #666; font-size: 0.8em; margin-bottom: 20px; border-bottom: 1px solid #eee; pb: 5px; }
                    table { border-collapse: collapse; width: 100%; }
                    
                    /* Clases de Grid (Comunes para todos, el gap cambia según el modo) */
                    .print-grid { display: grid; grid-template-columns: repeat(8, 1fr); }
                    .print-col-span-1 { grid-column: span 1; }
                    .print-col-span-2 { grid-column: span 2; }
                    .print-col-span-3 { grid-column: span 3; }
                    .print-col-span-4 { grid-column: span 4; }
                    .print-col-span-5 { grid-column: span 5; }
                    .print-col-span-6 { grid-column: span 6; }
                    .print-col-span-7 { grid-column: span 7; }
                    .print-col-span-8 { grid-column: span 8; }

                    /* Estilos Específicos del Modo */
                    ${styles}
                    
                    /* Utilidades visuales */
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .uppercase { text-transform: uppercase; }
                    .border { border: 1px solid #ccc; }
                    .p-2 { padding: 0.5rem; }
                    .font-mono { font-family: monospace; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">
                    Plantilla: ${
                      template.name
                    } • Impreso: ${date} • Modo: ${mode.toUpperCase()}
                </div>
                <div class="content">
                    ${contentHtml}
                </div>
            </body>
            </html>
        `);
    doc.close();

    // 5. Imprimir y Limpiar
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.error("Error al imprimir:", e);
      } finally {
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 2000);
      }
    }, 500);
  }

  static getPrintStyles(mode) {
    // 1. MODO COMPACTO: Reducimos márgenes y padding
    if (mode === "compact") {
      return `
            body { margin: 10px; padding: 0; font-size: 12px; }
            .print-grid { gap: 4px; } /* Gap muy reducido */
            .field-container { 
                padding: 4px; 
                border: 1px solid #eee; 
                background-color: #fafafa;
            }
            h1 { font-size: 16px; }
            p, div { margin-bottom: 2px; }
            table th, table td { padding: 2px 4px; font-size: 11px; border: 1px solid #ddd; }
      `;
    }
    // 2. MODO LECTURA FÁCIL: Márgenes reducidos (como compacta) PERO letra GRANDE
    else if (mode === "easy") {
      return `
            body { margin: 10px; padding: 0; font-size: 18px; line-height: 1.4; }
            .print-grid { gap: 8px; } /* Gap medio */
            .field-container { 
                padding: 8px; 
                border-bottom: 1px solid #ccc; /* Solo líneas para limpiar ruido visual */
            }
            h1 { font-size: 28px; }
            strong { color: #000; }
            table th, table td { padding: 8px; font-size: 16px; border: 1px solid #666; }
      `;
    }
    // 3. MODO NORMAL: Tal cual se ve (Espaciado cómodo)
    else {
      return `
            body { margin: 20px; padding: 20px; font-size: 14px; max-width: 1000px; margin-left: auto; margin-right: auto; }
            .print-grid { gap: 20px; } /* Espaciado amplio estándar */
            .field-container { 
                padding: 15px; 
                border: 1px solid #e2e8f0; 
                border-radius: 8px;
            }
            h1 { font-size: 24px; color: #2b6cb0; }
            table th { background-color: #f7fafc; padding: 8px; font-weight: bold; border: 1px solid #e2e8f0; }
            table td { padding: 8px; border: 1px solid #e2e8f0; }
      `;
    }
  }
}
