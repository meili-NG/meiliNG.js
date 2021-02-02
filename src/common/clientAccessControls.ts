import { Group, OAuthClientAccessControls, Permission, User as UserModel } from '@prisma/client';
import { Client, User } from '.';
import { prisma } from '..';

export async function getByClientId(clientId: string) {
  return await Client.getAccessControl(clientId);
}

export async function checkPermissions(
  acl: OAuthClientAccessControls,
  permissions: Permission[],
): Promise<boolean | Permission[]> {
  const allowedPermissions = await prisma.permission.findMany({
    where: {
      accessControls: {
        some: {
          id: acl.id,
        },
      },
    },
  });

  const deniedPermissions = permissions.filter((p) => allowedPermissions.find((a) => a.name === p.name) === undefined);
  if (deniedPermissions.length === 0) {
    return true;
  } else {
    return deniedPermissions;
  }
}

export async function checkUsers(acl: OAuthClientAccessControls, user: UserModel | string) {
  // If no user access controls, it is free.
  if (!acl.oAuthUserAccessControlsId) return true;

  const userObject = await User.getInfo(user);
  if (!userObject) return false;

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      where: {
        oAuthAccessControls: {
          some: {
            id: acl.id,
          },
        },
      },
    }),
    prisma.group.findMany({
      where: {
        oAuthAccessControls: {
          some: {
            id: acl.id,
          },
        },
      },
    }),
  ]);

  const matchingUser = users.find((n) => n.id === userObject.id);
  if (matchingUser) return true;

  const matchingGroup = groups.find((n) => userObject.groups.find((m: Group) => m.id === n.id));
  if (matchingGroup) return true;

  return false;
}
