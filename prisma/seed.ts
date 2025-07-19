import { PrismaClient } from '@prisma/client';
import { USER_ROLES } from '@/utils/constants';
import { hash } from 'bcryptjs';

// Define missing enums that are referenced in the script
enum QualificationType {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  LANGUAGE_TEST = 'LANGUAGE_TEST',
}

enum DocumentType {
  TRANSCRIPT = 'TRANSCRIPT',
  IDENTIFICATION = 'IDENTIFICATION',
}

enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

async function seedDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting database seeding...');

    // 1. Create Universities
    const universities = await prisma.university.createMany({
      data: [
        {
          name: 'Tech University',
          slug: 'tech-university',
        },
        {
          name: 'Global University',
          slug: 'global-university',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${universities.count} universities`);

    const techUniversity = await prisma.university.findFirstOrThrow({
      where: { slug: 'tech-university' }
    });

    // 2. Create Departments
    const departments = await prisma.department.createMany({
      data: [
        {
          universityId: techUniversity.id,
          name: 'Computer Science',
          code: 'CS',
        },
        {
          universityId: techUniversity.id,
          name: 'Engineering',
          code: 'ENG',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${departments.count} departments`);

    const csDepartment = await prisma.department.findFirstOrThrow({
      where: { code: 'CS' }
    });

    // 3. Create Programs
    const programs = await prisma.program.createMany({
      data: [
        {
          universityId: techUniversity.id,
          name: 'Computer Science BSc',
        },
        {
          universityId: techUniversity.id,
          name: 'Electrical Engineering MSc',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${programs.count} programs`);

    const csProgram = await prisma.program.findFirstOrThrow({
      where: { name: 'Computer Science BSc' }
    });

    // 4. Create Program Requirements
    const requirements = await prisma.programRequirement.createMany({
      data: [
        {
          programId: csProgram.id,
          type: 'GRADE',
          subject: 'Mathematics',
          minGrade: 'B',
          description: 'Minimum grade B in Mathematics',
        },
        {
          programId: csProgram.id,
          type: 'LANGUAGE',
          description: 'English proficiency test required',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${requirements.count} program requirements`);

    // 5. Create Users (Students, Department Admins and Super Admins)
    const hashedPassword = await hash('1234', 12);
    
    // Create Super Admin
    const adminUser = await prisma.user.create({
      data: {
        email: 'super@uniqualifyer.dev',
        name: 'Admin User', 
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        super_admin: {
          create: {
            permissions: {
              create: {
                canManageSystem: true,
                canManageUsers: true,
              }
            }
          },
        },
      },
    });
    console.log('Created super admin user:', adminUser.email);

    // Create Department Admin
    const departmentUser = await prisma.user.create({
      data: {
        email: 'deptadmin@uniqualifyer.dev',
        name: 'Department Admin', 
        password: hashedPassword,
        role: 'DEPARTMENT_ADMINISTRATOR',
        department_administrator: {
          create: {
            departmentId: csDepartment.id,
            permissions: {
              create: {
                canVerifyDocuments: true,
                canApproveApplications: true,
                canManageDepartment: true,
              }
            }
          },
        },
      },
    });
    console.log('Created department admin user:', departmentUser.email);

    // Create Student
    const studentUser = await prisma.user.create({
      data: {
        email: 'student@example.com',
        name: 'Student User', 
        password: hashedPassword,
        role: 'STUDENT',
        student: {
          create: {
            qualifications: {
              create: [
                {
                  type: QualificationType.HIGH_SCHOOL,
                  subject: 'Mathematics',
                  grade: 'A',
                  verified: true,
                },
                {
                  type: QualificationType.LANGUAGE_TEST,
                  subject: 'English',
                  grade: 'IELTS 7.5',
                  verified: true,
                },
              ],
            },
          },
        },
      },
    });
    console.log('Created student user:', studentUser.email);

    const student = await prisma.student.findFirstOrThrow({
      where: { userId: studentUser.id }
    });

    // 6. Create Documents
    const documents = await prisma.document.createMany({
      data: [
        {
          studentId: student.id,
          type: DocumentType.TRANSCRIPT,
          url: 'https://example.com/transcript.pdf',
          verified: false,
        },
        {
          studentId: student.id,
          type: DocumentType.IDENTIFICATION,
          url: 'https://example.com/id.pdf',
          verified: true,
          verifiedBy: adminUser.id,
          verifiedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${documents.count} documents`);

    // Get the first document ID for the application
    const firstDocument = await prisma.document.findFirstOrThrow({ 
      where: { studentId: student.id } 
    });

    // 7. Create Application
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        programId: csProgram.id,
        status: ApplicationStatus.PENDING,
        submittedAt: new Date(),
        documents: {
          connect: [{ id: firstDocument.id }]
        }
      },
    });
    console.log('Created application:', application.id);

    // 8. Create Notes
    const note = await prisma.note.create({
      data: {
        applicationId: application.id,
        authorId: adminUser.id,
        content: 'Strong candidate, needs to submit English test results',
        internalOnly: true,
      },
    });
    console.log('Created note:', note.id);

    // 9. Create Audit Logs
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_SUBMITTED',
        entityId: application.id,
        entityType: 'Application',
        userId: studentUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'Seeder Script',
        metadata: {
          programId: csProgram.id,
          status: ApplicationStatus.PENDING
        }
      }
    });
    console.log('Created audit log:', auditLog.id);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();