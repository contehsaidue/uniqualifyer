import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const databaseUrl = process.env.PRODUCTION_DATABASE_URL || process.env.DATABASE_URL;

const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

export default prisma