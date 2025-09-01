import { ProgramRequirement, RequirementType, UserRole } from "@prisma/client";
import prisma from '@/lib/prisma';

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

export interface GetProgramRequirementsOptions {
  includeProgram?: boolean;
  includeDepartment?: boolean;
  includeUniversity?: boolean;
  universityId?: string;
  departmentId?: string;
  programId?: string;
}

export interface CreateProgramRequirementData {
  programId: string;
  type: RequirementType;
  subject?: string;
  minGrade?: string;
  description: string;
}

export interface UpdateProgramRequirementData {
  type?: RequirementType;
  subject?: string;
  minGrade?: string;
  description?: string;
}

/**
 * Get program requirements with filtering options
 */
export async function getProgramRequirements(
  currentUser: UserSession,
  options: GetProgramRequirementsOptions = {}
): Promise<ProgramRequirement[]> {
  const {
    includeProgram = false,
    includeDepartment = false,
    includeUniversity = false,
    universityId,
    departmentId,
    programId
  } = options;

  // Build where clause based on user permissions and filters
  const where: any = {};

  if (programId) {
    where.programId = programId;
  }

  // For department admins, only show requirements from their department
  if (currentUser.role === "DEPARTMENT_ADMINISTRATOR" && currentUser.department?.id) {
    where.program = {
      departmentId: currentUser.department.id
    };
  }

  // If university filter is provided
  if (universityId) {
    where.program = {
      ...where.program,
      department: {
        universityId: universityId
      }
    };
  }

  // If department filter is provided
  if (departmentId) {
    where.program = {
      ...where.program,
      departmentId: departmentId
    };
  }

  return prisma.programRequirement.findMany({
    where,
    include: {
      program: includeProgram ? {
        include: {
          department: includeDepartment ? {
            include: {
              university: includeUniversity
            }
          } : false
        }
      } : false
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

/**
 * Create a new program requirement
 */
export async function createProgramRequirement(
  data: CreateProgramRequirementData,
  currentUser: UserSession,
): Promise<ProgramRequirement> {
  // Verify user has permission to add requirements to this program
  const program = await prisma.program.findUnique({
    where: { id: data.programId },
    include: {
      department: true
    }
  });

  if (!program) {
    throw new Error("Program not found");
  }

  // Department admins can only add requirements to programs in their department
  if (currentUser.role === "DEPARTMENT_ADMINISTRATOR") {
    if (currentUser.department?.id !== program.departmentId) {
      throw new Error("You don't have permission to add requirements to this program");
    }
  }

  return prisma.programRequirement.create({
    data: {
      programId: data.programId,
      type: data.type,
      subject: data.subject || null,
      minGrade: data.minGrade || null,
      description: data.description
    }
  });
}

/**
 * Update an existing program requirement
 */
export async function updateProgramRequirement(
  id: string,
  data: UpdateProgramRequirementData,
  currentUser: UserSession,
): Promise<ProgramRequirement> {
  // First get the requirement to check permissions
  const requirement = await prisma.programRequirement.findUnique({
    where: { id },
    include: {
      program: {
        include: {
          department: true
        }
      }
    }
  });

  if (!requirement) {
    throw new Error("Requirement not found");
  }

  // Department admins can only update requirements in their department
  if (currentUser.role === "DEPARTMENT_ADMINISTRATOR") {
    if (currentUser.department?.id !== requirement.program.departmentId) {
      throw new Error("You don't have permission to update this requirement");
    }
  }

  return prisma.programRequirement.update({
    where: { id },
    data: {
      type: data.type,
      subject: data.subject !== undefined ? data.subject : null,
      minGrade: data.minGrade !== undefined ? data.minGrade : null,
      description: data.description
    }
  });
}

/**
 * Delete a program requirement
 */
export async function deleteProgramRequirement(
  id: string,
  currentUser: UserSession,
): Promise<void> {
  // First get the requirement to check permissions
  const requirement = await prisma.programRequirement.findUnique({
    where: { id },
    include: {
      program: {
        include: {
          department: true
        }
      }
    }
  });

  if (!requirement) {
    throw new Error("Requirement not found");
  }

  // Department admins can only delete requirements in their department
  if (currentUser.role === "DEPARTMENT_ADMINISTRATOR") {
    if (currentUser.department?.id !== requirement.program.departmentId) {
      throw new Error("You don't have permission to delete this requirement");
    }
  }

  await prisma.programRequirement.delete({
    where: { id }
  });
}

/**
 * Get requirements for a specific program
 */
export async function getRequirementsByProgramId(
  programId: string,
 currentUser: UserSession,
): Promise<ProgramRequirement[]> {
  // Verify the program exists and user has access
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      department: true
    }
  });

  if (!program) {
    throw new Error("Program not found");
  }

  // Department admins can only view requirements from their department
  if (currentUser.role === "DEPARTMENT_ADMINISTRATOR") {
    if (currentUser.department?.id !== program.departmentId) {
      throw new Error("You don't have permission to view these requirements");
    }
  }

  return prisma.programRequirement.findMany({
    where: { programId },
    orderBy: {
      createdAt: 'desc'
    }
  });
}