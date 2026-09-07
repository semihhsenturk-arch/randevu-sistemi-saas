import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_secret_key_32_chars_long!'; 
const IV_LENGTH = 16; 

/**
 * Encrypts a given text using AES-256-CBC.
 */
export function encryptData(text: string | null | undefined): string | null {
  if (!text) return text as any;
  // If it's already encrypted, don't encrypt again (simple heuristic check)
  if (text.includes(':') && text.length > 32) {
    const parts = text.split(':');
    if (parts.length === 2 && parts[0].length === 32) return text; 
  }
  
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error("Encryption failed", error);
    return text;
  }
}

/**
 * Decrypts a given text using AES-256-CBC.
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
    console.warn("Decryption failed for text:", text.substring(0, 10) + '...', error);
    return text; // Return original text on failure (might be plaintext that happened to have a colon)
  }
}
