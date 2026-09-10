import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encryptData, decryptData } from '@/lib/encryption';

describe('Encryption Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 bytes
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should encrypt and decrypt a string correctly', () => {
    const originalText = 'Hello, this is a secret message!';
    const encryptedText = encryptData(originalText);
    
    expect(encryptedText).not.toBe(originalText);
    expect(encryptedText).toContain(':'); // IV and encrypted data separator

    const decryptedText = decryptData(encryptedText);
    expect(decryptedText).toBe(originalText);
  });

  it('should handle null or undefined data', () => {
    expect(encryptData(null)).toBeNull();
    expect(encryptData(undefined as any)).toBeUndefined();
    expect(decryptData(null)).toBeNull();
    expect(decryptData(undefined as any)).toBeUndefined();
  });

  it('should return original text if it is not encrypted (backward compatibility)', () => {
    const plaintext = 'Not encrypted string';
    // If it doesn't contain a colon, it returns the original string
    expect(decryptData(plaintext)).toBe(plaintext);
  });

  it('should return original text if decryption fails (e.g. malformed or plaintext with colon)', () => {
    const malformed = '1234567890abcdef:thisisnotvalidhex';
    expect(decryptData(malformed)).toBe(malformed);
  });
});
