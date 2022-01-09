import { prisma } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1ClientRequest } from '../..';
import { Meiling } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { sendMeilingError } from '../../../../../../../../common/meiling/v1/error/error';

async function permissionsDeleteHandler(_req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const req = _req as MeilingV1ClientRequest;
  const body = _req.body as any;
  const permissionsRaw = body.permissions;

  let permissionsToRemove = [];
  if (typeof permissionsRaw === 'string') {
    permissionsToRemove.push(permissionsRaw);
  } else if (permissionsRaw instanceof Array) {
    permissionsToRemove = permissionsRaw;
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST);
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

  const toRemove = permissionsToRemove.filter((n) => permissions.includes(n));
  if (toRemove.length === 0) {
    sendMeilingError(
      rep,
      Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED,
      'provided permissions array does not provide existing permissions',
    );
  }

  await getPrismaClient().oAuthClientAccessControls.update({
    where: {
      id: req.client.aclId,
    },
    data: {
      permissions: {
        disconnect: toRemove.map((n) => ({ name: n })),
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

export default permissionsDeleteHandler;
