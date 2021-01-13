import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { isDevelopment } from '../../..';
import { findMatchingUsersByUsernameOrEmail } from '../../../common/user';
import {
  createMeilingV1Token,
  getMeilingV1Session,
  getMeilingV1Token,
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
    if ((req.query as any)?.token === 'HongMeiling' && isDevelopment) {
      let session;
      try {
        session = await getMeilingV1Session(req);
      } catch (e) {
        sendMeilingError(rep, MeilingV1ErrorType.NOT_A_PROPER_SESSION);
        return;
      }

      rep.send(session);
      return;
    } else {
      if (req.headers.authorization) {
        if (isMeilingV1Token(getMeilingV1Token(req))) {
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
      } else if (req.session) {
        rep.send({
          success: true,
        });
        return;
      } else {
        rep.send({
          success: true,
          token: createMeilingV1Token(),
        });
        return;
      }
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
