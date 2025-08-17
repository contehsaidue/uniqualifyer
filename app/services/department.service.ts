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
  };
  administrators: {
    id: string;
    name: string;
    email: string;
  }[];
}

// Update the interfaces first
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
      universityId: input.universityId,
      createdAt: new Date(),
      updatedAt: new Date()
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
  }
): Promise<(DepartmentBase | DepartmentWithUniversity | DepartmentWithAdministrators | DepartmentWithRelations)[]> => {
  verifyAdminPrivileges(currentUser);

  // Department admins can only see their own department
  const whereClause = currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.departmentId
    ? { id: currentUser.departmentId }
    : {};

  const departments = await prisma.department.findMany({
    where: whereClause,
    include: {
      university: options?.includeUniversity ? {
        select: {
          id: true,
          name: true
        }
      } : false,
      administrators: options?.includeAdministrators ? {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      } : false,
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Transform the data to match expected return types
  const transformedDepartments = departments.map(dept => ({
    ...dept,
    university: options?.includeUniversity ? dept.university : undefined,
    administrators: options?.includeAdministrators 
      ? dept.administrators?.map(admin => ({
          id: admin.user.id,
          name: admin.user.name,
          email: admin.user.email
        })) 
      : undefined
  }));

  // Properly type the return value based on the options
  if (options?.includeUniversity && options?.includeAdministrators) {
    return transformedDepartments as DepartmentWithRelations[];
  } else if (options?.includeUniversity) {
    return transformedDepartments as DepartmentWithUniversity[];
  } else if (options?.includeAdministrators) {
    return transformedDepartments as DepartmentWithAdministrators[];
  } else {
    return transformedDepartments as DepartmentBase[];
  }
};

/**
 * Get department by ID with optional relations
 */

type DepartmentWithOptions<T extends {
  includeUniversity?: boolean;
  includeAdministrators?: boolean;
}> = DepartmentBase &
  (T['includeUniversity'] extends true ? { university: { id: string; name: string } } : {}) &
  (T['includeAdministrators'] extends true ? { administrators: { id: string; name: string; email: string }[] } : {});

export const getDepartmentById = async <T extends {
  includeUniversity?: boolean;
  includeAdministrators?: boolean;
}>(
  id: string,
  currentUser: UserSession,
  options?: T
): Promise<DepartmentWithOptions<T> | null> => {
  verifyAdminPrivileges(currentUser);

  // Department admins can only access their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.departmentId !== id) {
    throw new Error('Unauthorized: You can only access your own department');
  }

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      university: options?.includeUniversity ? {
        select: {
          id: true,
          name: true
        }
      } : false,   
    }
  });

  return department as DepartmentWithOptions<T> | null;
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

  // Department admins can only update their own department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR && currentUser.departmentId !== id) {
    throw new Error('Unauthorized: You can only update your own department');
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

  return await prisma.department.update({
    where: { id },
    data: {
      name: input.name,
      code: input.code,
      universityId: input.universityId,
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

  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Department admins cannot delete departments');
  }

  // Use transaction to delete all related records
  await prisma.$transaction([
    // Delete all department administrators
    prisma.departmentAdministrator.deleteMany({
      where: {
        departmentId: id
      }
    }),
    // Delete the department
    prisma.department.delete({
      where: { id }
    })
  ]);
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

  return await prisma.departmentAdministrator.findMany({
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
};