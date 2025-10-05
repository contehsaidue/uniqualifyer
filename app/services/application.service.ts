import prisma from '~/lib/prisma.server';
import { $Enums, ApplicationStatus, RequirementType, UserRole } from '@prisma/client';

interface UserSession {
  id: string;
  name?: string; 
  email: string;
  role: UserRole;
  student?: {
    id: string;
  };
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

// Base interfaces
interface ApplicationBase {
  id: string;
  studentId: string;
  programId: string;
  status: ApplicationStatus;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Qualification {
  type: $Enums.QualificationType;
  subject: string;
  grade: string;
  verified: boolean;
}

// User and student related interfaces
interface UserBase {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
}

interface StudentProfile {
  id: string;
  user: UserBase;
  qualifications?: Qualification[];
}

// Program and university hierarchy
interface University {
  id: string;
  name: string;
  slug: string;
}

interface Department {
  id: string;
  name: string;
  university: University;
}

interface ProgramRequirement {
  type: RequirementType;
  subject: string;
  minGrade: string;
  description: string;
}

interface Program {
  id: string;
  name: string;
  department: Department;
  requirements?: ProgramRequirement[];
}

// Note interface
interface ApplicationNote {
  id: string;
  content: string;
  internalOnly: boolean;
  createdAt: Date;
  author: UserBase;
}

// Application composition interfaces
interface ApplicationWithStudent extends ApplicationBase {
  student: StudentProfile;
}

interface ApplicationWithProgram extends ApplicationBase {
  program: Program;
}

interface ApplicationWithRelations extends ApplicationBase {
  student: StudentProfile;
  program: Program;
  notes: ApplicationNote[];
}

// Input interfaces
interface CreateApplicationInput {
  userId: string;
  programId: string;
  status?: ApplicationStatus;
}

interface UpdateApplicationInput {
  status?: ApplicationStatus;
}

/**
 * Verify user privileges for application operations
 */
const verifyApplicationAccess = async (applicationId: string, currentUser: UserSession): Promise<void> => {
  if (currentUser.role === UserRole.STUDENT) {
    // Students can only access their own applications
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { studentId: true }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Get the student record for the current user
    const student = await prisma.student.findUnique({
      where: { userId: currentUser.id },
      select: { id: true }
    });

    if (!student) {
      throw new Error('Student record not found');
    }

    if (application.studentId !== student.id) {
      throw new Error('Unauthorized: You can only access your own applications');
    }
  } else if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    // Department admins can only access applications in their department
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        program: {
          include: {
            department: true
          }
        }
      }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.program.departmentId !== currentUser.department?.id) {
      throw new Error('Unauthorized: You can only access applications in your department');
    }
  }
  // Super admins have access to all applications
};

/**
 * Add note to application
 */
export const addNoteToApplication = async (
  applicationId: string,
  content: string,
  currentUser: UserSession,
  internalOnly: boolean = true
): Promise<{ id: string; content: string }> => {
  // Verify access
  if (currentUser.role === UserRole.STUDENT) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { studentId: true }
    });

    if (!application || application.studentId !== currentUser.student?.id) {
      throw new Error('Unauthorized: You can only add notes to your own applications');
    }
  }

  // Only admins can add internal notes
  if (internalOnly && currentUser.role === UserRole.STUDENT) {
    throw new Error('Unauthorized: Students cannot add internal notes');
  }

  const note = await prisma.note.create({
    data: {
      applicationId,
      authorId: currentUser.id,
      content,
      internalOnly
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'NOTE_ADDED',
      entityId: note.id,
      entityType: 'Note',
      userId: currentUser.id,
      metadata: {
        applicationId,
        internalOnly
      }
    }
  });

  return {
    id: note.id,
    content: note.content
  };
};

/**
 * Get all applications with optional filters
 */
export const getApplications = async (
  currentUser: UserSession,
  options?: {
    includeStudent?: boolean;
    includeProgram?: boolean;
    status?: ApplicationStatus;
    programId?: string;
    studentId?: string;
    departmentId?: string;
    page?: number;
    limit?: number;
  }
): Promise<{
  applications: (ApplicationBase | ApplicationWithStudent | ApplicationWithProgram | ApplicationWithRelations)[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  let whereClause: any = {};

  // Students can only see their own applications
  if (currentUser.role === UserRole.STUDENT) {
    if (!currentUser.student?.id) {
      throw new Error('Student must have a student profile');
    }
    whereClause.studentId = currentUser.student.id;
  }

  // Department admins can only see applications in their department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (!currentUser.department?.id) {
      throw new Error('Department administrator must be assigned to a department');
    }
    whereClause.program = {
      departmentId: currentUser.department.id
    };
  }

  // Apply filters
  if (options?.status) {
    whereClause.status = options.status;
  }
  if (options?.programId) {
    whereClause.programId = options.programId;
  }
  if (options?.studentId) {
    whereClause.studentId = options.studentId;
  }
  if (options?.departmentId && currentUser.role === UserRole.SUPER_ADMIN) {
    whereClause.program = {
      departmentId: options.departmentId
    };
  }

  const includeStudent = options?.includeStudent ?? false;
  const includeProgram = options?.includeProgram ?? false;

  // Pagination
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: whereClause,
      include: {
        student: includeStudent ? {
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
        program: includeProgram ? {
          include: {
            department: {
              include: {
                university: true
              }
            }
          }
        } : false,
        notes: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.application.count({ where: whereClause })
  ]);

  // Transform the data to match our interfaces
  const transformedApplications = applications.map(app => {
    const baseApplication = {
      id: app.id,
      studentId: app.studentId,
      programId: app.programId,
      status: app.status,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    };

    if (includeStudent && includeProgram) {
      return {
        ...baseApplication,
        student: {
          id: app.student!.id,
          user: {
            id: app.student!.user.id,
            name: app.student!.user.name,
            email: app.student!.user.email
          }
        },
        program: {
          id: app.program!.id,
          name: app.program!.name,
          department: {
            id: app.program!.department.id,
            name: app.program!.department.name,
            university: {
              id: app.program!.department.university.id,
              name: app.program!.department.university.name,
              slug: app.program!.department.university.slug
            }
          }
        },
        notes: app.notes.map(n => ({
          id: n.id,
          content: n.content,
          internalOnly: n.internalOnly,
          createdAt: n.createdAt,
          author: {
            id: n.author.id,
            name: n.author.name,
            email: n.author.email
          }
        }))
      } as ApplicationWithRelations;
    } else if (includeStudent) {
      return {
        ...baseApplication,
        student: {
          id: app.student!.id,
          user: {
            id: app.student!.user.id,
            name: app.student!.user.name,
            email: app.student!.user.email
          }
        }
      } as ApplicationWithStudent;
    } else if (includeProgram) {
      return {
        ...baseApplication,
        program: {
          id: app.program!.id,
          name: app.program!.name,
          department: {
            id: app.program!.department.id,
            name: app.program!.department.name,
            university: {
              id: app.program!.department.university.id,
              name: app.program!.department.university.name,
              slug: app.program!.department.university.slug
            }
          }
        }
      } as ApplicationWithProgram;
    }

    return baseApplication as ApplicationBase;
  });

  return {
    applications: transformedApplications,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get applications by student ID
 */
export const getApplicationsByStudentId = async (
  userId: string,
  currentUser: UserSession,
  options?: {
    includeProgram?: boolean;
    includeNotes?: boolean; // Add this option
    status?: ApplicationStatus | ApplicationStatus[]; 
    page?: number;
    limit?: number;
  }
): Promise<{
  applications: (ApplicationBase | (ApplicationWithProgram & { notes?: ApplicationNote[] }))[];
  total: number;
  page: number;
  totalPages: number;
}> => {
  // Authorization checks (existing code remains the same)
  if (currentUser.role === UserRole.STUDENT) {
    if (currentUser?.id !== userId) {
      throw new Error('Unauthorized: You can only access your own applications');
    }
  } else if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    // Department admins can only access applications in their department
  }

  const student = await prisma.student.findUnique({
    where: { userId: userId },
    select: { id: true }
  });

  if (!student) {
    throw new Error("Student record not found for this user");
  }

  const studentId = student.id;
  let whereClause: any = { studentId };

  // Department admin check (existing code)
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    if (!currentUser.department?.id) {
      throw new Error('Department administrator must be assigned to a department');
    }
    whereClause.program = {
      departmentId: currentUser.department.id
    };
  }

  if (options?.status) {
    if (Array.isArray(options.status)) {
      whereClause.status = { in: options.status };
    } else {
      whereClause.status = options.status;
    }
  }

  const includeProgram = options?.includeProgram ?? true;
  const includeNotes = options?.includeNotes ?? false; 

  // Pagination
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 10;
  const skip = (page - 1) * limit;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: whereClause,
      include: {
        program: includeProgram ? {
          include: {
            department: {
              include: {
                university: true
              }
            }
          }
        } : false,
        notes: includeNotes ? {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        } : false,
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    }),
    prisma.application.count({ where: whereClause })
  ]);

  // Transform the data
  const transformedApplications = applications.map(app => {
    const baseApplication = {
      id: app.id,
      studentId: app.studentId,
      programId: app.programId,
      status: app.status,
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    };

    const result: any = { ...baseApplication };

    if (includeProgram && app.program) {
      result.program = {
        id: app.program.id,
        name: app.program.name,
        department: {
          id: app.program.department.id,
          name: app.program.department.name,
          university: {
            id: app.program.department.university.id,
            name: app.program.department.university.name,
            slug: app.program.department.university.slug
          }
        }
      };
    }

    if (includeNotes) {
      result.notes = app.notes.map(note => ({
        id: note.id,
        content: note.content,
        internalOnly: note.internalOnly,
        createdAt: note.createdAt,
        author: {
          id: note.author.id,
          name: note.author.name,
          email: note.author.email,
          role: note.author.role
        }
      }));
    }

    return result;
  });

  return {
    applications: transformedApplications,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get application by ID
 */
export const getApplicationById = async (
  id: string,
  currentUser: UserSession,
  options?: {
    includeStudent?: boolean;
    includeProgram?: boolean;
  }
): Promise<ApplicationWithRelations | null> => {
  await verifyApplicationAccess(id, currentUser);

  const includeStudent = options?.includeStudent ?? true;
  const includeProgram = options?.includeProgram ?? true;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      student: includeStudent ? {
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
      program: includeProgram ? {
        include: {
          department: {
            include: {
              university: true
            }
          }
        }
      } : false,
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!application) {
    return null;
  }

  return {
    id: application.id,
    studentId: application.studentId,
    programId: application.programId,
    status: application.status,
    submittedAt: application.submittedAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    student: includeStudent ? {
      id: application.student!.id,
      user: {
        id: application.student!.user.id,
        name: application.student!.user.name,
        email: application.student!.user.email
      }
    } : {
      id: application.studentId,
      user: { id: '', name: '', email: '' }
    },
    program: includeProgram ? {
      id: application.program!.id,
      name: application.program!.name,
      department: {
        id: application.program!.department.id,
        name: application.program!.department.name,
        university: {
          id: application.program!.department.university.id,
          name: application.program!.department.university.name,
          slug: application.program!.department.university.slug
        }
      }
    } : {
      id: application.programId,
      name: '',
      department: { id: '', name: '', university: { id: '', name: '', slug: '' } }
    },
    notes: application.notes.map(n => ({
      id: n.id,
      content: n.content,
      internalOnly: n.internalOnly,
      createdAt: n.createdAt,
      author: {
        id: n.author.id,
        name: n.author.name,
        email: n.author.email
      }
    }))
  };
};

/**
 * Verify if student can apply to program
 */
export const canStudentApply = async (
  userId: string,
  programId: string
): Promise<{ canApply: boolean; reasons?: string[] }> => {
  console.log("canStudentApply called with:", { userId, programId });

  const student = await prisma.student.findUnique({
    where: { userId: userId },
    select: { id: true }
  });

  console.log("Student found:", student);

  if (!student) {
    return { canApply: false, reasons: ['Student profile not found'] };
  }

  const existingApplication = await prisma.application.findFirst({
    where: {
      studentId: student.id,
      programId: programId,
      status: {
        in: [ApplicationStatus.DRAFT, ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW]
      }
    },
    include: {
      program: {
        select: {
          name: true,
          department: {
            include: {
              university: {
                select: { name: true }
              }
            }
          }
        }
      }
    }
  });

  console.log("Existing application check:", {
    lookingForProgram: programId,
    foundApplication: existingApplication ? {
      programId: existingApplication.programId,
      programName: existingApplication.program.name,
      university: existingApplication.program.department.university.name,
      status: existingApplication.status
    } : 'none'
  });

  if (existingApplication) {
    return { 
      canApply: false, 
      reasons: [`Already has a ${existingApplication.status} application for ${existingApplication.program.name} at ${existingApplication.program.department.university.name}`] 
    };
  }

  return { canApply: true };
};
/**
 * Create a new application
 */
export const createApplication = async (
  input: CreateApplicationInput,
  currentUser: UserSession
): Promise<{ id: string; studentId: string; programId: string; status: ApplicationStatus }> => {

  // Check if program exists
  const programExists = await prisma.program.findUnique({
    where: { id: input.programId }
  });

  if (!programExists) {
    throw new Error('Program not found');
  }

  // Check if student exists and get student ID
  const student = await prisma.student.findUnique({
    where: { userId: input.userId },
    select: { id: true, userId: true }
  });

  if (!student) {
    throw new Error('Student not found');
  }

  // Authorization: Students can only create applications for themselves
  if (currentUser.role === UserRole.STUDENT) {
    if (currentUser.id !== student.userId) {
      throw new Error('Unauthorized: You can only create applications for yourself');
    }
  }
  
  // Department admins can only create applications for students in their department
  if (currentUser.role === UserRole.DEPARTMENT_ADMINISTRATOR) {
    const admin = await prisma.departmentAdministrator.findUnique({
      where: { userId: currentUser.id },
      include: { department: true }
    });
    
    if (!admin || !admin.department) {
      throw new Error('Department administrator not found or no department assigned');
    }
    
    // Check if the program belongs to the admin's department
    const programInDepartment = await prisma.program.findFirst({
      where: {
        id: input.programId,
        departmentId: admin.department.id
      }
    });
    
    if (!programInDepartment) {
      throw new Error('Unauthorized: You can only create applications for programs in your department');
    }
  }

  // Check for existing application for the same program
  const existingApplication = await prisma.application.findFirst({
    where: {
      studentId: student.id, 
      programId: input.programId,
      status: {
        in: [ApplicationStatus.DRAFT, ApplicationStatus.PENDING, ApplicationStatus.UNDER_REVIEW]
      }
    }
  });

  if (existingApplication) {
    throw new Error('An active application already exists for this program');
  }

  const application = await prisma.application.create({
    data: {
      studentId: student.id, 
      programId: input.programId,
      status: input.status || ApplicationStatus.DRAFT,
      submittedAt: input.status === ApplicationStatus.PENDING ? new Date() : null
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'APPLICATION_CREATED',
      entityId: application.id,
      entityType: 'Application',
      userId: currentUser.id,
      metadata: {
        programId: input.programId,
        status: application.status
      }
    }
  });

  // Return simplified application object
  return {
    id: application.id,
    studentId: application.studentId,
    programId: application.programId,
    status: application.status
  };
};

/**
 * Submit application (change status from DRAFT to PENDING)
 */
export const submitApplication = async (
  id: string,
  currentUser: UserSession
): Promise<{ id: string; studentId: string; programId: string; status: ApplicationStatus; submittedAt: Date }> => {
  // Verify access for students
  if (currentUser.role === UserRole.STUDENT) {
    // First, get the student record for the current user
    const student = await prisma.student.findUnique({
      where: { userId: currentUser.id },
      select: { id: true }
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    // Then check if the application belongs to this student
    const application = await prisma.application.findUnique({
      where: { id },
      select: { studentId: true }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Use the student.id from the database query, not currentUser.student?.id
    if (application.studentId !== student.id) {
      throw new Error('Unauthorized: You can only submit your own applications');
    }
  }

  const application = await prisma.application.update({
    where: {
      id,
      status: ApplicationStatus.DRAFT
    },
    data: {
      status: ApplicationStatus.PENDING,
      submittedAt: new Date()
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'APPLICATION_SUBMITTED',
      entityId: id,
      entityType: 'Application',
      userId: currentUser.id,
      metadata: {
        programId: application.programId
      }
    }
  });

  return {
    id: application.id,
    studentId: application.studentId,
    programId: application.programId,
    status: application.status,
    submittedAt: application.submittedAt!
  };
};
/**
 * Update application
 */
export const updateApplication = async (
  id: string,
  input: UpdateApplicationInput,
  currentUser: UserSession
): Promise<ApplicationWithRelations> => {
  await verifyApplicationAccess(id, currentUser);

  // Only students can update their own applications (unless submitted)
  if (currentUser.role === UserRole.STUDENT) {
    const existingApplication = await prisma.application.findUnique({
      where: { id },
      select: { status: true }
    });

    if (existingApplication?.status !== ApplicationStatus.DRAFT) {
      throw new Error('Cannot update application after submission');
    }
  }

  const updateData: any = { ...input };

  // Set submittedAt if changing from draft to pending
  if (input.status === ApplicationStatus.PENDING) {
    updateData.submittedAt = new Date();
  }

  const application = await prisma.application.update({
    where: { id },
    data: updateData,
    include: {
      student: {
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
      program: {
        include: {
          department: {
            include: {
              university: true
            }
          }
        }
      },
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGED',
      entityId: id,
      entityType: 'Application',
      userId: currentUser.id,
      metadata: {
        newStatus: input.status
      }
    }
  });

  return {
    id: application.id,
    studentId: application.studentId,
    programId: application.programId,
    status: application.status,
    submittedAt: application.submittedAt,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    student: {
      id: application.student.id,
      user: {
        id: application.student.user.id,
        name: application.student.user.name,
        email: application.student.user.email
      }
    },
    program: {
      id: application.program.id,
      name: application.program.name,
      department: {
        id: application.program.department.id,
        name: application.program.department.name,
        university: {
          id: application.program.department.university.id,
          name: application.program.department.university.name,
          slug: application.program.department.university.slug
        }
      }
    },
    notes: application.notes.map(n => ({
      id: n.id,
      content: n.content,
      internalOnly: n.internalOnly,
      createdAt: n.createdAt,
      author: {
        id: n.author.id,
        name: n.author.name,
        email: n.author.email
      }
    }))
  };
};

/**
 * Delete application
 */
export const deleteApplication = async (
  id: string,
  currentUser: UserSession
): Promise<void> => {
  // Verify access first
  await verifyApplicationAccess(id, currentUser);

  // Only allow deletion of draft applications
  const application = await prisma.application.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!application) {
    throw new Error('Application not found');
  }

  if (application.status !== ApplicationStatus.DRAFT) {
    throw new Error('Only draft applications can be deleted');
  }

  // Use a transaction to ensure all related data is deleted
  await prisma.$transaction([
    // Delete related notes first
    prisma.note.deleteMany({
      where: { applicationId: id }
    }),
    // Delete the application
    prisma.application.delete({
      where: { id }
    })
  ]);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'APPLICATION_DELETED',
      entityId: id,
      entityType: 'Application',
      userId: currentUser.id
    }
  });
};

/**
 * Withdraw application
 */
export const withdrawApplication = async (
  id: string,
  currentUser: UserSession
): Promise<void> => {
  // Verify access first
  await verifyApplicationAccess(id, currentUser);

  // Check application status
  const application = await prisma.application.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Allow withdrawal of both DRAFT and PENDING applications
  if (application.status !== ApplicationStatus.DRAFT && 
      application.status !== ApplicationStatus.PENDING) {
    throw new Error('Only draft and pending applications can be withdrawn');
  }

  // Use a transaction to ensure all related data is deleted
  await prisma.$transaction([
    // Delete related notes first
    prisma.note.deleteMany({
      where: { applicationId: id }
    }),
    // Delete the application
    prisma.application.delete({
      where: { id }
    })
  ]);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'APPLICATION_WITHDRAWN',
      entityId: id,
      entityType: 'Application',
      userId: currentUser.id,
      metadata: {
        previousStatus: application.status
      }
    }
  });
};

/**
 * Get applications for department admin with filtering options
 */
export const getApplicationsForDepartmentAdmin = async (
  currentUser: UserSession,
  statusFilter?: ApplicationStatus | null,
  searchQuery?: string
): Promise<ApplicationWithRelations[]> => {
  // Verify user is a department administrator
  if (currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only department administrators can access this function');
  }

  if (!currentUser.department?.id) {
    throw new Error('Department administrator must be assigned to a department');
  }

  // Build where clause for filtering
  let whereClause: any = {
    program: {
      departmentId: currentUser.department.id
    }
  };

  // Apply status filter if provided
  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  // Apply search query if provided
  if (searchQuery && searchQuery.trim() !== '') {
    whereClause.OR = [
      {
        student: {
          user: {
            name: {
              contains: searchQuery,
              mode: 'insensitive' as const
            }
          }
        }
      },
      {
        student: {
          
          user: {
            email: {
              contains: searchQuery,
              mode: 'insensitive' as const
            }
          }
        }
      },
      {
        program: {
          name: {
            contains: searchQuery,
            mode: 'insensitive' as const
          }
        }
      }
    ];
  }

  const applications = await prisma.application.findMany({
    where: whereClause,
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          qualifications: {
            select: {
              type: true,
              subject: true,
              grade: true,
              verified: true
            }
          }
        }
      },
      program: {
        include: {
          department: {
            include: {
              university: true
            }
          }
        }
      },
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return applications.map(app => ({
  id: app.id,
  studentId: app.studentId,
  programId: app.programId,
  status: app.status,
  submittedAt: app.submittedAt,
  createdAt: app.createdAt,
  updatedAt: app.updatedAt,
  student: {
    id: app.student.id,
    user: {
      id: app.student.user.id,
      name: app.student.user.name,
      email: app.student.user.email
    },
    qualifications: app.student.qualifications.map(q => ({
      type: q.type,
      subject: q.subject,
      grade: q.grade,
      verified: q.verified
    }))
  },
  program: {
    id: app.program.id,
    name: app.program.name,
    department: {
      id: app.program.department.id,
      name: app.program.department.name,
      university: {
        id: app.program.department.university.id,
        name: app.program.department.university.name,
        slug: app.program.department.university.slug
      }
    }
  },
  notes: app.notes.map(n => ({
    id: n.id,
    content: n.content,
    internalOnly: n.internalOnly,
    createdAt: n.createdAt,
    author: {
      id: n.author.id,
      name: n.author.name,
      role: n.author.role as UserRole,
      email: n.author.email || '', 
 
    }
  }))
}));

};

/**
 * Update application status (for department admins)
 */
export const updateApplicationStatus = async (
  applicationId: string,
  newStatus: ApplicationStatus,
  currentUser: UserSession,
  noteContent?: string
): Promise<ApplicationWithRelations> => {
  // Verify user is a department administrator
  if (currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only department administrators can update application status');
  }

  // Verify the application exists and belongs to the admin's department
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      program: {
        select: {
          departmentId: true
        }
      }
    }
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Check if the admin has access to this application's department
  if (application.program.departmentId !== currentUser.department?.id) {
    throw new Error('Unauthorized: You can only update applications in your department');
  }

  // Update the application status
  const updatedApplication = await prisma.application.update({
    where: { id: applicationId },
    data: { status: newStatus },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          qualifications: {
            select: {
              type: true,
              subject: true,
              grade: true,
              verified: true
            }
          }
        }
      },
      program: {
        include: {
          department: {
            include: {
              university: true
            }
          }
        }
      },
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  // Add a note if provided
  if (noteContent) {
    await prisma.note.create({
      data: {
        applicationId: applicationId,
        authorId: currentUser.id,
        content: noteContent,
        internalOnly: true
      }
    });
  }

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'STATUS_CHANGED',
      entityId: applicationId,
      entityType: 'Application',
      userId: currentUser.id,
      metadata: {
        previousStatus: application.status,
        newStatus: newStatus
      }
    }
  });

  // Return the updated application with all relations
  return {
    id: updatedApplication.id,
    studentId: updatedApplication.studentId,
    programId: updatedApplication.programId,
    status: updatedApplication.status,
    submittedAt: updatedApplication.submittedAt,
    createdAt: updatedApplication.createdAt,
    updatedAt: updatedApplication.updatedAt,
    student: {
      id: updatedApplication.student.id,
      user: {
        id: updatedApplication.student.user.id,
        name: updatedApplication.student.user.name,
        email: updatedApplication.student.user.email
      },
      qualifications: updatedApplication.student.qualifications.map(q => ({
        type: q.type,
        subject: q.subject,
        grade: q.grade,
        verified: q.verified
      }))
    },
    program: {
      id: updatedApplication.program.id,
      name: updatedApplication.program.name,
      department: {
        id: updatedApplication.program.department.id,
        name: updatedApplication.program.department.name,
        university: {
          id: updatedApplication.program.department.university.id,
          name: updatedApplication.program.department.university.name,
          slug: updatedApplication.program.department.university.slug
        }
      }
    },
    notes: updatedApplication.notes.map(n => ({
      id: n.id,
      content: n.content,
      internalOnly: n.internalOnly,
      createdAt: n.createdAt,
      author: {
        id: n.author.id,
        name: n.author.name,
        email: n.author.email || '',
        role: n.author.role as UserRole
      }
    }))
  };
};

/**
 * Get detailed application information for department admin
 */
export const getApplicationDetails = async (
  applicationId: string,
  currentUser: UserSession
): Promise<ApplicationWithRelations> => {
  // Verify user is a department administrator
  if (currentUser.role !== UserRole.DEPARTMENT_ADMINISTRATOR) {
    throw new Error('Unauthorized: Only department administrators can access application details');
  }

  // Verify the application exists and belongs to the admin's department
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      program: {
        select: {
          departmentId: true
        }
      }
    }
  });

  if (!application) {
    throw new Error('Application not found');
  }

  // Check if the admin has access to this application's department
  if (application.program.departmentId !== currentUser.department?.id) {
    throw new Error('Unauthorized: You can only access applications in your department');
  }

  // Get full application details with all relations
  const applicationDetails = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      student: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          qualifications: {
            select: {
              type: true,
              subject: true,
              grade: true,
              verified: true
            }
          }
        }
      },
      program: {
        include: {
          department: {
            include: {
              university: true
            }
          },
          requirements: { 
            select: {
              type: true,
              subject: true,
              minGrade: true,
              description: true
            }
          }
        }
      },
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  });

  if (!applicationDetails) {
    throw new Error('Application details not found');
  }


return {
  id: applicationDetails.id,
  studentId: applicationDetails.studentId,
  programId: applicationDetails.programId,
  status: applicationDetails.status,
  submittedAt: applicationDetails.submittedAt,
  createdAt: applicationDetails.createdAt,
  updatedAt: applicationDetails.updatedAt,
  student: {
    id: applicationDetails.student.id,
    user: {
      id: applicationDetails.student.user.id,
      name: applicationDetails.student.user.name,
      email: applicationDetails.student.user.email
    },
    qualifications: applicationDetails.student.qualifications.map(q => ({
      type: q.type,
      subject: q.subject,
      grade: q.grade,
      verified: q.verified
    }))
  },
  program: {
    id: applicationDetails.program.id,
    name: applicationDetails.program.name,
    department: {
      id: applicationDetails.program.department.id,
      name: applicationDetails.program.department.name,
      university: {
        id: applicationDetails.program.department.university.id,
        name: applicationDetails.program.department.university.name,
        slug: applicationDetails.program.department.university.slug
      }
    },
    requirements: applicationDetails.program.requirements.map(r => ({
      type: r.type,
      subject: r.subject || '',
      minGrade: r.minGrade || '',
      description: r.description
    }))
  },
  notes: applicationDetails.notes.map(n => ({
    id: n.id,
    content: n.content,
    internalOnly: n.internalOnly,
    createdAt: n.createdAt,
    author: {
      id: n.author.id,
      name: n.author.name,
      email: n.author.email || '', 
      role: n.author.role as UserRole
    }
  }))
};
};