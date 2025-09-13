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
          name: 'College of Medicine and Allied Health Sciences',
          slug: 'comahs-usl',
          location: 'Freetown',
        },
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${universities.count} universities`);


    const fbcUniversity = await prisma.university.findFirstOrThrow({
      where: { slug: 'fbc-usl' }
    });

     const comahsUniversity = await prisma.university.findFirstOrThrow({
      where: { slug: 'comahs-usl' }
    });

    // 2. Create Departments
    const departments = await prisma.department.createMany({
      data: [
        {
          universityId: comahsUniversity.id,
          name: 'Clinical Sciences',
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


    const engDepartment = await prisma.department.findFirstOrThrow({
      where: { code: 'ENG' }
    });

     const medDepartment = await prisma.department.findFirstOrThrow({
      where: { code: 'CS' }
    });

    // 3. Create Programs
    const programs = await prisma.program.createMany({
      data: [
           {
          departmentId: engDepartment.id,
          name: 'Electrical Engineering BSc',
        },
        {
          departmentId: medDepartment.id,
          name: 'Pharmacy BSc',
        },
     
      ],
      skipDuplicates: true,
    });
    console.log(`Created ${programs.count} programs`);

       const engProgram = await prisma.program.findFirstOrThrow({
      where: { name: 'Electrical Engineering BSc' }
    });

    const csProgram = await prisma.program.findFirstOrThrow({
      where: { name: 'Pharmacy BSc' }
    });


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
      where: { email: 'student@uniqualifyer.dev' }
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
              departmentId: medDepartment.id,
              permissions: {
                create: {
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
          email: 'student@uniqualifyer.dev',
          name: 'Student User', 
          password: hashedPassword,
          role: 'STUDENT',
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
         
        },
      });
      console.log('Created student record:', student.id);
    } else {
      console.log('Student record already exists:', student.id);
    }

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();