import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { clientUsers, clientLoginTokens } from '@/lib/db/schema';
import { randomBytes } from 'crypto';
import { redirect } from 'next/navigation';

const SECRET_KEY = process.env.CLIENT_AUTH_SECRET || 'fallback-client-secret-for-development';
const key = new TextEncoder().encode(SECRET_KEY);

// JWT expiration: 14 days
const TOKEN_EXPIRATION = 60 * 60 * 24 * 14;

export interface ClientJwtPayload {
  jti: string;
  iat: number;
  exp: number;
  clientId: number;
  clientUserId: number;
  email: string;
  name?: string;
  tokenVersion: number;
}

// Create a JWT for client
export async function createClientJWT(payload: Omit<ClientJwtPayload, 'jti' | 'iat' | 'exp'>) {
  const jti = randomBytes(16).toString('hex');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_EXPIRATION;

  const jwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(jti)
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(key);

  return { jwt, jti, exp };
}

// Verify a client JWT
export async function verifyClientJWT(jwt: string): Promise<ClientJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(jwt, key);
    // Type assertion with unknown intermediate step to satisfy TypeScript
    return payload as unknown as ClientJwtPayload;
  } catch (error) {
    return null;
  }
}

// Set client JWT as a cookie
export async function setClientJWTCookie(jwt: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'client_token',
    value: jwt,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_EXPIRATION,
  });
}

// Get the client JWT from cookie
export async function getClientJWTCookie() {
  const cookieStore = await cookies();
  return cookieStore.get('client_token')?.value;
}

// Delete client JWT cookie
export async function deleteClientJWTCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: 'client_token',
    value: '',
    httpOnly: true,
    path: '/',
    maxAge: 0,
  });
}

// Generate a random token for magic link
export function generateToken(length = 32) {
  return randomBytes(length).toString('hex');
}

// Verify and authenticate client from JWT cookie
export async function getClientSession() {
  const jwt = await getClientJWTCookie();
  if (!jwt) return null;

  const payload = await verifyClientJWT(jwt);
  if (!payload) return null;

  // Verify token version is still valid
  const [clientUser] = await db
    .select()
    .from(clientUsers)
    .where(
      and(
        eq(clientUsers.id, payload.clientUserId),
        eq(clientUsers.clientId, payload.clientId),
        eq(clientUsers.softDelete, false)
      )
    );

  if (!clientUser || clientUser.tokenVersion !== payload.tokenVersion) {
    await deleteClientJWTCookie();
    return null;
  }

  return {
    clientId: payload.clientId,
    clientUserId: payload.clientUserId,
    email: payload.email,
    name: payload.name,
  };
}

// Middleware to check client authentication
export async function requireClientAuth() {
  const session = await getClientSession();
  if (!session) {
    redirect('/portal/login');
  }
  return session;
}

// Save a new magic link token
export async function saveLoginToken(clientId: number, email: string) {
  const token = generateToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // Token valid for 1 hour

  await db.insert(clientLoginTokens).values({
    clientId,
    email,
    token,
    expires,
  });

  return token;
}

// Verify a magic link token
export async function verifyLoginToken(token: string) {
  const [loginToken] = await db
    .select()
    .from(clientLoginTokens)
    .where(eq(clientLoginTokens.token, token));

  if (!loginToken) return null;
  
  // Check if token has expired
  if (new Date() > loginToken.expires || loginToken.usedAt) return null;

  // Mark token as used
  await db
    .update(clientLoginTokens)
    .set({ usedAt: new Date() })
    .where(eq(clientLoginTokens.id, loginToken.id));

  return loginToken;
} 