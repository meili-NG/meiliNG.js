import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { Meiling } from '../../../../../../common';
import userEmailActionPlugin from './actions';

function userEmailsPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', getUserEmails);
  app.post('/', addUserEmail);
  app.register(userEmailActionPlugin, { prefix: '/:emailId' });

  done();
}

export default userEmailsPlugin;

export async function getUserEmails(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.filter((n) => n.id === userId).length > 0) {
    const emails = await Meiling.Identity.User.getEmails(userId);

    rep.send(emails.map((n) => Meiling.Sanitize.getSanitizedEmail(n)));
  } else {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.NOT_FOUND,
      'specified user uuid was not available.',
    );
  }
}

export async function addUserEmail(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;
  const signupChallenge = await Meiling.V1.Session.getAuthenticationStatus(req);
  const body = req.body as any;

  const email = body.email as string;

  if (!email || typeof email !== 'string')
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'email is missing');

  if (!signupChallenge) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED,
      'Signup Validation requests were not generated.',
    );
    return;
  }

  // check with validation.

  if (!signupChallenge.email?.isVerified) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_COMPLETED);
    return;
  } else if (signupChallenge.email.to !== email) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID);
    return;
  }

  if (userRawSession && userRawSession.filter((n) => n.id === userId).length > 0) {
    const emails = await Meiling.Identity.User.getEmails(userId);
    const isTherePrimary = emails.filter((n) => n.isPrimary).length > 0;

    let isPrimary = false;
    if (!isTherePrimary) isPrimary = true;

    await Meiling.Identity.User.addEmail(userId, email.trim(), isPrimary, true);

    rep.send({ success: true });
  } else {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.NOT_FOUND,
      'specified user uuid was not available.',
    );
  }
}
