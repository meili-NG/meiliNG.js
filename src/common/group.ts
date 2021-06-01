import { Group, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function getId(group: string | Group): string {
  if (typeof group === 'string') {
    return group;
  }
  return group.id;
}

export async function getInfo(group: string | Group): Promise<Group | undefined> {
  const groupData = await prisma.group.findUnique({
    where: {
      id: getId(group),
    },
  });

  if (groupData === null || groupData === undefined) {
    return undefined;
  }

  return groupData;
}