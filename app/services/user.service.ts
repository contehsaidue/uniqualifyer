
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { getSession, destroySession } from '@/utils/session.server';
import { getUserBySession } from '@/services/auth.service';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: UserRole;
  departmentId?: string;
  permissions?: any;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  createdAt: Date;
  updatedAt: Date;
  departmentAdministrator?: {
    department?: {
      id: string;
      name: string;
      university: {
        id: string;
        name: string;
      };
    };
  };
  superAdmin?: {
    permissions: any;
  };
}

interface CreateAdminUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId?: string;
  permissions?: any;
}

interface UpdateAdminUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  departmentId?: string;
  permissions?: any;
}

export async function adminLoader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const refreshToken = session.get("refreshToken");

  const user = await getUserBySession(refreshToken);
  if (!user) {
    if (refreshToken) {
      throw redirect("/auth/login", {
        headers: {
          "Set-Cookie": await destroySession(session),
        },
      });
    }
    throw redirect("/auth/login");
  }

  // Verify admin privileges
  if (user.role !== UserRole.SUPER_ADMIN && 
      user.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw redirect("/dashboard");
  }

  return json({ user });
}

/**
 * Create a new admin user with proper role-specific relationships
 */
export const createAdminUser = async (
  input: CreateAdminUserInput,
  currentUser: UserSession
): Promise<AdminUser> => {
  // Verify current user has admin privileges
  if (currentUser.role !== UserRole.SUPER_ADMIN && 
      currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  // Department admins can only create users for their department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (input.role === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Cannot create super admin');
    }
    if (input.departmentId && input.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot assign to other departments');
    }
    input.role = UserRole.DEPARTMENT_ADMINISTRATOR;
    input.departmentId = currentUser.departmentId;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);

  // Create transaction for user and role-specific record
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // Create role-specific record
    if (input.role === UserRole.SUPER_ADMIN) {
      await tx.superAdmin.create({
        data: {
          userId: user.id,
          permissions: input.permissions || {}
        }
      });
    } else if (input.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
      if (!input.departmentId) {
        throw new Error('Department ID is required for department administrators');
      }
      await tx.departmentAdministrator.create({
        data: {
          userId: user.id,
          departmentId: input.departmentId,
          permissions: {} // Default empty permissions
        }
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  });
};

/**
 * Get all admin users with their role-specific details
 */
export const getAdminUsers = async (
  currentUser: UserSession,
  filters?: {
    role?: UserRole;
    departmentId?: string;
  }
): Promise<AdminUser[]> => {
  // Verify current user has admin privileges
  if (currentUser.role !== UserRole.SUPER_ADMIN && 
      currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Insufficient permissions');
  }

  const where: any = {
    role: {
      in: [UserRole.SUPER_ADMIN, UserRole.DEPARTMENT_ADMINISTRATOR]
    }
  };

  // Department admins can only see users from their department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    where.OR = [
      { 
        department_administrator: { 
          departmentId: currentUser.departmentId 
        } 
      },
      { role: UserRole.SUPER_ADMIN }
    ];
  } else if (filters?.departmentId) {
    // Super admins can filter by department if needed
    where.department_administrator = {
      departmentId: filters.departmentId
    };
  }

  if (filters?.role) {
    where.role = filters.role;
  }

  return await prisma.user.findMany({
    where,
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
     
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
};

/**
 * Get admin user by ID with role-specific details
 */
export const getAdminUserById = async (
  id: string,
  currentUser: UserSession
): Promise<AdminUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id },
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
    }
  });

  if (!user || 
      (user.role !== UserRole.SUPER_ADMIN && 
       user.role !== UserRole.DEPARTMENT_ADMINISTRATOR)) {
    return null;
  }

  // Verify permissions
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    // Department admins can only view users from their own department
    if (user.role === UserRole.DEPARTMENT_ADMINISTRATOR && 
        user.department_administrator?.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot access this user');
    }
   
  }

  return user;
};
/**
 * Update admin user and their role-specific details
 */
export const updateAdminUser = async (
  id: string,
  input: UpdateAdminUserInput,
  currentUser: UserSession
): Promise<AdminUser> => {
  // First get the existing user to check permissions
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      department_administrator: true,
    
    }
  });

  if (!existingUser || 
      (existingUser.role !== UserRole.SUPER_ADMIN && 
       existingUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR)) {
    throw new Error('Admin user not found');
  }

  // Verify permissions
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (existingUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Cannot modify super admin');
    }
    
    if (existingUser.department_administrator?.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot modify this user');
    }
    
    // Department admins can't change role to super admin
    if (input.role && input.role === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Cannot assign super admin role');
    }

    // Department admins can't change department
    if (input.departmentId && 
        input.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot change department');
    }
  }

  // Update user basic info
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      updatedAt: new Date()
    },
    include: {
      department_administrator: true,
    
    }
  });

  // Update role-specific details if needed
  if (input.role === UserRole.SUPER_ADMIN && input.permissions) {
    await prisma.superAdmin.upsert({
      where: { userId: id },
      update: { permissions: input.permissions },
      create: {
        userId: id,
        permissions: input.permissions
      }
    });
  } else if (input.role === UserRole.DEPARTMENT_ADMINISTRATOR && input.departmentId) {
    await prisma.departmentAdministrator.upsert({
      where: { userId: id },
      update: { departmentId: input.departmentId },
      create: {
        userId: id,
        departmentId: input.departmentId,
        permissions: {}
      }
    });
  }

  return updatedUser;
};

/**
 * Delete admin user and their role-specific records
 */
export const deleteAdminUser = async (
  id: string,
  currentUser: UserSession
): Promise<void> => {
  // First get the existing user to check permissions
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      department_administrator: true,
    
    }
  });

  if (!existingUser || 
      (existingUser.role !== UserRole.SUPER_ADMIN && 
       existingUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR)) {
    throw new Error('Admin user not found');
  }

  // Verify permissions
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (existingUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Cannot delete super admin');
    }
    
    if (existingUser.department_administrator?.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot delete this user');
    }
  }

  // Don't allow users to delete themselves
  if (existingUser.id === currentUser.id) {
    throw new Error('Cannot delete your own account');
  }

  // Use transaction to delete all related records
  await prisma.$transaction([
    // Delete sessions
    prisma.session.deleteMany({
      where: { userId: id }
    }),
    // Delete role-specific record
    existingUser.role === UserRole.SUPER_ADMIN 
      ? prisma.superAdmin.deleteMany({
          where: { userId: id }
        })
      : prisma.departmentAdministrator.deleteMany({
          where: { userId: id }
        }),
    // Delete the user
    prisma.user.delete({
      where: { id }
    })
  ]);
};

/**
 * Reset user password (admin function)
 */
export const resetUserPassword = async (
  id: string,
  newPassword: string,
  currentUser: UserSession
): Promise<void> => {
  // First get the existing user to check permissions
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      department_administrator: true
    }
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  // Verify permissions
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (existingUser.role === UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Cannot reset password for super admin');
    }
    
    if (existingUser.department_administrator?.departmentId !== currentUser.departmentId) {
      throw new Error('Unauthorized: Cannot reset password for this user');
    }
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: {
      password: hashedPassword,
      updatedAt: new Date()
    }
  });
};