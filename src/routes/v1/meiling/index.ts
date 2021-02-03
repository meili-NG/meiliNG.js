import { FastifyInstance } from 'fastify';
import { config, isDevelopment } from '../../..';
import { registerV1MeilingAppsEndpoints } from './apps';
import { MeilingV1Session } from './common';
import { sendMeilingError } from './error';
import { MeilingV1ErrorType } from './interfaces';
import { meilingV1SigninHandler } from './signin';
import { meilingV1SignoutHandler } from './signout';
import { meilingV1SignupHandler } from './signup';
import { registerV1MeilingUserEndpoints } from './users';

export function registerV1MeilingEndpoints(app: FastifyInstance) {
  app.post('/signin', meilingV1SigninHandler);
  app.post('/signup', meilingV1SignupHandler);

  app.get('/signout', meilingV1SignoutHandler);
  app.get('/signout/:userId', meilingV1SignoutHandler);

  app.get('/session', async (req, rep) => {
    if ((req.query as any)?.token && (req.query as any)?.token !== '') {
      const authToken = (req.query as any)?.token;
      console.log('[ Debug ] Session Debug Request: ', authToken);

      if (config.session.v1.debugTokens.includes(authToken)) {
        if (isDevelopment) {
          rep.send(await MeilingV1Session.getSessionFromRequest(req));
        } else {
          sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: not in development mode.');
        }
      } else {
        sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'unauthorized: invalid token.');
      }
      return;
    }

    let token = MeilingV1Session.getTokenFromRequest(req);

    if (token) {
      if (await MeilingV1Session.isToken(token)) {
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
      token = await MeilingV1Session.createToken(req);
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

  app.get('/', (req, rep) => {
    rep.send({
      version: 1,
      engine: 'Meiling Project',
      api: 'Meiling Endpoints',
    });
  });

  registerV1MeilingUserEndpoints(app, '/users');
  registerV1MeilingAppsEndpoints(app, '/apps');
}
