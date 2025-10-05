
import prisma from '~/lib/prisma.server';

export async function getUniversities() {
  return await prisma.university.findMany({
    include: {
      departments: {
        include: {
          Program: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function getUniversityBySlug(slug: string) {
  return await prisma.university.findUnique({
    where: { slug },
    include: {
      departments: {
        include: {
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
      }
    }
  });
}