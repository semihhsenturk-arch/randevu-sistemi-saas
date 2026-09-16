import crypto from 'crypto';

// SEC-01 FIX: Hardcoded fallback key kaldırıldı.
// ENCRYPTION_KEY yoksa veya 32 byte değilse uygulama başlatılamaz.
const _rawKey = process.env.ENCRYPTION_KEY;
if (!_rawKey || Buffer.byteLength(_rawKey, 'utf-8') !== 32) {
  throw new Error(
    'CRITICAL: ENCRYPTION_KEY environment variable is missing or not exactly 32 bytes. ' +
    'Server cannot start without a valid encryption key. ' +
    'Set ENCRYPTION_KEY in your .env.local file (must be exactly 32 characters).'
  );
}
const ENCRYPTION_KEY: string = _rawKey;

const IV_LENGTH = 16; // 16 bytes for both CBC and GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag for GCM
const GCM_PREFIX = 'gcm'; // Prefix to identify GCM-encrypted data

/**
 * Encrypts a given text using AES-256-GCM (authenticated encryption).
 * SEC-1.7 FIX: GCM provides both confidentiality and integrity (HMAC built-in).
 * Output format: "gcm:iv_hex:authTag_hex:ciphertext_hex"
 * SEC-02 FIX: Şifreleme başarısız olursa throw eder — plaintext veri asla veritabanına yazılmaz.
 */
export function encryptData(text: string | null | undefined): string | null {
  if (!text) return text as any;

  // If it's already encrypted (GCM or CBC format), don't encrypt again
  if (text.startsWith(GCM_PREFIX + ':')) return text; // Already GCM
  if (text.includes(':') && text.length > 32) {
    const parts = text.split(':');
    if (parts.length === 2 && parts[0].length === 32) return text; // Already CBC
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: gcm:iv:authTag:ciphertext
  return [
    GCM_PREFIX,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a given text. Supports both GCM (new) and CBC (legacy) formats.
 * SEC-1.7 FIX: GCM decryption verifies authenticity — tampered data will throw.
 * Legacy CBC data is still readable for backward compatibility.
 */
export function decryptData(text: string | null | undefined): string | null {
  if (!text) return text as any;

  // GCM format: "gcm:iv_hex:authTag_hex:ciphertext_hex"
  if (text.startsWith(GCM_PREFIX + ':')) {
    return decryptGCM(text);
  }

  // Legacy CBC format: "iv_hex:ciphertext_hex"
  if (text.includes(':')) {
    return decryptCBC(text);
  }

  // Not encrypted (plaintext)
  return text;
}

/**
 * Decrypt AES-256-GCM encrypted data.
 * Throws on tampered data (integrity verification via auth tag).
 */
function decryptGCM(text: string): string {
  const parts = text.split(':');
  // Expected: ["gcm", iv_hex, authTag_hex, ciphertext_hex]
  if (parts.length !== 4) {
    console.warn("Decryption failed: invalid GCM format");
    return text;
  }

  try {
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const ciphertext = Buffer.from(parts[3], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    // GCM decryption failure means data was tampered with — do NOT return plaintext
    console.error("GCM decryption failed — possible data tampering");
    throw new Error("Decryption integrity check failed");
  }
}

/**
 * Decrypt legacy AES-256-CBC encrypted data (backward compatibility).
 * Falls back to returning original text if decryption fails (may be legacy plaintext).
 */
function decryptCBC(text: string): string {
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text;
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    // SEC-10 partial fix: Hassas veri loglanmıyor, sadece hata türü belirtiliyor
    console.warn("CBC decryption failed for a field (may be legacy plaintext)");
    return text; // Return original text on failure (might be plaintext that happened to have a colon)
  }
}
