import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

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

    // 5. Create Users (Students and Admins)
    const hashedPassword = await hash('1234', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@university.edu',
        name: 'Admin User', 
        password: hashedPassword,
        role: 'ADMINISTRATOR',
        administrator: {
          create: {
            departmentId: csDepartment.id,
            permissions: {
              create: {
                canVerifyDocuments: true,
                canApproveApplications: true,
              },
            },
          },
        },
      },
    });
    console.log('Created admin user:', adminUser.email);

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
                  type: 'HIGH_SCHOOL',
                  subject: 'Mathematics',
                  grade: 'A',
                  verified: true,
                },
                {
                  type: 'LANGUAGE_TEST',
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

    // 6. Create Applications
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        programId: csProgram.id,
        status: 'PENDING',
        documents: {
          create: [
            {
              studentId: student.id,
              type: 'TRANSCRIPT',
              url: 'https://example.com/transcript.pdf',
              verified: false,
            },
            {
              studentId: student.id,
              type: 'IDENTIFICATION',
              url: 'https://example.com/id.pdf',
              verified: true,
              verifiedBy: adminUser.id,
              verifiedAt: new Date(),
            },
          ],
        },
      },
    });
    console.log('Created application:', application.id);

    // 7. Create Notes
    const note = await prisma.note.create({
      data: {
        applicationId: application.id,
        authorId: adminUser.id,
        content: 'Strong candidate, needs to submit English test results',
        internalOnly: true,
      },
    });
    console.log('Created note:', note.id);

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();