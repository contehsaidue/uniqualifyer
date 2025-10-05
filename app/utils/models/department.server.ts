
import prisma from '~/lib/prisma.server';

export async function getDepartments() {
  return await prisma.department.findMany({
    include: {
      university: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      Program: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getDepartmentById(id: string) {
  return await prisma.department.findUnique({
    where: { id },
    include: {
      university: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      Program: {
        include: {
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
      }
    }
  });
}