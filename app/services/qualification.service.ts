
import { QualificationType, Qualification, UserRole } from "@prisma/client";
import prisma from '~/lib/prisma.server';

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

export interface GetQualificationsOptions {
  studentId?: string;
  type?: QualificationType;
  verified?: boolean;
}

export interface CreateQualificationData {
  type: QualificationType;
  subject: string;
  grade: string;
}

export interface UpdateQualificationData {
  type?: QualificationType;
  subject?: string;
  grade?: string;
}

/**
 * Get qualifications with filtering options
 */
export async function getQualifications(
  currentUser: UserSession,
  options: GetQualificationsOptions = {}
): Promise<Qualification[]> {
  const {
    studentId,
    type,
    verified
  } = options;

  const where: any = {};

  if (currentUser.role === "STUDENT") {
    let studentId = currentUser.student?.id;
  
    if (!studentId && currentUser.id) {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.id }
      });
      
      if (student) {
        studentId = student.id;
      } else {
        return [];
      }
    }
    
    where.studentId = studentId;
  }

  if (studentId && (currentUser.role === "DEPARTMENT_ADMINISTRATOR" || currentUser.role === "SUPER_ADMIN")) {
    where.studentId = studentId;
  }

  if (type) {
    where.type = type;
  }

  if (verified !== undefined) {
    where.verified = verified;
  }

  return prisma.qualification.findMany({
    where,
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}
/**
 * Create a new qualification
 */
export async function createQualification(
  data: CreateQualificationData,
  currentUser: UserSession,
): Promise<Qualification> {
  // Students can only create qualifications for themselves
  if (currentUser.role !== "STUDENT") {
    throw new Error("Only students can create qualifications");
  }

  let studentId = currentUser.student?.id;
  
  if (!studentId) {
    // Fetch the student record for this user using userId, not id
    const student = await prisma.student.findUnique({
      where: { userId: currentUser.id } 
    });
    
    if (!student) {
      throw new Error("Student record not found for this user");
    }
    
    studentId = student.id; 
  }

  return prisma.qualification.create({
    data: {
      studentId,  
      type: data.type,
      subject: data.subject,
      grade: data.grade,
      verified: true
    }
  });
}

/**
 * Update an existing qualification
 */
export async function updateQualification(
  id: string,
  data: UpdateQualificationData,
  currentUser: UserSession,
): Promise<Qualification> {
  // First get the qualification to check permissions
  const qualification = await prisma.qualification.findUnique({
    where: { id },
    include: {
      student: true
    }
  });

  if (!qualification) {
    throw new Error("Qualification not found");
  }

  if (currentUser.role === "STUDENT") {
    let studentId = currentUser.student?.id;
    
    if (!studentId) {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.id }
      });
      
      if (!student) {
        throw new Error("Student record not found for this user");
      }
      
      studentId = student.id;
    }

    if (studentId !== qualification.studentId) {
      throw new Error("You can only update your own qualifications");
    }
  }

  return prisma.qualification.update({
    where: { id },
    data: {
      type: data.type,
      subject: data.subject,
      grade: data.grade
    }
  });
}

/**
 * Verify a qualification (admin only)
 */
export async function verifyQualification(
  id: string,
  currentUser: UserSession,
): Promise<Qualification> {
  // Only admins can verify qualifications
  if (currentUser.role !== "DEPARTMENT_ADMINISTRATOR" && currentUser.role !== "SUPER_ADMIN") {
    throw new Error("Only administrators can verify qualifications");
  }

  // First get the qualification
  const qualification = await prisma.qualification.findUnique({
    where: { id }
  });

  if (!qualification) {
    throw new Error("Qualification not found");
  }

  return prisma.qualification.update({
    where: { id },
    data: {
      verified: true
    }
  });
}

/**
 * Delete a qualification
 */
export async function deleteQualification(
  id: string,
  currentUser: UserSession,
): Promise<void> {
  // First get the qualification to check permissions
  const qualification = await prisma.qualification.findUnique({
    where: { id },
    include: {
      student: true
    }
  });

  if (!qualification) {
    throw new Error("Qualification not found");
  }

  if (currentUser.role === "STUDENT") {
    let studentId = currentUser.student?.id;
    
    if (!studentId) {
      const student = await prisma.student.findUnique({
        where: { userId: currentUser.id } 
      });
      
      if (!student) {
        throw new Error("Student record not found for this user");
      }
      
      studentId = student.id;
    }
    
    if (studentId !== qualification.studentId) {
      throw new Error("You can only delete your own qualifications");
    }
  }

  await prisma.qualification.delete({
    where: { id }
  });
}

/**
 * Get qualifications for a specific student
 */
export async function getQualificationsByStudentId(
  studentId: string,
  currentUser: UserSession,
): Promise<Qualification[]> {
  // Students can only view their own qualifications
  if (currentUser.role === "STUDENT") {
    if (currentUser.student?.id !== studentId) {
      throw new Error("You can only view your own qualifications");
    }
  }

  // Admins can view any student's qualifications
  return prisma.qualification.findMany({
    where: { studentId },
    orderBy: {
      createdAt: 'desc'
    }
  });
}