import prisma from '@/lib/prisma';
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
  createdAt: Date;
  updatedAt: Date;
}

interface CreateUniversityInput {
  name: string;
  slug: string;
}

interface UpdateUniversityInput {
  name?: string;
  slug?: string;
}

interface UniversityWithRelations extends University {
  programs: {
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
    includePrograms?: boolean;
    includeDepartments?: boolean;
  }
): Promise<UniversityWithRelations[]> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.university.findMany({
    include: {
      programs: options?.includePrograms ? {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      } : false,
      departments: options?.includeDepartments ? {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
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
    includePrograms?: boolean;
    includeDepartments?: boolean;
  }
): Promise<UniversityWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.university.findUnique({
    where: { id },
    include: {
      programs: options?.includePrograms ? {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      } : false,
      departments: options?.includeDepartments ? {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
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
    includePrograms?: boolean;
    includeDepartments?: boolean;
  }
): Promise<UniversityWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.university.findUnique({
    where: { slug },
    include: {
      programs: options?.includePrograms ? {
        select: {
          id: true,
          name: true
        },
        orderBy: {
          name: 'asc'
        }
      } : false,
      departments: options?.includeDepartments ? {
        select: {
          id: true,
          name: true
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
): Promise<void> => {
  verifyAdminPrivileges(currentUser);

  // Use transaction to delete all related records
  await prisma.$transaction([
    // Delete all programs and their requirements
    prisma.programRequirement.deleteMany({
      where: {
        program: {
          universityId: id
        }
      }
    }),
    prisma.program.deleteMany({
      where: {
        universityId: id
      }
    }),
    // Delete all departments
    prisma.department.deleteMany({
      where: {
        universityId: id
      }
    }),
    // Finally delete the university
    prisma.university.delete({
      where: { id }
    })
  ]);
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