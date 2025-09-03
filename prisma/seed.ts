import { PrismaClient } from '@prisma/client';
import { USER_ROLES } from '@/utils/constants';
import { hash } from 'bcryptjs';

enum QualificationType {
  HIGH_SCHOOL = 'HIGH_SCHOOL',
  LANGUAGE_TEST = 'LANGUAGE_TEST',
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
          name: 'Fourah Bay College',
          slug: 'fbc-usl',
          location: 'Freetown',
        },
        {
          name: 'Njala University',
          slug: 'njala-university',
          location: 'Bo',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${universities.count} universities`);

    const njalaUniversity = await prisma.university.findFirstOrThrow({
      where: { slug: 'njala-university' }
    });

    const fbcUniversity = await prisma.university.findFirstOrThrow({
      where: { slug: 'fbc-usl' }
    });

    // 2. Create Departments
    const departments = await prisma.department.createMany({
      data: [
        {
          universityId: njalaUniversity.id,
          name: 'Computer Science',
          code: 'CS',
        },
        {
          universityId: fbcUniversity.id,
          name: 'Faculty of Engineering',
          code: 'ENG',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${departments.count} departments`);

    const csDepartment = await prisma.department.findFirstOrThrow({
      where: { code: 'CS' }
    });

    const engDepartment = await prisma.department.findFirstOrThrow({
      where: { code: 'ENG' }
    });

    // 3. Create Programs
    const programs = await prisma.program.createMany({
      data: [
        {
          departmentId: csDepartment.id,
          name: 'Computer Science BSc',
        },
        {
          departmentId: engDepartment.id,
          name: 'Electrical Engineering BSc',
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
    const hashedPassword = await hash('12345678', 12);

    // Check if users already exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'super@uniqualifyer.dev' }
    });

    const existingDeptAdmin = await prisma.user.findUnique({
      where: { email: 'deptadmin@uniqualifyer.dev' }
    });

    const existingStudent = await prisma.user.findUnique({
      where: { email: 'student@example.com' }
    });

    // Create Super Admin only if it doesn't exist
    let adminUser = existingAdmin;
    if (!existingAdmin) {
      adminUser = await prisma.user.create({
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
    } else {
      console.log('Super admin user already exists:', adminUser?.email);
    }

    // Create Department Admin only if it doesn't exist
    let departmentUser = existingDeptAdmin;
    if (!existingDeptAdmin) {
      departmentUser = await prisma.user.create({
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
    } else {
      console.log('Department admin user already exists:', departmentUser?.email);
    }

    // Create Student only if it doesn't exist
    let studentUser = existingStudent;
    if (!existingStudent) {
      studentUser = await prisma.user.create({
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
    } else {
      console.log('Student user already exists:', studentUser?.email);
    }

    // Get or create student record
    let student = await prisma.student.findFirst({
      where: { userId: studentUser!.id }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          userId: studentUser!.id,
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
      });
      console.log('Created student record:', student.id);
    } else {
      console.log('Student record already exists:', student.id);
    }

    // 7. Create Application (only if it doesn't exist)
    let application = await prisma.application.findFirst({
      where: {
        studentId: student.id,
        programId: csProgram.id,
      }
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          studentId: student.id,
          programId: csProgram.id,
          status: ApplicationStatus.PENDING,
          submittedAt: new Date(),
        },
      });
      console.log('Created application:', application.id);
    } else {
      console.log('Application already exists:', application.id);
    }

    // 8. Create Notes (only if it doesn't exist)
    let note = await prisma.note.findFirst({
      where: {
        applicationId: application.id,
        authorId: adminUser!.id,
      }
    });

    if (!note) {
      // Use non-null assertion since we know adminUser exists at this point
      note = await prisma.note.create({
        data: {
          applicationId: application.id,
          authorId: adminUser!.id, // Use non-null assertion here
          content: 'Strong candidate, needs to submit English test results',
          internalOnly: true,
        },
      });
      console.log('Created note:', note.id);
    } else {
      console.log('Note already exists:', note.id);
    }

    // 9. Create Audit Logs (always create new logs)
    const auditLog = await prisma.auditLog.create({
      data: {
        action: 'APPLICATION_SUBMITTED',
        entityId: application.id,
        entityType: 'Application',
        userId: studentUser!.id,
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