import { FastifyReply, FastifyRequest } from 'fastify';
import { getUserFromActionRequest } from '../../..';
import { Meiling, Utils } from '../../../../../../../../common';
import { getPrismaClient } from '../../../../../../../../resources/prisma';
import { AttestationResult, Factor, Fido2Lib } from 'fido2-lib';
import config from '../../../../../../../../resources/config';
import { getSessionFromRequest } from '../../../../../../../../common/meiling/v1/session';
import crypto from 'crypto';

const dbType = Meiling.V1.Database.convertAuthentication(Meiling.V1.Interfaces.ExtendedAuthMethods.WEBAUTHN);

async function userWebAuthnActionPostKey(req: FastifyRequest, rep: FastifyReply): Promise<void> {
  const user = await getUserFromActionRequest(req);
  if (!user) {
    throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED);
    return;
  }

  const session = await getSessionFromRequest(req);

  interface RegisterRequest {
    hostname: string;
    name?: string;
    id?: string;
  }

  type RegisterProcess = RegisterRequest & AttestationResult;
  type RegisterBody = RegisterRequest | RegisterProcess;

  const body = req.body as RegisterBody | undefined;

  let hostname = body?.hostname;
  if (!hostname || !Utils.isNotBlank(hostname)) {
    hostname = new URL(config.frontend.url[0]).hostname;
  }

  const allowedHostnames = config.frontend.url.map((n) => new URL(n).hostname);
  console.log(allowedHostnames);

  if (!allowedHostnames.includes(hostname)) {
    throw new Meiling.V1.Error.MeilingError(
      Meiling.V1.Error.ErrorType.INVALID_REQUEST,
      'provided hostname is not supported',
    );
  }

  const challengeResponse = body as RegisterProcess;

  const registering = challengeResponse.response !== undefined;
  const f2l = new Fido2Lib({});

  if (registering && body) {
    const webAuthnObject = session?.registering?.webAuthn;

    if (!webAuthnObject || !Utils.isNotBlank(webAuthnObject.challenge, webAuthnObject.hostname, webAuthnObject.origin))
      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.AUTHENTICATION_REQUEST_NOT_GENERATED);

    if (!Utils.isNotBlank(body.name))
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'missing webauthn token name',
      );

    if (!Utils.isNotBlank(challengeResponse.id))
      throw new Meiling.V1.Error.MeilingError(
        Meiling.V1.Error.ErrorType.INVALID_REQUEST,
        'malformed challengeResponse',
      );

    const attestationExpectations = {
      // Note: this should be matched with clientDataJSON.
      // basically fido2-lib is only doing string comparison
      challenge: Buffer.from(webAuthnObject.challenge).toString('base64url'),
      origin: webAuthnObject.origin,
      factor: 'either' as Factor,
    };

    try {
      challengeResponse.rawId = Buffer.from(challengeResponse.id as string, 'base64').buffer;

      console.log('Expecting:', attestationExpectations);

      const result = await f2l.attestationResult(challengeResponse as AttestationResult, attestationExpectations);
      console.log('FIDO Attestation Result', result);

      throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.NOT_IMPLEMENTED);
    } catch (e) {
      if ((e as Error).message.includes('clientData challenge mismatch')) {
        throw new Meiling.V1.Error.MeilingError(Meiling.V1.Error.ErrorType.UNAUTHORIZED, 'challenge mismatch');
      }

      // TODO: further debugging required.
      console.error('FIDO Attestation Error', e);

      throw e;
    }
  } else {
    const challenge = Meiling.Authentication.Token.generateToken(128);
    const origin = req.headers.origin ?? hostname;

    await Meiling.V1.Session.setSession(req, {
      ...session,
      registering: {
        ...session?.registering,
        webAuthn: {
          origin,
          hostname,
          challenge,
        },
      },
    });

    rep.send({
      challenge,
    });
  }
}

export default userWebAuthnActionPostKey;
