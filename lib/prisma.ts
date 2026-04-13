import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? '' });

// Forza ricreazione se il client non ha i nuovi modelli
if (global.prisma && !(global.prisma as any).aiAnnotation) {
  global.prisma = undefined;
}

export const prisma = global.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
