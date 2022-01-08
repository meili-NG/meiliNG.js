import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { getSanitizedUser } from '../../../../../../common/meiling/authorization/sanitize';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

export async function userGetLoggedInUserInfo(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  if (userRawSession && userRawSession.length > 0) {
    const users = session.user;
    if (!users) {
      sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
      return;
    }

    const resultPromise = [];

    for (const user of users) {
      resultPromise.push(getSanitizedUser(user.id));
    }
    const result = await Promise.all(resultPromise);

    rep.send(result);
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'You are not logged in.');
  }
}
