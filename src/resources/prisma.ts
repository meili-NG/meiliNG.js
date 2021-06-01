import { PrismaClient } from '@prisma/client';

// https://www.getPrismaClient().io/docs/guides/performance-and-optimization/connection-management/#prismaclient-in-long-running-applications
let client: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  return client || (client = new PrismaClient());
};
