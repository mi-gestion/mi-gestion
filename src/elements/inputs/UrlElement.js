import { BaseInput } from "./BaseInput.js";

// --- GESTOR MULTIMEDIA SINGLETON ---
if (!window.MediaViewer) {
  window.MediaViewer = {
    audioPlayer: null,
    audioContainer: null,

    init() {
      if (document.getElementById("global-media-viewer-styles")) return;

      const style = document.createElement("style");
      style.id = "global-media-viewer-styles";
      // ACTUALIZACIÓN: display: block para permitir estructura vertical en impresión
      style.innerHTML = `
                @media print {
                    .media-screen-only { display: none !important; }
                    .media-print-only { display: block !important; }
                }
                @media screen {
                    .media-print-only { display: none !important; }
                }
            `;
      document.head.appendChild(style);

      this.createAudioPlayer();
      this.createImageModal();
    },

    createAudioPlayer() {
      const div = document.createElement("div");
      div.id = "fixed-audio-player";
      div.className =
        "fixed bottom-4 right-4 bg-white border border-gray-200 shadow-2xl rounded-xl p-4 w-80 z-[100] hidden animate-fade-in flex flex-col gap-2 media-screen-only";
      div.innerHTML = `
                <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <span class="text-2xl">🎵</span>
                        <div class="flex flex-col overflow-hidden">
                            <span class="text-[10px] font-bold uppercase text-blue-600">Reproduciendo</span>
                            <span id="media-audio-title" class="text-sm font-bold text-gray-800 truncate block w-full">Audio</span>
                        </div>
                    </div>
                    <button onclick="window.MediaViewer.closeAudio()" class="text-gray-400 hover:text-red-500 text-xl leading-none">&times;</button>
                </div>
                <audio id="media-audio-element" controls class="w-full h-8 mt-1 focus:outline-none"></audio>
            `;
      document.body.appendChild(div);
      this.audioContainer = div;
      this.audioPlayer = div.querySelector("audio");
    },

    createImageModal() {
      const div = document.createElement("div");
      div.id = "image-view-modal";
      div.className =
        "fixed inset-0 z-[110] bg-black/90 hidden flex items-center justify-center p-4 backdrop-blur-sm media-screen-only";
      div.onclick = (e) => {
        if (e.target === div) this.closeImage();
      };
      div.innerHTML = `
                <div class="relative max-w-full max-h-full flex flex-col items-center">
                    <img id="media-modal-img" src="" class="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain bg-black">
                    <div id="media-img-caption" class="mt-2 text-white/90 text-sm font-bold bg-black/50 px-3 py-1 rounded-full"></div>
                    <button onclick="window.MediaViewer.closeImage()" class="absolute -top-10 right-0 text-white text-xl font-bold hover:text-gray-300">Cerrar [ESC]</button>
                </div>
            `;
      document.body.appendChild(div);

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") this.closeImage();
      });
    },

    playAudio(url, title) {
      this.init();
      if (!this.audioPlayer) this.createAudioPlayer();

      this.audioPlayer.src = url;
      document.getElementById("media-audio-title").textContent =
        title || "Audio";
      this.audioContainer.classList.remove("hidden");
      this.audioPlayer
        .play()
        .catch((e) => console.warn("Autoplay bloqueado", e));
    },

    closeAudio() {
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioContainer.classList.add("hidden");
      }
    },

    showImage(url, title) {
      this.init();
      const modal = document.getElementById("image-view-modal");
      const img = document.getElementById("media-modal-img");
      const cap = document.getElementById("media-img-caption");

      img.src = url;
      cap.textContent = title || "";
      modal.classList.remove("hidden");
    },

    closeImage() {
      const modal = document.getElementById("image-view-modal");
      if (modal) modal.classList.add("hidden");
    },
  };

  window.addEventListener("DOMContentLoaded", () => window.MediaViewer.init());
}

// --- CLASE URLELEMENT ---

export class UrlElement extends BaseInput {
  constructor() {
    super("url", "🔗", "Enlace");
    if (window.MediaViewer && window.MediaViewer.init)
      window.MediaViewer.init();
  }

  isAudio(url) {
    return /\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i.test(url);
  }

  isImage(url) {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(url);
  }

  parseValue(v) {
    if (typeof v === "object" && v !== null) {
      return { url: v.url || "", text: v.text || "" };
    }
    if (typeof v === "string" && v.trim().startsWith("{")) {
      try {
        return JSON.parse(v);
      } catch {
        return { url: v, text: "" };
      }
    }
    return { url: v || "", text: "" };
  }

  renderEditor(c, v = "", ctx = "form") {
    const val = this.parseValue(v);

    if (ctx === "table") {
      return `
            <div class="url-group min-w-[200px] flex flex-col gap-1">
                <input type="text" data-role="text" class="w-full p-1 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.text}" placeholder="Texto">
                <input type="url" data-role="url" class="w-full p-1 border rounded text-xs text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none" 
                    value="${val.url}" placeholder="URL">
            </div>
        `;
    }

    return this.renderInContext(
      c,
      `
        <div class="url-group grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Texto del Enlace</span>
                <input type="text" data-role="text" class="w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm" 
                    value="${val.text}" placeholder="Ej: Web Oficial">
            </div>
            <div class="relative">
                <span class="absolute left-2 top-2 text-[10px] font-bold text-gray-400 uppercase">Dirección (URL)</span>
                <input type="url" data-role="url" class="w-full pt-5 pb-2 px-2 border rounded focus:ring-2 focus:ring-blue-100 outline-none border-gray-300 text-sm font-mono text-blue-600" 
                    value="${val.url}" placeholder="https://...">
            </div>
        </div>
    `,
      ctx
    );
  }

  attachListeners(container, onChange) {
    const textInput = container.querySelector('[data-role="text"]');
    const urlInput = container.querySelector('[data-role="url"]');

    if (!textInput || !urlInput) return;

    const updateState = () => {
      const newVal = {
        text: textInput.value,
        url: urlInput.value,
      };
      if (typeof onChange === "function") {
        onChange(newVal);
      }
      container.value = newVal;
    };

    textInput.addEventListener("input", updateState);
    urlInput.addEventListener("input", updateState);
  }

  extractValue(container) {
    if (container.value) return container.value;
    const t = container.querySelector('[data-role="text"]')?.value || "";
    const u = container.querySelector('[data-role="url"]')?.value || "";
    return { text: t, url: u };
  }

  // --- RENDERIZADO VISUAL (LECTURA/IMPRESIÓN) ---
  renderPrint(c, v, ctx) {
    const val = this.parseValue(v);
    if (!val.url) return ctx === "table" ? "-" : "";

    const displayText = val.text || "Enlace";
    const safeUrl = val.url.replace(/["'<>;]/g, "");
    const safeTitle = displayText.replace(/["'<>;]/g, "");

    // 1. VERSIÓN PARA IMPRESIÓN (Texto arriba, URL pequeña abajo, gris)
    const printVersion = `
        <div class="media-print-only">
             <span class="text-gray-900">${displayText}</span>
             <div class="text-[9px] text-gray-400 mt-0.5 break-all leading-tight">${safeUrl}</div>
        </div>
    `;

    // 2. VERSIÓN PARA PANTALLA (Interactivo)
    let screenVersion = "";

    // CASO A: AUDIO
    if (this.isAudio(safeUrl)) {
      screenVersion = `
            <button type="button" 
                class="media-screen-only inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-900 border border-pink-200 rounded-full transition group"
                onclick="window.MediaViewer.playAudio('${safeUrl}', '${safeTitle}')">
                <span class="text-sm group-hover:scale-110 transition-transform">🎵</span>
                <span class="text-xs font-bold">${displayText}</span>
            </button>
        `;
    }
    // CASO B: IMAGEN
    else if (this.isImage(safeUrl)) {
      screenVersion = `
            <button type="button" 
                class="media-screen-only inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-900 border border-purple-200 rounded-full transition group"
                onclick="window.MediaViewer.showImage('${safeUrl}', '${safeTitle}')">
                <span class="text-sm group-hover:scale-110 transition-transform">🖼️</span>
                <span class="text-xs font-bold">${displayText}</span>
            </button>
        `;
    }
    // CASO C: ENLACE NORMAL
    else {
      screenVersion = `
            <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" 
               class="media-screen-only text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 break-all">
               ${displayText} <span class="text-[10px]">↗</span>
            </a>
        `;
    }

    // Combinamos ambas versiones
    const finalHtml = `<div class="inline-block align-top">${screenVersion}${printVersion}</div>`;

    if (ctx === "table") return finalHtml;
    return `<div><strong>${c.label}:</strong> ${finalHtml}</div>`;
  }
}
