import { FastifyReply, FastifyRequest } from 'fastify';
import { Meiling } from '../../../../common';
import { getPrismaClient } from '../../../../resources/prisma';

async function permissionAdminPutHandler(req: FastifyRequest, rep: FastifyReply) {
  const name = (req.params as { name: string }).name;
  const body = req.body as any;

  if (name) {
    let perm = await getPrismaClient().permission.findUnique({
      where: {
        name,
      },
    });

    if (perm) {
      if (typeof body.isAvailable !== 'boolean') {
        await getPrismaClient().permission.update({
          where: {
            name,
          },
          data: {
            isAvailable: body.isAvailable,
          },
        });
      }

      perm = await getPrismaClient().permission.findUnique({
        where: {
          name,
        },
      });

      rep.send(perm);
    } else {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
    }
    return;
  } else {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST);
    return;
  }
}

export default permissionAdminPutHandler;
