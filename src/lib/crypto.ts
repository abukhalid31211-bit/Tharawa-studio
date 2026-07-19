/**
 * Tharwah Capital - Cryptographic Utilities
 * تشفير آمن باستخدام Web Crypto API
 */

function str2ab(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function ab2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// PBKDF2 hashing
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const saltToUse = salt || generateSalt();
  const iterations = 100000;

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2ab(password) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: str2ab(saltToUse) as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hash: ab2hex(bits),
    salt: saltToUse,
  };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const result = await hashPassword(password, salt);
  return result.hash === hash;
}

export function generateSalt(length = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return ab2hex(array.buffer as ArrayBuffer);
}

export async function sha256(message: string): Promise<string> {
  const msgBuffer = str2ab(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer as BufferSource);
  return ab2hex(hashBuffer);
}

export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return ab2hex(array.buffer as ArrayBuffer);
}

const OBFUSCATION_KEY = 'tharwah-2026-obfuscation';

export function obfuscateData(data: string): string {
  try {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      );
    }
    return btoa(result);
  } catch {
    return data;
  }
}

export function deobfuscateData(obfuscated: string): string {
  try {
    const decoded = atob(obfuscated);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length)
      );
    }
    return result;
  } catch {
    return obfuscated;
  }
}

export async function signSession(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    str2ab(secret) as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, str2ab(payload) as BufferSource);
  return ab2hex(signature);
}

export async function verifySessionSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await signSession(payload, secret);
  return expected === signature;
}
