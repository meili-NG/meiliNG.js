import { Group } from '@prisma/client';
import { prisma } from '..';

export function getId(group: string | Group) {
  if (typeof group === 'string') {
    return group;
  }
  return group.id;
}

export async function getInfo(group: string | Group) {
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
