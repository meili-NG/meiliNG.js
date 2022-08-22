import { FastifyReply, FastifyRequest } from 'fastify';
import config from '../../../resources/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pem2jwk = require('pem2jwk');

const oAuth2CertsHandler = (req: FastifyRequest, rep: FastifyReply): void => {
  let alg = config.openid.jwt.algorithm;
  if ((alg as string) === 'ES256K') {
    alg = 'ES256';
  }

  rep.send({
    keys: [
      {
        alg,
        kid: config.openid.jwt.keyId,
        use: 'sig',
        ...pem2jwk(config.openid.jwt.publicKey),
      },
    ],
  });
};

export default oAuth2CertsHandler;
