import { Phone } from '@prisma/client';
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../../..';
import { Meiling } from '../../../../../../../common';

function userPhoneActionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
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

    const phoneId = (req.params as any)?.phoneId;

    if (!phoneId)
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'phoneId is missing');

    const phones = await Meiling.Identity.User.getPhones(userId);
    const matchingPhone = phones.find((n) => n.id === phoneId);

    if (!matchingPhone) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_FOUND);
    }

    (req as any).phone = matchingPhone;
    Object.freeze((req as any).phone);
  });

  app.get('/', async (req, rep) => {
    const phone = (req as any).phone as Phone;

    rep.send(Meiling.Sanitize.getSanitizedPhone(phone));
  });

  /*
  
  // Not implementing this at the moment. 
  // since this can seriously affect KRID (Stella IT Internal)

  app.put('/', async (req, rep) => {
    const phone = (req as any).phone as Phone;
    const userId = (req.params as any)?.userId;

    const body = req.body as {
      isPrimary?: boolean;
    };

    if (body.isPrimary) {
      await Meiling.Identity.User.setPrimaryPhone(userId, phone.phone);
    }

    rep.send({ success: true });
  });
  */

  app.delete('/', async (req, rep) => {
    const userId = (req.params as any)?.userId;
    const phone = (req as any).phone as Phone;

    const phones = await Meiling.Identity.User.getPhones(userId);
    if (phones.length === 1) {
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.FORBIDDEN, 'at least one email is required');
    }

    await Meiling.Identity.User.removePhone(userId, phone.phone);
    rep.send({ success: true });
  });

  done();
}

export default userPhoneActionPlugin;
