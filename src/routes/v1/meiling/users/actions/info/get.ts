import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { getSanitizedUser } from '../../../../../../common/meiling/authorization/sanitize';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

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
        sendMeilingError(rep, MeilingV1ErrorType.NOT_FOUND, 'specified user uuid was not available.');
      }
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'required field (user uuid) is missing');
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
