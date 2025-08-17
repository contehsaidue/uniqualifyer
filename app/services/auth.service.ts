
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateTokens, verifyToken } from '@/utils/token.server'

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: string;
  departmentId?: string;
  permissions?: any;

}

interface AuthResponse {
  user: UserSession;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

/**
 * Register a new user
 */

export const registerUser = async (
  name: string, 
  email: string, 
  password: string
): Promise<AuthResponse> => {
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create the user in database
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      
    }
  });

  const { accessToken, refreshToken } = await generateTokens(user.id, user.role);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    tokens: { 
      accessToken, 
      refreshToken 
    }
  };
};

/**
 * Login user with email and password
 */

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const { accessToken, refreshToken } = await generateTokens(user.id, user.role);

  const existingSession = await prisma.session.findFirst({
    where: { userId: user.id }
  });

  await prisma.session.upsert({
    where: existingSession ? { id: existingSession.id } : { id: '' }, 
    update: { 
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    create: {
      userId: user.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    },
    tokens: { accessToken, refreshToken }
  };
};

/**
 * Get user by session (using refresh token)
 */

export const getUserBySession = async (refreshToken: string): Promise<UserSession | null> => {
  try {
    // Verify the refresh token
    const decoded = await verifyToken(refreshToken);
    
    // Check if session exists in database
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name
    };
  } catch (error) {
    return null;
  }
};

/**
 * Get user by access token
 */

export const getUserByToken = async (accessToken: string): Promise<UserSession | null> => {
  try {
    const decoded = await verifyToken(accessToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };
  } catch (error) {
    return null;
  }
};

/**
 * Logout user by invalidating their session
 */

export const logoutUser = async (refreshToken: string): Promise<void> => {
  try {
    // Delete the session from database
    await prisma.session.deleteMany({
      where: { refreshToken }
    });
  } catch (error) {
    console.error('Error during logout:', error);
    throw new Error('Logout failed');
  }
};

/**
 * Logout user from all devices (all sessions)
 */

export const logoutAllSessions = async (userId: string): Promise<void> => {
  try {
    await prisma.session.deleteMany({
      where: { userId }
    });
  } catch (error) {
    console.error('Error during logout from all devices:', error);
    throw new Error('Logout from all devices failed');
  }
};

/**
 * Refresh access token using refresh token
 */

export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  const user = await getUserBySession(refreshToken);
  
  if (!user) {
    throw new Error('Invalid or expired refresh token');
  }

  const { accessToken } = await generateTokens(user.id, user.role);
  
  return { accessToken };
};
