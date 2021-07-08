import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '.';
import { User } from '../../../common';
import { BaridegiLogType, sendBaridegiLog } from '../../../common/baridegi';
import { getTokenFromRequest } from '../../../common/token';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';

interface MeilingV1SignOutQuery {
  userId?: string;
}

export function signoutPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  app.get('/', signoutHandler);
  app.get('/:userId', signoutHandler);

  done();
}

export async function signoutHandler(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const session = (req as FastifyRequestWithSession).session;

  const userId = (req.query as MeilingV1SignOutQuery)?.userId
    ? (req.query as MeilingV1SignOutQuery)?.userId
    : (req.params as MeilingV1SignOutQuery).userId;
  const user = session.user;

  if (user && user.length > 0) {
    if (userId === undefined) {
      await MeilingV1Session.logout(req);
    } else {
      if (userId && user.filter((n) => n.id === userId).length > 0) {
        await MeilingV1Session.logout(req, userId);

        sendBaridegiLog(BaridegiLogType.USER_SIGNOUT, {
          ip: req.ip,
          user: await User.getDetailedInfo(userId),
          token: getTokenFromRequest(req)?.token,
        });
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_OUT, 'you are already signed out.');
        return;
      }
    }
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.ALREADY_SIGNED_OUT, 'you are already signed out.');
    return;
  }

  rep.send({
    success: true,
  });
}
