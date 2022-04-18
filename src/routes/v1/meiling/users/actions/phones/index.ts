import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '../../..';
import { Meiling } from '../../../../../../common';
import userPhoneActionPlugin from './actions';
import libPhonenumberJs from 'libphonenumber-js';

function userPhonesPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', getUserPhones);
  app.post('/', addUserPhone);
  app.register(userPhoneActionPlugin, { prefix: '/:phoneId' });

  done();
}

export default userPhonesPlugin;

export async function getUserPhones(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;

  if (userRawSession && userRawSession.filter((n) => n.id === userId).length > 0) {
    const phones = await Meiling.Identity.User.getPhones(userId);

    rep.send(phones.map((n) => Meiling.Sanitize.getSanitizedPhone(n)));
  } else {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.NOT_FOUND,
      'specified user uuid was not available.',
    );
  }
}

export async function addUserPhone(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const userRawSession = session.user;

  const userId = (req.params as any)?.userId;
  const signupChallenge = await Meiling.V1.Session.getAuthenticationStatus(req);
  const body = req.body as any;

  const phoneRaw = body.phone as string;

  if (!phoneRaw || typeof phoneRaw !== 'string')
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'phone is missing');

  const phone = libPhonenumberJs(phoneRaw);

  if (!phone) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.INVALID_REQUEST, 'invalid ITU phone number');
  }

  if (!signupChallenge) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED,
      'Signup Validation requests were not generated.',
    );
    return;
  }

  // check with validation.

  if (!signupChallenge.phone?.isVerified) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_COMPLETED);
    return;
  } else if (signupChallenge.phone.to !== phone?.formatInternational()) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_INVALID);
    return;
  }

  if (userRawSession && userRawSession.filter((n) => n.id === userId).length > 0) {
    const phones = await Meiling.Identity.User.getPhones(userId);
    const isTherePrimary = phones.filter((n) => n.isPrimary).length > 0;

    let isPrimary = false;
    if (!isTherePrimary) isPrimary = true;

    await Meiling.Identity.User.addPhone(userId, phone.formatInternational(), isPrimary);

    rep.send(phones);
  } else {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.NOT_FOUND,
      'specified user uuid was not available.',
    );
  }
}
