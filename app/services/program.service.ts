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

interface Program {
  id: string;
  name: string;
  slug: string;
  universityId: string;
  degreeType: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProgramInput {
  name: string;
  slug: string;
  universityId: string;
  degreeType: string;
  duration: number;
}

interface UpdateProgramInput {
  name?: string;
  slug?: string;
  degreeType?: string;
  duration?: number;
}

interface ProgramWithRelations extends Program {
  university: {
    id: string;
    name: string;
  };
  requirements: {
    id: string;
    name: string;
    description: string;
    isMandatory: boolean;
  }[];
}

/**
 * Verify admin privileges for program operations
 */
const verifyAdminPrivileges = (currentUser: UserSession) => {
  if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.DEPARTMENT_ADMIN) {
    throw new Error('Unauthorized: Only admins can manage programs');
  }
};

/**
 * Create a new program
 */
export const createProgram = async (
  input: CreateProgramInput,
  currentUser: UserSession
): Promise<Program> => {
  verifyAdminPrivileges(currentUser);

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check if university exists
  const universityExists = await prisma.university.findUnique({
    where: { id: input.universityId }
  });

  if (!universityExists) {
    throw new Error('University not found');
  }

  // Check for existing program with same name or slug in the same university
  const existingProgram = await prisma.program.findFirst({
    where: {
      universityId: input.universityId,
      OR: [
        { name: input.name },
        { slug: input.slug }
      ]
    }
  });

  if (existingProgram) {
    if (existingProgram.name === input.name) {
      throw new Error('A program with this name already exists in this university');
    }
    if (existingProgram.slug === input.slug) {
      throw new Error('A program with this slug already exists in this university');
    }
  }

  return await prisma.program.create({
    data: {
      name: input.name,
      slug: input.slug,
      universityId: input.universityId,
      degreeType: input.degreeType,
      duration: input.duration,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
};

/**
 * Get all programs with optional relations
 */
export const getPrograms = async (
  currentUser: UserSession,
  universityId?: string,
  options?: {
    includeUniversity?: boolean;
    includeRequirements?: boolean;
  }
): Promise<ProgramWithRelations[]> => {
  verifyAdminPrivileges(currentUser);

  const whereClause = universityId ? { universityId } : {};

  return await prisma.program.findMany({
    where: whereClause,
    include: {
      university: options?.includeUniversity ? {
        select: {
          id: true,
          name: true
        }
      } : false,
      requirements: options?.includeRequirements ? {
        select: {
          id: true,
          name: true,
          description: true,
          isMandatory: true
        },
        orderBy: {
          isMandatory: 'desc',
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
 * Get program by ID with optional relations
 */
export const getProgramById = async (
  id: string,
  currentUser: UserSession,
  options?: {
    includeUniversity?: boolean;
    includeRequirements?: boolean;
  }
): Promise<ProgramWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.program.findUnique({
    where: { id },
    include: {
      university: options?.includeUniversity ? {
        select: {
          id: true,
          name: true
        }
      } : false,
      requirements: options?.includeRequirements ? {
        select: {
          id: true,
          name: true,
          description: true,
          isMandatory: true
        },
        orderBy: {
          isMandatory: 'desc',
          name: 'asc'
        }
      } : false,
    }
  });
};

/**
 * Get program by slug with optional relations
 */
export const getProgramBySlug = async (
  slug: string,
  universityId: string,
  currentUser: UserSession,
  options?: {
    includeUniversity?: boolean;
    includeRequirements?: boolean;
  }
): Promise<ProgramWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.program.findUnique({
    where: { slug, universityId },
    include: {
      university: options?.includeUniversity ? {
        select: {
          id: true,
          name: true
        }
      } : false,
      requirements: options?.includeRequirements ? {
        select: {
          id: true,
          name: true,
          description: true,
          isMandatory: true
        },
        orderBy: {
          isMandatory: 'desc',
          name: 'asc'
        }
      } : false,
    }
  });
};

/**
 * Update program
 */
export const updateProgram = async (
  id: string,
  input: UpdateProgramInput,
  currentUser: UserSession
): Promise<Program> => {
  verifyAdminPrivileges(currentUser);

  if (input.slug && !/^[a-z0-9-]+$/.test(input.slug)) {
    throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
  }

  // Check for existing program with same slug if slug is being updated
  if (input.slug) {
    const existingProgram = await prisma.program.findFirst({
      where: {
        slug: input.slug,
        NOT: { id }
      }
    });

    if (existingProgram) {
      throw new Error('A program with this slug already exists');
    }
  }

  return await prisma.program.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      degreeType: input.degreeType,
      duration: input.duration,
      updatedAt: new Date()
    }
  });
};

/**
 * Delete program and all related data
 */
export const deleteProgram = async (
  id: string,
  currentUser: UserSession
): Promise<void> => {
  verifyAdminPrivileges(currentUser);

  // Use transaction to delete all related records
  await prisma.$transaction([
    // Delete all program requirements
    prisma.programRequirement.deleteMany({
      where: {
        programId: id
      }
    }),
    // Delete the program
    prisma.program.delete({
      where: { id }
    })
  ]);
};

/**
 * Search programs by name or slug
 */
export const searchPrograms = async (
  query: string,
  universityId: string,
  currentUser: UserSession,
  limit: number = 10
): Promise<Program[]> => {
  verifyAdminPrivileges(currentUser);

  return await prisma.program.findMany({
    where: {
      universityId,
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

/**
 * Add requirement to program
 */
export const addProgramRequirement = async (
  programId: string,
  requirementData: {
    name: string;
    description: string;
    isMandatory: boolean;
  },
  currentUser: UserSession
) => {
  verifyAdminPrivileges(currentUser);

  return await prisma.programRequirement.create({
    data: {
      ...requirementData,
      programId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });
};

/**
 * Remove requirement from program
 */
export const removeProgramRequirement = async (
  requirementId: string,
  currentUser: UserSession
) => {
  verifyAdminPrivileges(currentUser);

  return await prisma.programRequirement.delete({
    where: { id: requirementId }
  });
};