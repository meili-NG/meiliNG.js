import { Email } from '@prisma/client';
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../../..';
import { Meiling } from '../../../../../../../common';

function userEmailActionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.addHook('onRequest', async (req, rep) => {
    const session = (req as FastifyRequestWithSession).session;
    const userRawSession = session.user;

    const userId = (req.params as any)?.userId;
    if (!userRawSession || userRawSession.filter((n) => n.id === userId).length == 0) {
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.NOT_FOUND,
        'specified user uuid was not available.',
      );
    }

    const emailId = (req.params as any)?.emailId;

    if (!emailId)
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'emailId is missing');

    const emails = await Meiling.Identity.User.getEmails(userId);
    const matchingEmail = emails.find((n) => n.id === emailId);

    if (!matchingEmail) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
    }

    (req as any).email = matchingEmail;
  });

  app.get('/', async (req, rep) => {
    const email = (req as any).email as Email;

    rep.send(Meiling.Sanitize.getSanitizedEmail(email));
  });

  app.put('/', async (req, rep) => {
    const email = (req as any).email as Email;
    const userId = (req.params as any)?.userId;

    const body = req.body as {
      isPrimary?: boolean;
    };

    if (body.isPrimary) {
      await Meiling.Identity.User.setPrimaryEmail(userId, email.email);
    }

    rep.send({ success: true });
  });

  app.delete('/', async (req, rep) => {
    const userId = (req.params as any)?.userId;
    const email = (req as any).email as Email;

    const emails = await Meiling.Identity.User.getEmails(userId);
    if (emails.length === 1) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.FORBIDDEN, 'at least one email is required');
    }

    await Meiling.Identity.User.removeEmail(userId, email.email);
    rep.send({ success: true });
  });

  done();
}

export default userEmailActionPlugin;
