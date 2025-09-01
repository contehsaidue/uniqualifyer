
import prisma from '@/lib/prisma';

export async function getPrograms() {
  return await prisma.program.findMany({
    include: {
      department: {
        include: {
          university: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      requirements: {
        select: {
          id: true,
          type: true,
          subject: true,
          minGrade: true,
          description: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getProgramById(id: string) {
  return await prisma.program.findUnique({
    where: { id },
    include: {
      department: {
        include: {
          university: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      requirements: {
        select: {
          id: true,
          type: true,
          subject: true,
          minGrade: true,
          description: true
        }
      }
    }
  });
}