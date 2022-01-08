import { OAuthClientRedirectUris } from '@prisma/client';

export function getMatchingRedirectURIs(
  redirectUri: string,
  redirectUris: (OAuthClientRedirectUris | string)[],
): (OAuthClientRedirectUris | string)[] {
  let adequateRedirectUris;

  if (redirectUri.startsWith('urn:ietf:wg:oauth:2.0')) {
    adequateRedirectUris = redirectUris.filter((n) => {
      if (typeof n === 'string') {
        return n === redirectUri;
      } else {
        return n.redirectUri === redirectUri;
      }
    });
  } else {
    const redirectURL = new URL(redirectUri);

    adequateRedirectUris = redirectUris.filter((n) => {
      const thisRedirectUri = typeof n === 'string' ? n : n.redirectUri;

      let url;
      try {
        url = new URL(thisRedirectUri);
      } catch (e) {
        return false;
      }

      return (
        url.protocol === redirectURL.protocol &&
        url.port === redirectURL.port &&
        url.hostname === redirectURL.hostname &&
        url.pathname === redirectURL.pathname
      );
    });
  }

  return adequateRedirectUris;
}
