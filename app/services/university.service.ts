import prisma from '~/lib/prisma.server';
import { UserRole } from '@prisma/client';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: UserRole;
  departmentId?: string;
  permissions?: any;
}

interface University {
  id: string;
  name: string;
  slug: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUniversityInput {
  name: string;
  slug: string;
   location: string;
}

interface UpdateUniversityInput {
  name?: string;
  slug?: string;
   location?: string;
}

interface UniversityWithRelations extends University {
  programs?: {
    id: string;
    name: string;
  }[];
  departments: {
    id: string;
    name: string;
  }[];
}

/**
 * Verify admin privileges for university operations
 */
const verifyAdminPrivileges = (currentUser: UserSession) => {
  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized: Only super admins can manage universities');
  }
};

/**
 * Create a new university
 */
export const createUniversity = async (
  input: CreateUniversityInput,
  currentUser: UserSession
): Promise<University> => {
  verifyAdminPrivileges(currentUser);

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check for existing university with same name or slug
  const existingUniversity = await prisma.university.findFirst({
    where: {
      OR: [
        { name: input.name },
        { slug: input.slug }
      ]
    }
  });

  if (existingUniversity) {
    if (existingUniversity.name === input.name) {
      throw new Error('A university with this name already exists');
    }
    if (existingUniversity.slug === input.slug) {
      throw new Error('A university with this slug already exists');
    }
  }

  return await prisma.university.create({
    data: {
      name: input.name,
      slug: input.slug,
      location: input.location,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
};

/**
 * Get all universities with optional relations
 */
export const getUniversities = async (
  currentUser: UserSession,
  options?: {
    includeDepartments?: boolean;
  }
) => {
  // Verify admin privileges if needed
  if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only admins can access universities');
  }

  const includeDepartments = options?.includeDepartments ?? false;

  return await prisma.university.findMany({
    include: {
      departments: includeDepartments ? {
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          updatedAt: true
        }
      } : false,
    },
    orderBy: {
      name: 'asc'
    }
  });
};

/**
 * Get university by ID with optional relations
 */
export const getUniversityById = async (
  id: string,
  currentUser: UserSession,
  options?: {
    includeDepartments?: boolean;
  }
) => {
  // Verify admin privileges if needed
  if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only admins can access universities');
  }

  const includeDepartments = options?.includeDepartments ?? false;

  return await prisma.university.findUnique({
    where: { id },
    include: {
      departments: includeDepartments ? {
        select: {
          id: true,
          name: true,
          code: true,
          createdAt: true,
          updatedAt: true
        }
      } : false,
    }
  });
};

/**
 * Get university by slug with optional relations
 */
export const getUniversityBySlug = async (
  slug: string,
  currentUser: UserSession,
  options?: {
    includeDepartments?: boolean;
  }
): Promise<UniversityWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  return await prisma.university.findUnique({
    where: { slug },
    include: {
      departments: options?.includeDepartments ? {
        select: {
          id: true,
          name: true,
          code: true
        },
        orderBy: {
          name: 'asc'
        }
      } : false,
    }
  });
};

/**
 * Update university
 */
export const updateUniversity = async (
  id: string,
  input: UpdateUniversityInput,
  currentUser: UserSession
): Promise<University> => {
  verifyAdminPrivileges(currentUser);

  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check for existing university with same slug if slug is being updated
  if (input.slug) {
    const existingUniversity = await prisma.university.findFirst({
      where: {
        slug: input.slug,
        NOT: { id }
      }
    });

    if (existingUniversity) {
      throw new Error('A university with this slug already exists');
    }
  }

  return await prisma.university.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      location: input.location,
      updatedAt: new Date()
    }
  });
};

/**
 * Delete university and all related data
 */
export const deleteUniversity = async (
  id: string,
  currentUser: UserSession
) => {
  // Only super admins can delete universities
  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized: Only super admins can delete universities');
  }

  const departmentsCount = await prisma.department.count({
    where: { universityId: id }
  });

  if (departmentsCount > 0) {
    throw new Error('Cannot delete university with existing departments');
  }

  return await prisma.university.delete({
    where: { id }
  });
};
/**
 * Search universities by name or slug
 */
export const searchUniversities = async (
  query: string,
  currentUser: UserSession,
  limit: number = 10
): Promise<University[]> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.university.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit,
    orderBy: {
      name: 'asc'
    }
  });
};