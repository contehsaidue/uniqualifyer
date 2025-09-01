import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

interface UserSession {
  id: string;
  name?: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  universityId?: string;
  permissions?: any;
  department?: {
    id: string;
    name: string;
    code: string;
    universityId?: string;
  };
  university?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateDepartmentInput {
  name: string;
  code: string;
  universityId: string;
}

interface UpdateDepartmentInput {
  name?: string;
  code?: string;
  universityId?: string;
}

interface DepartmentWithRelations extends Department {
  university: {
    id: string;
    name: string;
    slug: string;
  };
  administrators: {
    id: string;
    name: string;
    email: string;
  }[];
}

interface DepartmentBase {
  id: string;
  name: string;
  code: string;
  universityId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DepartmentWithUniversity extends DepartmentBase {
  university: {
    id: string;
    name: string;
    slug: string;
  };
}

interface DepartmentWithAdministrators extends DepartmentBase {
  administrators: {
    id: string;
    name: string;
    email: string;
  }[];
}

/**
 * Verify admin privileges for department operations
 */
const verifyAdminPrivileges = (currentUser: UserSession) => {
  if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only admins can manage departments');
  }
};

/**
 * Create a new department
 */
export const createDepartment = async (
  input: CreateDepartmentInput,
  currentUser: UserSession
): Promise<Department> => {
  verifyAdminPrivileges(currentUser);

  // Only super admins can create departments
  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized: Only super admins can create departments');
  }

  // Validate code format (example: uppercase letters and numbers)
  if (!/^[A-Z0-9]+$/.test(input.code)) {
    throw new Error('Department code can only contain uppercase letters and numbers');
  }

  // Check if university exists
  const universityExists = await prisma.university.findUnique({
    where: { id: input.universityId }
  });

  if (!universityExists) {
    throw new Error('University not found');
  }

  // Check for existing department with same name or code in the same university
  const existingDepartment = await prisma.department.findFirst({
    where: {
      universityId: input.universityId,
      OR: [
        { name: input.name },
        { code: input.code }
      ]
    }
  });

  if (existingDepartment) {
    if (existingDepartment.name === input.name) {
      throw new Error('A department with this name already exists in this university');
    }
    if (existingDepartment.code === input.code) {
      throw new Error('A department with this code already exists in this university');
    }
  }

  return await prisma.department.create({
    data: {
      name: input.name,
      code: input.code,
      universityId: input.universityId
    }
  });
};

/**
 * Get all departments with optional relations
 */
export const getDepartments = async (
  currentUser: UserSession,
  options?: {
    includeUniversity?: boolean;
    includeAdministrators?: boolean;
    universityId?: string;
  }
): Promise<(DepartmentBase | DepartmentWithUniversity | DepartmentWithAdministrators | DepartmentWithRelations)[]> => {
  verifyAdminPrivileges(currentUser);

  let whereClause: any = {};

  // Department admins can only see their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (!currentUser.departmentId) {
      throw new Error('Department administrator must be assigned to a department');
    }
    whereClause.id = currentUser.departmentId;
  }

  // Filter by university if provided (for super admins)
  if (options?.universityId && currentUser.role === UserRole.SUPER_ADMIN) {
    whereClause.universityId = options.universityId;
  }

  const includeUniversity = options?.includeUniversity ?? true;
  const includeAdministrators = options?.includeAdministrators ?? true;

  // Use separate queries based on whether we need administrators
  let departments;
  if (includeAdministrators) {
    // Query with administrators and user relation included
    departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        university: includeUniversity,
        administrators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
      },
      orderBy: {
        name: 'asc'
      }
    });
  } else {
    // Query without administrators
    departments = await prisma.department.findMany({
      where: whereClause,
      include: {
        university: includeUniversity,
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  // Type guard to check if department has administrators
  const hasAdministrators = (dept: any): dept is { administrators: any[] } => {
    return 'administrators' in dept && Array.isArray(dept.administrators);
  };

  // Transform the data
  const transformedDepartments = departments.map(dept => {
    const baseDepartment = {
      id: dept.id,
      universityId: dept.universityId,
      name: dept.name,
      code: dept.code,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      university: includeUniversity && dept.university ? {
        id: dept.university.id,
        name: dept.university.name,
        slug: dept.university.slug
      } : undefined,
    };

    if (includeAdministrators && hasAdministrators(dept)) {
      return {
        ...baseDepartment,
        administrators: dept.administrators.map(admin => ({
          id: admin.user.id,
          name: admin.user.name || '',
          email: admin.user.email
        }))
      };
    }

    return baseDepartment;
  });

  // Type the return value based on included relations
  if (includeUniversity && includeAdministrators) {
    return transformedDepartments as DepartmentWithRelations[];
  } else if (includeUniversity) {
    return transformedDepartments as DepartmentWithUniversity[];
  } else if (includeAdministrators) {
    return transformedDepartments as DepartmentWithAdministrators[];
  }
  return transformedDepartments as DepartmentBase[];
};

/**
 * Get department by ID with optional relations
 */
export const getDepartmentById = async (
  id: string,
  currentUser: UserSession,
  options?: {
    includeUniversity?: boolean;
    includeAdministrators?: boolean;
  }
): Promise<DepartmentWithRelations | null> => {
  verifyAdminPrivileges(currentUser);

  // Department admins can only access their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.departmentId !== id) {
    throw new Error('Unauthorized: You can only access your own department');
  }

  const includeUniversity = options?.includeUniversity ?? true;
  const includeAdministrators = options?.includeAdministrators ?? true;

  // Use separate queries based on whether we need administrators
  let department;
  if (includeAdministrators) {
    // Query with administrators and user relation included
    department = await prisma.department.findUnique({
      where: { id },
      include: {
        university: includeUniversity,
        administrators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
      }
    });
  } else {
    // Query without administrators
    department = await prisma.department.findUnique({
      where: { id },
      include: {
        university: includeUniversity,
      }
    });
  }

  if (!department) {
    return null;
  }

  // Type guard to check if department has administrators
  const hasAdministrators = (dept: any): dept is { administrators: any[] } => {
    return 'administrators' in dept && Array.isArray(dept.administrators);
  };

  // Check if university is included and available
  if (includeUniversity && !department.university) {
    throw new Error('University not found for department');
  }

  const baseDepartment = {
    id: department.id,
    universityId: department.universityId,
    name: department.name,
    code: department.code,
    createdAt: department.createdAt,
    updatedAt: department.updatedAt,
    university: includeUniversity ? {
      id: department.university!.id, // Use non-null assertion since we checked above
      name: department.university!.name,
      slug: department.university!.slug
    } : {
      id: '',
      name: '',
      slug: ''
    },
  };

  if (includeAdministrators && hasAdministrators(department)) {
    return {
      ...baseDepartment,
      administrators: department.administrators.map(admin => ({
        id: admin.user.id,
        name: admin.user.name || '',
        email: admin.user.email
      }))
    };
  }

  return {
    ...baseDepartment,
    administrators: []
  };
};
/**
 * Update department
 */
export const updateDepartment = async (
  id: string,
  input: UpdateDepartmentInput,
  currentUser: UserSession
): Promise<Department> => {
  verifyAdminPrivileges(currentUser);

  // Only super admins can update departments
  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized: Only super admins can update departments');
  }

  if (input.code && !/^[A-Z0-9]+$/.test(input.code)) {
    throw new Error('Department code can only contain uppercase letters and numbers');
  }

  // Check for existing department with same code if code is being updated
  if (input.code) {
    const existingDepartment = await prisma.department.findFirst({
      where: {
        code: input.code,
        NOT: { id }
      }
    });

    if (existingDepartment) {
      throw new Error('A department with this code already exists');
    }
  }

  // If changing university, verify the new university exists
  if (input.universityId) {
    const universityExists = await prisma.university.findUnique({
      where: { id: input.universityId }
    });

    if (!universityExists) {
      throw new Error('University not found');
    }
  }

  return await prisma.department.update({
    where: { id },
    data: {
      ...input,
      updatedAt: new Date()
    }
  });
};

/**
 * Delete department and all related data
 */
export const deleteDepartment = async (
  id: string,
  currentUser: UserSession
): Promise<void> => {
  verifyAdminPrivileges(currentUser);

  // Only super admins can delete departments
  if (currentUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error('Unauthorized: Only super admins can delete departments');
  }

  // Check if department has any programs
  const programsCount = await prisma.program.count({
    where: { departmentId: id }
  });

  if (programsCount > 0) {
    throw new Error('Cannot delete department with existing programs');
  }

  // Check if department has any administrators
  const adminCount = await prisma.departmentAdministrator.count({
    where: { departmentId: id }
  });

  // Use transaction to delete all related records
  await prisma.$transaction(async (tx) => {
    // Delete all department administrators if they exist
    if (adminCount > 0) {
      await tx.departmentAdministrator.deleteMany({
        where: { departmentId: id }
      });
    }
    
    // Delete the department
    await tx.department.delete({
      where: { id }
    });
  });
};

/**
 * Search departments by name or code
 */
export const searchDepartments = async (
  query: string,
  universityId: string,
  currentUser: UserSession,
  limit: number = 10
): Promise<Department[]> => {
  verifyAdminPrivileges(currentUser);

  // Department admins can only search within their university
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (currentUser.universityId !== universityId) {
      throw new Error('Unauthorized: You can only search departments in your university');
    }
  }

  return await prisma.department.findMany({
    where: {
      universityId,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { code: { contains: query, mode: 'insensitive' } }
      ]
    },
    take: limit,
    orderBy: {
      name: 'asc'
    }
  });
};

/**
 * Get department administrators
 */
export const getDepartmentAdministrators = async (
  departmentId: string,
  currentUser: UserSession
) => {
  verifyAdminPrivileges(currentUser);

  // Department admins can only access their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.departmentId !== departmentId) {
    throw new Error('Unauthorized: You can only access your own department');
  }

  const administrators = await prisma.departmentAdministrator.findMany({
    where: { departmentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    },
    orderBy: {
      user: {
        name: 'asc'
      }
    }
  });

  return administrators.map(admin => ({
    id: admin.user.id,
    name: admin.user.name || '',
    email: admin.user.email,
    role: admin.user.role
  }));
};