import prisma from '~/lib/prisma.server';
import { UserRole, RequirementType } from '@prisma/client';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: UserRole;
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

interface Program {
  id: string;
  name: string;
  departmentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProgramInput {
  name: string;
  departmentId: string;
}

interface UpdateProgramInput {
  name?: string;
  departmentId?: string;
}

interface ProgramWithRelations extends Program {
  department?: {
    id: string;
    name: string;
    code: string;
    university?: {
      id: string;
      name: string;
      slug: string; 
    };
  };
  requirements: {
    id: string;
    type: RequirementType;
    subject: string | null;
    minGrade: string | null;
    description: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

interface ProgramRequirementInput {
  type: RequirementType;
  subject?: string;
  minGrade?: string;
  description: string;
}

interface ProgramBase {
  id: string;
  name: string;
  departmentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}


interface RequirementForRelation {
  id: string;
  type: RequirementType; 
  subject: string | null;
  minGrade: string | null;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProgramWithUniversity extends ProgramBase {
  department?: {
    id: string;
    name: string;
    code: string; // Add code property
    university?: {
      id: string;
      name: string;
      slug: string; // Add slug property
    };
  };
  requirements: undefined;
}

interface ProgramWithRequirements extends ProgramBase {
  department: undefined;
  requirements: RequirementForRelation[];
}

/**
 * Verify admin privileges for program operations
 */
const verifyAdminPrivileges = (currentUser: UserSession) => {
  if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only admins can manage programs');
  }
};

/**
 * Verify department admin has access to the program
 */
const verifyDepartmentAdminAccess = async (currentUser: UserSession, programId: string) => {
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { departmentId: true }
    });

    if (!program || program.departmentId !== currentUser.department?.id) {
      throw new Error('Unauthorized: You can only manage programs in your department');
    }
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

  // For department admins, verify they're creating a program in their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (!input.departmentId || input.departmentId !== currentUser.department?.id) {
      throw new Error('Unauthorized: You can only create programs in your department');
    }
    
    // Verify the department exists and belongs to the user's university
    const department = await prisma.department.findUnique({
      where: { id: input.departmentId },
      select: { universityId: true }
    });

    if (!department || (currentUser.university?.id && department.universityId !== currentUser.university?.id)) {
      throw new Error('Department does not belong to your university');
    }
  }

  // If departmentId is provided, check if department exists
  if (input.departmentId) {
    const departmentExists = await prisma.department.findUnique({
      where: { id: input.departmentId }
    });

    if (!departmentExists) {
      throw new Error('Department not found');
    }
  }

  // Check for existing program with same name in the same department
  const existingProgram = await prisma.program.findFirst({
    where: {
      departmentId: input.departmentId,
      name: input.name
    }
  });

  if (existingProgram) {
    throw new Error('A program with this name already exists in this department');
  }

  return await prisma.program.create({
    data: {
      name: input.name,
      departmentId: input.departmentId,
    }
  });
};

/**
 * Get all programs with optional relations
 */
export const getPrograms = async (
  currentUser: UserSession,
  options?: {
    includeUniversity?: boolean;
    includeRequirements?: boolean;
    includeDepartment?: boolean;
    universityId?: string;
    departmentId?: string;
  }
): Promise<(ProgramBase | ProgramWithUniversity | ProgramWithRequirements | ProgramWithRelations)[]> => {
  verifyAdminPrivileges(currentUser);

  let whereClause: any = {};

  // Department admin should only see programs from their specific department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.department?.id) {
    whereClause.departmentId = currentUser.department?.id;
  }
  
  // Filter by specific university if provided (through department relation)
  if (options?.universityId) {
    whereClause.department = {
      universityId: options.universityId
    };
  }
  
  // Filter by specific department if provided
  if (options?.departmentId) {
    whereClause.departmentId = options.departmentId;
  }

  const includeUniversity = options?.includeUniversity ?? false;
  const includeRequirements = options?.includeRequirements ?? true;
  const includeDepartment = options?.includeDepartment ?? false;

  const programs = await prisma.program.findMany({
    where: whereClause,
    include: {
      department: includeDepartment || includeUniversity ? {
        select: {
          id: true,
          name: true,
          code: true,
          university: includeUniversity ? {
            select: {
              id: true,
              name: true,
              slug: true
            }
          } : false
        }
      } : false,
      requirements: includeRequirements ? {
        select: {
          id: true,
          type: true,
          subject: true,
          minGrade: true,
          description: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      } : false,
    },
    orderBy: {
      name: 'asc'
    }
  });

  const transformedPrograms = programs.map(prog => ({
    id: prog.id,
    departmentId: prog.departmentId || undefined,
    name: prog.name,
    createdAt: prog.createdAt,
    updatedAt: prog.updatedAt,
    department: (includeDepartment || includeUniversity) && prog.department ? {
      id: prog.department.id,
      name: prog.department.name,
      code: prog.department.code, // This was causing the error
      university: includeUniversity && prog.department.university ? {
        id: prog.department.university?.id,
        name: prog.department.university?.name,
        slug: prog.department.university?.slug
      } : undefined
    } : undefined,
    requirements: includeRequirements ? prog.requirements : undefined 
  }));

  // Fix the type casting - remove "unknown" and use proper types
  if (includeUniversity && includeDepartment) {
    return transformedPrograms as ProgramWithRelations[];
  } else if (includeUniversity) {
    return transformedPrograms as ProgramWithUniversity[];
  } else if (includeRequirements) {
    return transformedPrograms as ProgramWithRequirements[];
  }
  return transformedPrograms as ProgramBase[];
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
    includeDepartment?: boolean;
  }
): Promise<ProgramWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  const includeUniversity = options?.includeUniversity ?? false;
  const includeRequirements = options?.includeRequirements ?? false;
  const includeDepartment = options?.includeDepartment ?? false;

  const program = await prisma.program.findUnique({
    where: { id },
    include: {
      department: includeDepartment || includeUniversity ? {
        select: {
          id: true,
          name: true,
          code: true,
          university: includeUniversity ? {
            select: {
              id: true,
              name: true,
              slug: true
            }
          } : false
        }
      } : false,
      requirements: includeRequirements ? {
        select: {
          id: true,
          type: true,
          subject: true,
          minGrade: true,
          description: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      } : false,
    }
  });

  if (!program) {
    return null;
  }

  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    await verifyDepartmentAdminAccess(currentUser, program.id);
  }

  // Transform the program to match the expected return type
  const transformedProgram: ProgramWithRelations = {
    ...program,
    department: program.department ? {
      id: program.department.id,
      name: program.department.name,
      ...(program.department.university && {
        university: {
          id: program.department.university.id,
          name: program.department.university.name
        }
      })
    } : undefined,
    requirements: program.requirements || []
  };

  return transformedProgram;
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

  // First get the program to verify access
  const program = await prisma.program.findUnique({
    where: { id },
    select: { departmentId: true }
  });

  if (!program) {
    throw new Error('Program not found');
  }

  await verifyDepartmentAdminAccess(currentUser, id);

  // For department admins, prevent changing department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && input.departmentId) {
    if (input.departmentId !== program.departmentId) {
      throw new Error('Unauthorized: You cannot change the department of a program');
    }
  }

  // If changing department, verify the new department exists
  if (input.departmentId && input.departmentId !== program.departmentId) {
    const departmentExists = await prisma.department.findUnique({
      where: { id: input.departmentId }
    });

    if (!departmentExists) {
      throw new Error('Department not found');
    }
  }

  return await prisma.program.update({
    where: { id },
    data: {
      ...input,
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

  // First get the program to verify access
  const program = await prisma.program.findUnique({
    where: { id },
    select: { departmentId: true }
  });

  if (!program) {
    throw new Error('Program not found');
  }

  await verifyDepartmentAdminAccess(currentUser, id);

  // Use transaction to delete all related records
  await prisma.$transaction([
    // Delete all program requirements
    prisma.programRequirement.deleteMany({
      where: { programId: id }
    }),
    // Delete all applications to this program
    prisma.application.deleteMany({
      where: { programId: id }
    }),
    // Delete the program
    prisma.program.delete({
      where: { id }
    })
  ]);
};

/**
 * Add requirement to program
 */
export const addProgramRequirement = async (
  programId: string,
  requirementData: ProgramRequirementInput,
  currentUser: UserSession
) => {
  verifyAdminPrivileges(currentUser);
  await verifyDepartmentAdminAccess(currentUser, programId);

  return await prisma.programRequirement.create({
    data: {
      programId,
      type: requirementData.type,
      subject: requirementData.subject || null,
      minGrade: requirementData.minGrade || null,
      description: requirementData.description
    }
  });
};

/**
 * Update program requirement
 */
export const updateProgramRequirement = async (
  requirementId: string,
  requirementData: Partial<ProgramRequirementInput>,
  currentUser: UserSession
) => {
  verifyAdminPrivileges(currentUser);

  // First get the requirement with program to verify access
  const requirement = await prisma.programRequirement.findUnique({
    where: { id: requirementId },
    include: { program: true }
  });

  if (!requirement) {
    throw new Error('Requirement not found');
  }

  await verifyDepartmentAdminAccess(currentUser, requirement.program.id);

  return await prisma.programRequirement.update({
    where: { id: requirementId },
    data: {
      ...requirementData,
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

  // First get the requirement with program to verify access
  const requirement = await prisma.programRequirement.findUnique({
    where: { id: requirementId },
    include: { program: true }
  });

  if (!requirement) {
    throw new Error('Requirement not found');
  }

  await verifyDepartmentAdminAccess(currentUser, requirement.program.id);

  return await prisma.programRequirement.delete({
    where: { id: requirementId }
  });
};

/**
 * Search programs by name within a university or department
 */
export const searchPrograms = async (
  query: string,
  currentUser: UserSession,
  universityId?: string,
  departmentId?: string,
  limit: number = 10
): Promise<Program[]> => {
  verifyAdminPrivileges(currentUser);

  let whereClause: any = {
    name: { contains: query, mode: 'insensitive' }
  };

  // Department admin should only search programs in their department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.department?.id) {
    whereClause.departmentId = currentUser.department?.id;
  } else {
    // For super admins, filter by university/department if provided
    if (universityId) {
      whereClause.department = {
        universityId: universityId
      };
    }
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
  }

  return await prisma.program.findMany({
    where: whereClause,
    take: limit,
    orderBy: {
      name: 'asc'
    }
  });
};