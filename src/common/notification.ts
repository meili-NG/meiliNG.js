import axios from 'axios';
import config from '../config';

export enum TemplateLanguage {
  KOREAN = 'ko',
  ENGLISH = 'en',
}

export enum TemplateId {
  AUTHORIZATION_CODE = 'authorization_code',
}

export enum NotificationMethod {
  SMS = 'sms',
  ALIMTALK = 'alimtalk',
  EMAIL = 'email',
}

type NotificationPayload = SMSPayload | AlimtalkPayload | CallPayload;

type SMSPayload = SMSPlainPayload | TemplatePayload;
type AlimtalkPayload = TemplatePayload;
type CallPayload = AuthorizationCodeCallPayload;

// Not Recommended. Please use Template.
interface SMSPlainPayload {
  type: 'plain';
  messages: PlainMessagePayload[];
}

interface TemplatePayload {
  type: 'template';
  templateId: TemplateId;
  lang: TemplateLanguage;
  messages: TemplateMessagePayload[];
}

interface TemplateMessagePayload {
  to: string;
  variables: {
    [key: string]: string;
  };
}

interface PlainMessagePayload {
  to: string;
  message: string;
}

interface AuthorizationCodeCallPayload {
  type: 'authorization_code';
  to: string;
  lang: TemplateLanguage;
  code: string;
}

export async function sendNotification(method: NotificationMethod, query: NotificationPayload) {
  const notificationApi = config.notificationApi;
  if (!notificationApi) {
    throw new Error('Notification API was not configured properly.');
  }

  const version = notificationApi.version;

  const host = notificationApi.host;
  const key = notificationApi.key;

  if (notificationApi.version === 1) {
    await axios.post(`${host}/v1/${method}`, query, {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
  } else {
    throw new Error('Unsupported Notification API Version: ' + version);
  }

  return;
}
