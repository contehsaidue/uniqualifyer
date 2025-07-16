
interface JwtConfig {
  secret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET in environment variables');
}

if (!process.env.JWT_ACCESS_EXPIRES_IN) {
  console.warn('JWT_ACCESS_EXPIRES_IN not set, using default "15m"');
}

// Export configuration
export const JWT_CONFIG: JwtConfig = {
  secret: process.env.JWT_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

// Individual exports for your existing token service
export const JWT_SECRET = JWT_CONFIG.secret;
export const JWT_EXPIRES_IN = JWT_CONFIG.accessExpiresIn;