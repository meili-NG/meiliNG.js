import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { Meiling } from '../../../../../../common';
import { getSanitizedUser } from '../../../../../../common/meiling/sanitize';
import { sendMeilingError } from '../../../../../../common/meiling/v1/error/error';

export async function userGetInfo(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.length > 0) {
    if (userId && userId !== '') {
      const users = userRawSession.filter((n) => n.id === userId);

      if (users.length === 1) {
        const user = await getSanitizedUser(users[0].id);

        rep.send(user);
        return;
      } else {
        sendMeilingError(rep, Meiling.V1.Error.ErrorType.NOT_FOUND, 'specified user uuid was not available.');
      }
    } else {
      sendMeilingError(rep, Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'required field (user uuid) is missing');
    }
  } else {
    sendMeilingError(rep, Meiling.V1.Error.ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
