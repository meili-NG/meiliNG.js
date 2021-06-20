import { FastifyReply, FastifyRequest } from 'fastify';
import config from '../../../resources/config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pem2jwk = require('pem2jwk');

const oAuth2CertsHandler = (req: FastifyRequest, rep: FastifyReply): void => {
  rep.send({
    keys: [
      {
        kid: config.openid.jwt.keyId,
        ...pem2jwk(config.openid.jwt.publicKey),
      },
    ],
  });
};

export default oAuth2CertsHandler;
