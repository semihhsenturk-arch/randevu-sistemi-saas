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

const IV_LENGTH = 16; 

/**
 * Encrypts a given text using AES-256-CBC.
 * SEC-02 FIX: Şifreleme başarısız olursa throw eder — plaintext veri asla veritabanına yazılmaz.
 */
export function encryptData(text: string | null | undefined): string | null {
  if (!text) return text as any;
  // If it's already encrypted, don't encrypt again (simple heuristic check)
  if (text.includes(':') && text.length > 32) {
    const parts = text.split(':');
    if (parts.length === 2 && parts[0].length === 32) return text; 
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a given text using AES-256-CBC.
 * Not: Şifrelenmemiş eski verilerle geriye dönük uyumluluk için,
 * çözme başarısız olursa orijinal metni döndürür (plaintext olabilir).
 */
export function decryptData(text: string | null | undefined): string | null {
  if (!text) return text as any;
  if (!text.includes(':')) return text; // Not encrypted
  
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
    console.warn("Decryption failed for a field (may be legacy plaintext)");
    return text; // Return original text on failure (might be plaintext that happened to have a colon)
  }
}
