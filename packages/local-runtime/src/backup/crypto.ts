import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { BusinessError, canonical, requireThat } from '@evoloop/kernel';
import type { CryptoPort } from '../ports/public.ts';

const header = 'EVOLOOP-BACKUP-AES256GCM-PBKDF2SHA256-v1';
function decodeUtf8(bytes: Uint8Array): string {
  return decodeURIComponent(Array.from(bytes, byte => '%' + byte.toString(16).padStart(2, '0')).join(''));
}
/** randomBytes must use native crypto or crypto.getRandomValues, never Math.random. */
export function backupCrypto(randomBytes: (length: number) => Uint8Array): CryptoPort {
  return {
    async seal(plaintext, password) {
      const bytes = utf8ToBytes(plaintext);
      requireThat(bytes.length <= 63 * 1024 * 1024, 'BACKUP_TOO_LARGE');
      const salt = randomBytes(16), nonce = randomBytes(12);
      requireThat(salt.length === 16 && nonce.length === 12, 'CRYPTO_RANDOM_INVALID');
      const key = await pbkdf2Async(sha256, utf8ToBytes(password), salt, { c: 210000, dkLen: 32 });
      try {
        const ciphertext = gcm(key, nonce, utf8ToBytes(header)).encrypt(bytes);
        return canonical({ header, salt: bytesToHex(salt), nonce: bytesToHex(nonce), ciphertext: bytesToHex(ciphertext) });
      } finally { key.fill(0); }
    },
    async open(ciphertext, password) {
      requireThat(ciphertext.length <= 128 * 1024 * 1024, 'BACKUP_TOO_LARGE');
      const envelope = JSON.parse(ciphertext) as { header: string; salt: string; nonce: string; ciphertext: string };
      requireThat(envelope.header === header && /^[0-9a-f]{32}$/.test(envelope.salt) && /^[0-9a-f]{24}$/.test(envelope.nonce), 'BACKUP_FORMAT_UNSUPPORTED');
      const key = await pbkdf2Async(sha256, utf8ToBytes(password), hexToBytes(envelope.salt), { c: 210000, dkLen: 32 });
      try { return decodeUtf8(gcm(key, hexToBytes(envelope.nonce), utf8ToBytes(header)).decrypt(hexToBytes(envelope.ciphertext))); }
      catch { throw new BusinessError('BACKUP_PASSWORD_OR_INTEGRITY_INVALID'); }
      finally { key.fill(0); }
    },
  };
}
