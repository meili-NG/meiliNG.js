import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '.';
import { Meiling, Event } from '../../../common';

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
      await Meiling.V1.Session.logout(req);
    } else {
      if (userId && user.filter((n) => n.id === userId).length > 0) {
        await Meiling.V1.Session.logout(req, userId);

        Event.Baridegi.sendBaridegiLog(Event.Baridegi.BaridegiLogType.USER_SIGNOUT, {
          ip: req.ip,
          user: await Meiling.Identity.User.getDetailedInfo(userId),
          token: Meiling.Authentication.Token.getTokenFromRequest(req)?.token,
        });
      } else {
        throw new Meiling.V1.Error.MeilingError(
          Meiling.V1.Error.ErrorType.ALREADY_SIGNED_OUT,
          'you are already signed out.',
        );
        return;
      }
    }
  } else {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.ALREADY_SIGNED_OUT,
      'you are already signed out.',
    );
    return;
  }

  rep.send({
    success: true,
  });
}
