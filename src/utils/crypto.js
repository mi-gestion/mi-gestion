export class CryptoManager {
  // Deriva una llave maestra a partir de la contraseña y un "salt"
  static async deriveKey(password, salt) {
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return await crypto.subtle.deriveKey(
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
  }

  static async encrypt(text, key) {
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
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(base64Data, key) {
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

    return new TextDecoder().decode(decrypted);
  }
}
