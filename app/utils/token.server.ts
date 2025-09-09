import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createSecretKey } from 'crypto';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

interface TokenPayload extends JWTPayload {
  userId: string;
  role?: string;
}

const JWT_SECRET_KEY = createSecretKey(
  Buffer.from(process.env.JWT_SECRET || '1ed9d0344bc1c521bda34e1da6da35832d859f79799666b5436f2de8aacdb5a0')
);

const JWT_REFRESH_SECRET_KEY = createSecretKey(
  Buffer.from(process.env.JWT_REFRESH_SECRET || '1ed9d0344bc1c521bda34e1da6da35832d859f79799666b5436f2de8aacdb5a0')
);


export async function generateTokens(userId: string, role: string) {
  const accessToken = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET_KEY);

  const refreshToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET_KEY);

  return { accessToken, refreshToken };
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
  return payload as TokenPayload;
}