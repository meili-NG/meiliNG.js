import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { Meiling } from '../../../../../../common';
import { getSanitizedUser } from '../../../../../../common/meiling/sanitize';
import { getPrismaClient } from '../../../../../../resources/prisma';

export async function userDelete(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.length > 0) {
    if (userId && userId !== '') {
      const users = userRawSession.filter((n) => n.id === userId);

      if (users.length === 1) {
        const user = await getSanitizedUser(users[0].id);

        await getPrismaClient().user.update({
          where: {
            id: user?.id,
          },
          data: {
            deletedAt: new Date(),
          },
        });

        rep.send({ success: true });
        return;
      } else {
        throw new Meiling.V1.Error.MeilingError(
          Meiling.V1.Error.ErrorType.NOT_FOUND,
          'specified user was not available.',
        );
      }
    } else {
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'required field (user uuid) is missing',
      );
    }
  } else {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
