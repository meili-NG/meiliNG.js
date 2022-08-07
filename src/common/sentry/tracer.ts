import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import * as Sentry from '@sentry/node';
import Tracing, { Transaction } from '@sentry/tracing';
import config from '../../resources/config';
import { FastifyRequestWithSession } from '../../routes/v1/meiling';
import { getSessionFromRequest } from '../meiling/v1/session';
import { Meiling } from '..';

const DEFAULT_REQUEST_KEYS = ['headers', 'method', 'query_string', 'url'];

/**
 * Function copied from
 * https://github.com/getsentry/sentry-javascript/blob/master/packages/node/src/handlers.ts
 * and mofidied for Fastify
 *
 * Data (req.body) isn't available in onRequest hook,
 * as it is parsed later in the fastify lifecycle
 * https://www.fastify.io/docs/latest/Hooks/#onrequest
 */
function convertReq4Sentry(req: FastifyRequest, keys: string[] = DEFAULT_REQUEST_KEYS) {
  if (!keys || keys.length <= 0 || typeof keys !== 'object') {
    keys = DEFAULT_REQUEST_KEYS;
  }
  const requestData = {} as any;

  const headers = req.headers || {};
  const method = req.method;
  const host = req.hostname;
  const protocol = req.protocol;
  const originalUrl = req.url;
  const absoluteUrl = protocol + '://' + host + originalUrl;

  keys.forEach(function (key: string) {
    switch (key) {
      case 'headers':
        requestData.headers = headers;
        break;
      case 'method':
        requestData.method = method;
        break;
      case 'url':
        requestData.url = absoluteUrl;
        break;
      case 'query_string':
        requestData.query_string = Object.assign({}, req.query);
        break;
      default:
        if ({}.hasOwnProperty.call(req, key)) {
          requestData[key] = (req as any)[key];
        }
    }
  });

  return requestData;
}

export function registerSentryTransaction(app: FastifyInstance, opts: FastifyPluginOptions, done: () => void) {
  if (!isSentryAvailable()) {
    done();
    return;
  }

  Sentry.init({
    serverName: config.sentry?.serverName,
    dsn: config.sentry?.dsn,
    attachStacktrace: true,
    integrations: [new Sentry.Integrations.Http({ tracing: true })],
  });

  app.addHook('onRequest', async (req) => {
    let traceData;
    if (req.headers && typeof req.headers['sentry-trace'] === 'string') {
      const traceKey = req.headers['sentry-trace'];
      traceData = Tracing.extractTraceparentData(traceKey);
    }

    const req4Sentry = convertReq4Sentry(req);

    (req as any).sentryTransaction = Sentry.startTransaction(
      {
        op: 'http.server',
        name: `${req.method} ${req.url}`,
        ...traceData,
      },
      {
        request: req4Sentry,
      },
    );

    Sentry.setUser({
      ip_address: req.ip,
    });
  });

  app.addHook('onResponse', async (req, rep) => {
    setImmediate(() => {
      const tx = getSentryTransaction(req);
      if (tx) {
        tx.setData('url', req.url);
        tx.setData('query', req.query);
        if (typeof req.body === 'object') {
          tx.setData('body', req.body);
        }
        tx.setHttpStatus(rep.statusCode);

        if ((req as FastifyRequestWithSession).session) {
          tx.setData('session', getSessionFromRequest(req));
        }

        tx.finish();
      }
    });
  });
}

export function sentryErrorHandler(error: Error, req: FastifyRequest, rep: FastifyReply) {
  Sentry.withScope((scope) => {
    if ((error as Meiling.V1.Error.MeilingError)._isMeiling === true) {
      scope.setTag('is_meiling', true);
      Sentry.captureException(error);
    }
  });
}

export function isSentryAvailable() {
  if (config && config.sentry && typeof config.sentry.dsn === 'string' && config.sentry.dsn.trim() !== '') {
    return true;
  }

  return false;
}

export function getSentryTransaction(req: FastifyRequest): Transaction | undefined {
  if (isSentryAvailable()) {
    return (req as any).sentryTransaction as Transaction;
  }

  return;
}
