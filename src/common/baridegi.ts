import axios from 'axios';
import config from '../resources/config';

export enum BaridegiLogType {
  NEW_SESSION = 'new_session',
  AUTHORIZE_APP = 'authorize_app',
  CREATE_AUTHORIZATION_REQUEST = 'create_authorization_request',
  VERIFY_AUTHORIZATION_REQUEST = 'verify_authorization_request',
  CREATE_PASSWORD_RESET_REQUEST = 'create_password_reset_request',
  USER_SIGNIN = 'user_signin',
  USER_SIGNOUT = 'user_signout',
}

export async function sendBaridegiLog(type: BaridegiLogType, metadata?: any): Promise<void> {
  if (
    !(
      config.baridegiApi?.integrationId &&
      config.baridegiApi.token &&
      config.baridegiApi.host &&
      config.baridegiApi.serverId
    )
  ) {
    return;
  }

  try {
    if (config.baridegiApi?.version === 1) {
      await axios.post(
        config.baridegiApi.host + '/v1/servers/' + config.baridegiApi.serverId + '/events/logs?type=' + type,
        {
          metadata,
        },
        {
          headers: {
            Authorization:
              'Baridegi ' +
              Buffer.from(config.baridegiApi.integrationId + ':' + config.baridegiApi.token).toString('base64'),
          },
        },
      );
    }
  } catch (e) {}
}
