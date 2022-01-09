import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { Meiling } from '../../../common';
import { BaridegiLogType, sendBaridegiLog } from '../../../common/event/baridegi';

export function sessionPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', async (req, rep) => {
    let token = Meiling.V1.Session.getTokenFromRequest(req);

    if (token) {
      const [isToken, isValid] = await Promise.all([
        Meiling.V1.Session.isToken(token),
        Meiling.V1.Session.isValid(token),
      ]);
      if (isToken && isValid) {
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
      token = await Meiling.V1.Session.createToken(req);
      sendBaridegiLog(BaridegiLogType.NEW_SESSION, {
        ip: req.ip,
        token: token,
      });

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

  done();
}
