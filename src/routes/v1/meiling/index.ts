import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { config, isDevelopment } from '../../..';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import {
  createMeilingV1Token,
  getMeilingV1Session,
  getMeilingV1TokenFromRequest,
  isMeilingV1Token,
  setMeilingV1Session,
} from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignoutHandler } from './signout';
import { meilingV1SignupHandler } from './signup';
import { registerV1MeilingUserEndpoints } from './users';

export function registerV1MeilingEndpoints(app: FastifyInstance, baseURI: string) {
  app.post(baseURI + '/signin', meilingV1SigninHandler);
  app.post(baseURI + '/signup', meilingV1SignupHandler);

  app.get(baseURI + '/signout', meilingV1SignoutHandler);
  app.get(baseURI + '/signout/:uuid', meilingV1SignoutHandler);

  app.get(baseURI + '/session', async (req, rep) => {
    if ((req.query as any)?.token && (req.query as any)?.token !== '') {
      const authToken = (req.query as any)?.token;
      console.log('debug Feature:', authToken);

      if (config.session.v1.debugTokens.includes(authToken)) {
        if (isDevelopment) {
          rep.send(getMeilingV1Session(req));
        } else {
          sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: not in development mode.');
        }
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: invalid token.');
      }
      return;
    }

    let token = getMeilingV1TokenFromRequest(req);

    if (token) {
      if (isMeilingV1Token(token)) {
        rep.send({
          success: true,
        });
        return;
      } else {
        rep.send({
          success: false,
        });
        return;
      }
    } else {
      token = createMeilingV1Token(req);
      if (token) {
        rep.send({
          success: true,
          token,
        });
      } else {
        rep.send({
          success: false,
        });
      }
      return;
    }
  });

  app.get(baseURI, (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Engine',
      api: 'Meiling Endpoints',
    });
  });

  registerV1MeilingUserEndpoints(app, baseURI + '/users');
}

async function meilingV1UserExistHandler(req: FastifyRequest, rep: FastifyReply) {
  if ((req.query as any)?.username) {
    const username = (req.query as any)?.username;
    const users = await findMatchingUsersByUsernameOrEmail(username);

    rep.send({
      exist: users.length > 0,
    });
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'username is missing.');
    return;
  }
}
