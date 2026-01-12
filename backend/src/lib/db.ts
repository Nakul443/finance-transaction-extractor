// connect database

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export { prisma };

// multiple files can now use 'prisma' to interact with the database and connect
// no need to declare prisma again and again