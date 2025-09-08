import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { generateTokens, verifyToken } from '@/utils/token.server'
import { UserRole } from '@prisma/client';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: string;
  permissions?: any;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  university?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

interface AuthResponse {
  user: UserSession;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Helper function to get user with department/university data
async function getUserWithRoleData(userId: string, role: string): Promise<UserSession> {
  const baseUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      department_administrator: {
        include: {
          department: {
            include: {
              university: true
            }
          }
        }
      },
      student: true,
      super_admin: true
    }
  });

  if (!baseUser) {
    throw new Error('User not found');
  }

  const userSession: UserSession = {
    id: baseUser.id,
    email: baseUser.email,
    name: baseUser.name,
    role: baseUser.role
  };

  // Add role-specific data
  if (baseUser.role === 'DEPARTMENT_ADMINISTRATOR' && baseUser.department_administrator) {
    userSession.permissions = baseUser.department_administrator.permissions;
    
    if (baseUser.department_administrator.department) {
      userSession.department = {
        id: baseUser.department_administrator.department.id,
        name: baseUser.department_administrator.department.name,
        code: baseUser.department_administrator.department.code
      };
      
      if (baseUser.department_administrator.department.university) {
        userSession.university = {
          id: baseUser.department_administrator.department.university.id,
          name: baseUser.department_administrator.department.university.name,
          slug: baseUser.department_administrator.department.university.slug
        };
      }
    }
  } else if (baseUser.role === 'SUPER_ADMIN' && baseUser.super_admin) {
    userSession.permissions = baseUser.super_admin.permissions;
  }

  return userSession;
}

/**
 * Register a new user
 */
export const registerUser = async (
  name: string, 
  email: string, 
  password: string
): Promise<AuthResponse> => {
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const userData = {
    name,
    email,
    password: hashedPassword,
    role: UserRole.STUDENT, 
    student: {
      create: {} 
    }
  };

  const user = await prisma.user.create({
    data: userData,
    include: {
      student: true, 
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

  // Get full user data with student information
  const userWithRoleData = await getUserWithRoleData(user.id, user.role);

  return {
    user: userWithRoleData,
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

  // Get full user data with role information
  const userWithRoleData = await getUserWithRoleData(user.id, user.role);

  return {
    user: userWithRoleData,
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
      }
    });

    if (!session) {
      return null;
    }

    // Get full user data with role information
    return await getUserWithRoleData(decoded.userId, decoded.role as string);
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
    
    // Get full user data with role information
    return await getUserWithRoleData(decoded.userId, decoded.role as string);
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

/**
 * Update user profile details
 */

export async function updateUser(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    phoneNumber?: string | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: updates.name,
      email: updates.email,
     
      updatedAt: new Date(),
    },
  });
}

/**
 * Update user password
 */

export async function updateUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  // First verify current password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updatedAt: new Date(),
    },
  });
}


