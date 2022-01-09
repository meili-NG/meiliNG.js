import { prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';

async function permissionsPostHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const body = _req.body as any;
  const permissionsRaw = body.permissions;

  let permissionsToAdd = [];
  if (typeof permissionsRaw === 'string') {
    permissionsToAdd.push(permissionsRaw);
  } else if (permissionsRaw instanceof Array) {
    permissionsToAdd = permissionsRaw;
  } else {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }

  const permissions = (
    await getPrismaClient().permission.findMany({
      where: {
        accessControls: {
          some: {
            id: req.client.aclId,
          },
        },
      },
    })
  ).map((n) => n.name) as string[];

  const availables = (
    (
      await getPrismaClient().permission.findMany({
        where: {
          isAvailable: true,
        },
      })
    ).map((n) => n.name) as string[]
  ).filter((n) => !permissions.includes(n));

  const toAdd = permissionsToAdd.filter((n) => availables.includes(n));
  if (toAdd.length === 0) {
    Meiling.V1.Error.sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED,
      'provided permissions array does not provide available permissions',
    );
  }

  await getPrismaClient().oAuthClientAccessControls.update({
    where: {
      id: req.client.aclId,
    },
    data: {
      permissions: {
        connect: [...permissions.map((n) => ({ name: n })), ...toAdd.map((n) => ({ name: n }))],
      },
    },
  });

  const updatedPermissions = (
    await getPrismaClient().permission.findMany({
      where: {
        accessControls: {
          some: {
            id: req.client.aclId,
          },
        },
      },
    })
  ).map((n) => n.name) as string[];

  rep.send(updatedPermissions);
}

export default permissionsPostHandler;
