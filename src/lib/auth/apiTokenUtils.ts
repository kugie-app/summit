import { hash, compare } from 'bcryptjs';
import { randomBytes } from 'crypto';

const SALT_ROUNDS = 10;
export const API_TOKEN_PREFIX = 'skt_'; // Summit Key Token
const PREFIX_RANDOM_LENGTH = 8; // Length of the random part of the prefix
const SECRET_LENGTH = 32; // Length of the secret part of the token

function generateRandomString(length: number): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

export function generateApiTokenParts(): { prefix: string; secret: string; fullToken: string } {
  const randomPrefixPart = generateRandomString(PREFIX_RANDOM_LENGTH);
  const prefix = `${API_TOKEN_PREFIX}${randomPrefixPart}`;
  const secret = generateRandomString(SECRET_LENGTH);
  const fullToken = `${prefix}_${secret}`; // User sees prefix_secret
  return { prefix, secret, fullToken };
}

export async function hashTokenSecret(secret: string): Promise<string> {
  return hash(secret, SALT_ROUNDS);
}

export async function verifyTokenSecret(secret: string, hash: string): Promise<boolean> {
  return compare(secret, hash);
} 