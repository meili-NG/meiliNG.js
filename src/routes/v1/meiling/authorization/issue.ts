import { FastifyReply, FastifyRequest } from 'fastify';
import { FastifyRequestWithSession } from '..';
import * as Utils from '../../../../common/utils';

type MeilingV1AuthorizationIssueQuery = MeilingV1AuthorizationIssueEmailQuery | MeilingV1AuthorizationIssuePhoneQuery;

interface MeilingV1AuthorizationIssueEmailQuery {
  type: 'email';
  to: string;
}

interface MeilingV1AuthorizationIssuePhoneQuery {
  type: 'phone';
  to: string;
}

export async function meilingV1AuthorizationIssueHandler(req: FastifyRequest, rep: FastifyReply) {
  const session = (req as FastifyRequestWithSession).session;
  const body = req.body as MeilingV1AuthorizationIssueQuery;

  const createdAt = new Date();

  if (body.type === 'email') {
    if (!Utils.isValidEmail(body.to)) {
    }
  } else if (body.type === 'phone') {
  } else {
  }
}
