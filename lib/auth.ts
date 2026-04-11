import crypto from 'crypto';

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, derivedKey] = storedHash.split(':');
  if (!salt || !derivedKey) return false;
  const hashedBuffer = Buffer.from(crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex'), 'hex');
  const storedBuffer = Buffer.from(derivedKey, 'hex');
  return crypto.timingSafeEqual(hashedBuffer, storedBuffer);
}
