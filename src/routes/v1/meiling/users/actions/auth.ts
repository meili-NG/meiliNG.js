import { Permission } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';
import { isMeilingV1UserActionPermitted, MeilingV1UserActionsParams } from '.';
import { config, prisma } from '../../../../..';
import { Client, ClientAccessControls, getUnique, isNotUndefinedOrNullOrBlank, User } from '../../../../../common';
import { OAuth2QueryResponseType } from '../../../oauth2/interfaces';
import { sendMeilingError } from '../../error';
import { MeilingV1ErrorType } from '../../interfaces';

type MeilingV1UserOAuthAuthParams = MeilingV1UserActionsParams;
type MeilingV1UserOAuthAuthQuery = MeilingV1UserOAuthAuthAuthorizationCodeQuery;

interface MeilingV1UserOAuthAuthBaseQuery {
  // oAuth parameters
  client_id: string;
  scope: string;
  response_type: OAuth2QueryResponseType;
}

interface MeilingV1UserOAuthAuthAuthorizationCodeQuery extends MeilingV1UserOAuthAuthBaseQuery {
  response_type: 'code';
  redirect_uri: string;
}

export async function meilingV1OAuthApplicationAuthCheckHandler(req: FastifyRequest, rep: FastifyReply) {
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
  if (!isNotUndefinedOrNullOrBlank(query.client_id, query.redirect_uri, query.response_type, query.scope)) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing query.');
    return;
  }

  // get userData of selected user
  const userData = await User.getDetailedInfo(userBase);

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
  const scopes = getUnique(query.scope.split(' '), (m, n) => m === n);

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
  const requestedPermissions = ((await Promise.all(permissionsPromise)) as unknown) as Permission[];

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
        `the scope: (${deniedScopes.join(' ')}) is not authorized`,
      );
      return;
    }
  }

  // permission check agains already authorized application
  let hasUserPassedPermissionCheck = false;

  if (userData?.authorizedApps) {
    // check user previously authenticated this app.
    const authorizedPermissions = await User.getClientAuthorizedPermissions(userData, clientId);

    // if authenticated.
    if (authorizedPermissions) {
      // check permissions

      const unAuthorizedPermissions = requestedPermissions.filter(
        (p) => authorizedPermissions.find((q) => q.name === (p as Permission).name) === null,
      );

      // everything is authorized
      if (unAuthorizedPermissions.length === 0) {
        hasUserPassedPermissionCheck = true;
      }
    }
  }

  if (config.oauth2.skipAuthentication.includes(client.id)) {
    // bypass user authentication
    hasUserPassedPermissionCheck = true;
  }

  if (query.response_type === 'code') {
    // check for redirectUris
    const redirectUris = await Client.getRedirectUris(clientId);
    const redirectURL = new URL(query.redirect_uri);

    const adequateRedirectUris = redirectUris.filter((n) => {
      const url = new URL(n);

      return (
        url.protocol === redirectURL.protocol &&
        url.port === redirectURL.port &&
        url.hostname === redirectURL.hostname &&
        url.pathname === redirectURL.pathname
      );
    });

    // if no redirectUri rule that meets user provided redirectUri
    if (adequateRedirectUris.length === 0) {
      // callback match failed
      sendMeilingError(
        rep,
        MeilingV1ErrorType.APPLICATION_REDIRECT_URI_INVALID,
        `${query.redirect_uri} is not in pre-defined redirect uri.`,
      );
      return;
    }

    if (hasUserPassedPermissionCheck) {
      // TODO: Generate Code

      const code = await authenticateClientAndGetResponseToken(
        clientId,
        query.response_type,
        userBase,
        requestedPermissions,
        true,
      );

      rep.send({
        code,
      });
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_AUTHORIZED_BY_USER);
      return;
    }
    return;
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_RESPONSE_TYPE);
    return;
  }
}
