export class CryptoManager {
  // Deriva una llave maestra a partir de la contraseña y un "salt"
  static async deriveKey(password, salt) {
    console.log("🔐 [Crypto] Iniciando derivación de llave (PBKDF2)...");
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: enc.encode(salt),
        iterations: 100000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
    console.log("✅ [Crypto] Llave derivada con éxito.");
    return key;
  }

  static async encrypt(text, key) {
    console.log("🔒 [Crypto] Cifrando contenido...");
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Vector de inicialización
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(text)
    );

    // Retornamos el IV + los datos cifrados en Base64 para guardarlo en Firestore
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    console.log("✅ [Crypto] Contenido cifrado y codificado en Base64.");
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(base64Data, key) {
    console.log("🔓 [Crypto] Intentando descifrar datos...");
    const combined = new Uint8Array(
      atob(base64Data)
        .split("")
        .map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );
    console.log("✅ [Crypto] Descifrado exitoso.");
    return new TextDecoder().decode(decrypted);
  }

  async updatePassphrase(newPhrase) {
    // Lógica para derivar la nueva clave (PBKDF2)
    const newKey = await deriveKeyFromPhrase(newPhrase); // Función interna que ya debes tener

    // Actualizar la variable interna donde guardas la clave (cryptoKey)
    state.cryptoKey = newKey;

    // Importante: No guardamos nada en Firebase aquí,
    // el guardado ocurre cuando StateManager llama a saveUserData usando esta nueva key.
    return true;
  }
}
