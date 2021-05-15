import { PrismaClient } from '@prisma/client';

let client: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  return client || (client = new PrismaClient());
};
