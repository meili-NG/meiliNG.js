import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { Meiling, Utils } from '../../../../../../common';
import { getSanitizedUser } from '../../../../../../common/meiling/sanitize';
import { getPrismaClient } from '../../../../../../resources/prisma';

interface UserUpdateRequestBody {
  birthday?: string | number;
  familyName?: string;
  givenName?: string;
  middleName?: string | null;
  name?: string;
}

export async function userUpdateInfo(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const body = req.body as UserUpdateRequestBody;
  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.length > 0) {
    if (userId && userId !== '') {
      const users = userRawSession.filter((n) => n.id === userId);

      if (users.length === 1) {
        await getPrismaClient().user.update({
          where: {
            id: users[0].id,
          },
          data: {
            birthday: body.birthday ? new Date(body.birthday) : undefined,
            familyName: Utils.isNotBlank(body.familyName) ? body.familyName : undefined,
            givenName: Utils.isNotBlank(body.givenName) ? body.givenName : undefined,
            middleName: Utils.isNotBlank(body.middleName) ? body.middleName?.normalize('NFC') : undefined,
            name: Utils.isNotBlank(body.name) ? body.name : undefined,
          },
        });

        const user = await getSanitizedUser(users[0].id);
        rep.send(user);
        return;
      } else {
        Meiling.V1.Error.sendMeilingError(
          rep,
          Meiling.V1.Error.ErrorType.NOT_FOUND,
          'specified user uuid was not available.',
        );
      }
    } else {
      Meiling.V1.Error.sendMeilingError(
        rep,
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'required field (user uuid) is missing',
      );
    }
  } else {
    Meiling.V1.Error.sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
