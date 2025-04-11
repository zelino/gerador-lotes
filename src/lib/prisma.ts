// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma'; // <-- Importa do local gerado!

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query', 'info', 'warn', 'error'], // Descomente para ver logs do Prisma
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;