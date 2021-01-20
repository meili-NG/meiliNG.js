import { Permission } from '@prisma/client';
import { FastifyRequest, FastifyReply } from 'fastify';
import { isMeilingV1UserActionPermitted, MeilingV1UserActionsParams } from '.';
import { prisma } from '../../../../..';
import { getBooleanFromString, isNotUndefinedOrNullOrBlank } from '../../../../../common';
import {
  authenticateClientAndGetResponseToken,
  getClientRedirectUris,
  getOAuth2ClientByClientId,
  isClientAccessible,
} from '../../../../../common/client';
import { getAllUserInfo } from '../../../../../common/user';
import { OAuth2QueryAccessType, OAuth2QueryResponseType } from '../../../oauth2/interfaces';
import { sendMeilingError } from '../../error';
import { MeilingV1ErrorType } from '../../interfaces';

type MeilingV1UserOAuthAuthParams = MeilingV1UserActionsParams;
type MeilingV1UserOAuthAuthQuery = MeilingV1UserOAuthAuthAuthorizationCodeQuery;

interface MeilingV1UserOAuthAuthBaseQuery {
  // oAuth parameters
  client_id: string;
  scope: string;
  access_type?: OAuth2QueryAccessType;
  include_granted_scopes?: string;
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
  if (
    !isNotUndefinedOrNullOrBlank(
      query.access_type,
      query.client_id,
      query.redirect_uri,
      query.response_type,
      query.scope,
    )
  ) {
    sendMeilingError(rep, MeilingV1ErrorType.INVALID_REQUEST, 'missing query.');
    return;
  }

  // get userData of selected user
  const userData = await getAllUserInfo(userBase);

  // get client via clientId.
  const clientId = query.client_id;
  const client = await getOAuth2ClientByClientId(clientId);
  if (client === null) {
    sendMeilingError(
      rep,
      MeilingV1ErrorType.APPLICATION_NOT_FOUND,
      'oAuth2 application with specified client_id does not exist',
    );
    return;
  }

  // is this user able to pass client check
  const clientPrivateCheck = await isClientAccessible(clientId, userBase);
  if (!clientPrivateCheck) {
    sendMeilingError(rep, MeilingV1ErrorType.UNAUTHORIZED, 'specified oAuth2 application is inaccessible');
    return;
  }

  // check permissions are valid or not
  const scopes = query.scope.split(' ');

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
  const unsupportedScope = requestedPermissions.filter((n) => n === null);
  if (unsupportedScope.length > 0) {
    // invalid permissions found!
    sendMeilingError(
      rep,
      MeilingV1ErrorType.UNSUPPORTED_SCOPE,
      `the scope: (${unsupportedScope.join(' ')}) is not supported`,
    );
    return;
  }

  // permission check agains already authorized application
  let isUserAllowed = false;

  if (userData?.authorizedApps) {
    // check user previously authenticated this app.
    const userClient = userData.authorizedApps.find((n) => n.oAuthClientId === clientId);

    // if authenticated.
    if (userClient !== null) {
      // check permissions
      const authorizedPermissions = await prisma.permission.findMany({
        where: {
          OAuthClientAuthorization: userClient,
        },
      });

      const unAuthorizedPermissions = requestedPermissions.filter(
        (p) => authorizedPermissions.find((q) => q.name === (p as Permission).name) === null,
      );

      // everything is authorized
      if (unAuthorizedPermissions.length === 0) {
        isUserAllowed = true;
      }
    }
  }

  if (!isUserAllowed) {
    sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_AUTHENTICATED);
    return;
  }

  if (query.response_type === 'code') {
    // check for redirectUris
    const redirectUris = await getClientRedirectUris(clientId);
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

    if (isUserAllowed) {
      // TODO: Generate Code

      const code = await authenticateClientAndGetResponseToken(
        clientId,
        query.response_type,
        userBase,
        requestedPermissions,
        true,
      );
    } else {
      sendMeilingError(rep, MeilingV1ErrorType.APPLICATION_NOT_AUTHENTICATED);
      return;
    }
    return;
  } else {
    sendMeilingError(rep, MeilingV1ErrorType.UNSUPPORTED_RESPONSE_TYPE);
  }
}
