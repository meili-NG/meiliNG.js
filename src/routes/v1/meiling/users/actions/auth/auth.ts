import { Permission } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MeilingV1UserOAuthAuthQuery } from '.';
import { isMeilingV1UserActionPermitted } from '..';
import { prisma } from '../../../../../..';
import { Client, ClientAccessControls, ClientAuthorization, Token, User, Utils } from '../../../../../../common';
import { OAuth2QueryResponseType } from '../../../../oauth2/interfaces';
import { sendMeilingError } from '../../../error';
import { MeilingV1ErrorType } from '../../../interfaces';

export async function meilingV1OAuthClientAuthHandler(req: FastifyRequest, rep: FastifyReply) {
  // user/* common auth section
  const userBase = await isMeilingV1UserActionPermitted(req);
  if (userBase === undefined) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid request.');
    return;
  } else if (userBase === null) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'you are not logged in as specified user.');
    return;
  }

  // get parameters and query
  const query = req.query as MeilingV1UserOAuthAuthQuery;

  // validate
  if (!Utils.isValidValue(query.client_id, query.redirect_uri, query.response_type, query.scope)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing query.');
    return;
  }

  // get userData of selected user
  const userData = await User.getDetailedInfo(userBase);
  if (!userData) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'unable to fetch user from DB.');
    return;
  }

  // get client via clientId.
  const clientId = query.client_id;
  const client = await Client.getByClientId(clientId);
  if (client === null) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.APPLICATION_NOT_FOUND,
      'oAuth2 application with specified client_id does not exist',
    );
    return;
  }

  // load access control
  const acl = await Client.getAccessControl(clientId);
  if (!acl) {
    sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'Failed to get Access Control from Server.');
    return;
  }

  // is this user able to pass client check
  const clientPrivateCheck = await ClientAccessControls.checkUsers(acl, userBase);
  if (!clientPrivateCheck) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'specified oAuth2 application is inaccessible');
    return;
  }

  // check permissions are valid or not
  const scopes = Utils.getUnique(query.scope.split(' '), (m, n) => m === n);

  const permissionsPromise: Promise<Permission | null>[] = [];
  scopes.forEach((scope) =>
    permissionsPromise.push(
      prisma.permission.findFirst({
        where: {
          name: scope,
        },
      }),
    ),
  );

  // permissions that were requested
  const requestedPermissions = (await Promise.all(permissionsPromise)) as Permission[];

  // find unsupported scope
  const unsupportedScopes = requestedPermissions
    .map((n, i) => (n === null ? scopes[i] : undefined))
    .filter((j) => j !== undefined);
  if (unsupportedScopes.length > 0) {
    // invalid permissions found!
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNSUPPORTED_SCOPE,
      `the scope: (${unsupportedScopes.join(' ')}) is not supported`,
    );
    return;
  }

  const areScopesAllowed = await ClientAccessControls.checkPermissions(acl, requestedPermissions);
  if (areScopesAllowed !== true) {
    if (areScopesAllowed === false) {
      sendMeilingError(rep, MeilingV1ErrorType.INTERNAL_SERVER_ERROR, 'Failed to get Access Control from Server.');
      return;
    } else {
      const deniedScopes = areScopesAllowed.map((n) => n.name);
      sendMeilingError(
        rep,
        MeilingV1ErrorType.APPLICATION_NOT_AUTHORIZED_SCOPES,
        `the scope (${deniedScopes.join(' ')}) is not authorized`,
      );
      return;
    }
  }

  const permissionsByUser = await User.getClientAuthorizedPermissions(userData, clientId);

  if (Utils.string2Boolean(query.include_granted_scopes)) {
    requestedPermissions.push(...permissionsByUser);
  }

  // check for redirectUris
  const redirectUriCheck = await Client.isValidRedirectURI(clientId, query.redirect_uri);

  // if no redirectUri rule that meets user provided redirectUri
  if (!redirectUriCheck) {
    // callback match failed
    sendMeilingError(
      rep,
      MeilingV1ErrorType.APPLICATION_REDIRECT_URI_INVALID,
      `${query.redirect_uri} is not in pre-defined redirect uri.`,
    );
    return;
  }

  const authorization = await Client.createAuthorization(clientId, userBase, requestedPermissions);

  if (query.response_type === OAuth2QueryResponseType.CODE) {
    const code = await ClientAuthorization.createToken(authorization, 'AUTHORIZATION_CODE', {
      version: 1,
      shouldGenerate: {
        refreshToken: query.access_type === 'offline',
      },
    });

    rep.send({
      code,
    });
    return;
  } else if (query.response_type === OAuth2QueryResponseType.TOKEN) {
    const access_token = await ClientAuthorization.createToken(authorization, 'ACCESS_TOKEN');

    rep.send({
      access_token,
      token_type: 'Bearer',
      expires_in: Token.getValidTimeByType('ACCESS_TOKEN'),
    });
    return;
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'invalid response_type: (' + query.response_type + ') .');
    return;
  }
}
