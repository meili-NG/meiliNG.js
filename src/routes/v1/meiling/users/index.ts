import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { FastifyReply } from 'fastify/types/reply';
import { FastifyRequest } from 'fastify/types/request';
import { FastifyRequestWithSession } from '..';
import { getSanitizedUser } from '../../../../common/sanitize';
import { sendMeilingError } from '../error';
import { MeilingV1ErrorType } from '../interfaces';
import { userActionsHandler } from './actions';
import { userGetLoggedInUserInfo } from './actions/info/get';

export function userPlugin(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void): void {
  app.get('/', userGetLoggedInUserInfo);

  app.register(userActionsHandler, { prefix: '/:userId' });

  done();
}
