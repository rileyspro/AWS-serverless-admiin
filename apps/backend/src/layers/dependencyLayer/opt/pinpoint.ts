import {
  PinpointClient,
  SendUsersMessagesCommand,
  SendUsersMessagesCommandInput,
} from '@aws-sdk/client-pinpoint';
import {
  PinpointEmail,
  SendEmailCommand,
} from '@aws-sdk/client-pinpoint-email';
import { SendEmailCommandInput } from '@aws-sdk/client-pinpoint-email/dist-types/commands/SendEmailCommand';

const { ENV, REGION, TEMPLATE_ARN, MEDIA_URL } = process.env;

const pinpointEmail = new PinpointEmail({
  region: REGION,
});
const pinpoint = new PinpointClient({
  region: REGION,
});

type SendEmailProps = {
  senderAddress: string;
  toAddresses: string[];
  templateName: string;
  templateData: Record<any, any>;
};
export const sendEmail = async ({
  senderAddress,
  toAddresses,
  templateName,
  templateData,
}: SendEmailProps) => {
  const emailTemplateData = {
    ...templateData,
    config: {
      mediaUrl: MEDIA_URL ?? '',
    },
  };

  console.log('emailTemplateData: ', emailTemplateData);

  const input: SendEmailCommandInput = {
    FromEmailAddress: senderAddress,
    Content: {
      Template: {
        TemplateArn: `${TEMPLATE_ARN}/Admiin${ENV}${templateName}/EMAIL`,
        TemplateData: JSON.stringify(emailTemplateData),
      },
    },
    Destination: {
      ToAddresses: toAddresses,
    },
    ReplyToAddresses: ['hello@admiin.com'],
  };

  console.log('input', input);

  const command = new SendEmailCommand(input);
  console.log('command', command);
  console.log('details', command.input.Content?.Template);
  console.log('details', command.input.Destination?.ToAddresses);
  return pinpointEmail.send(command);
};

interface SendPushNotificationProps {
  pinpointAppId: string;
  userId: string;
  title: string;
  message: string;
  badgeCount?: null | number;
  data?: Record<any, any>;
}

export const sendPushNotification = async ({
  pinpointAppId,
  userId,
  title,
  message,
  badgeCount = null,
  data = {},
}: SendPushNotificationProps) => {
  const input: SendUsersMessagesCommandInput = {
    ApplicationId: pinpointAppId,
    SendUsersMessageRequest: {
      Users: {
        [userId]: {},
      },
      MessageConfiguration: {
        APNSMessage: {
          Action: 'OPEN_APP',
          Title: title,
          SilentPush: false,
          Sound: 'default',
          Body: message,
          Data: data,
        },
        GCMMessage: {
          Action: 'OPEN_APP',
          Title: title,
          SilentPush: false,
          Sound: 'default',
          Body: message,
          Data: data,
        },
      },
    },
  };

  if (
    badgeCount &&
    input?.SendUsersMessageRequest?.MessageConfiguration?.APNSMessage
  ) {
    input.SendUsersMessageRequest.MessageConfiguration.APNSMessage.Badge =
      badgeCount;
  }

  const command = new SendUsersMessagesCommand(input);
  return pinpoint.send(command);
};

interface SendUsersPushNotificationProps {
  pinpointAppId: string;
  userIds: string[];
  title: string;
  message: string;
  badgeCount?: null | number;
  data?: Record<any, any>;
}
export const sendUsersPushNotification = async ({
  pinpointAppId,
  userIds,
  title,
  message,
  badgeCount = null,
  data = {},
}: SendUsersPushNotificationProps) => {
  // map data for sending push notifications to users
  const usersData: Record<string, any> = {};
  userIds.forEach((userId) => {
    usersData[userId] = {};
  });

  const input: SendUsersMessagesCommandInput = {
    ApplicationId: pinpointAppId,
    SendUsersMessageRequest: {
      Users: usersData,
      MessageConfiguration: {
        APNSMessage: {
          Action: 'OPEN_APP',
          Title: title,
          SilentPush: false,
          Sound: 'default',
          Body: message,
          Data: data,
        },
        GCMMessage: {
          Action: 'OPEN_APP',
          Title: title,
          SilentPush: false,
          Sound: 'default',
          Body: message,
          Data: data,
        },
      },
    },
  };

  if (
    badgeCount &&
    input?.SendUsersMessageRequest?.MessageConfiguration?.APNSMessage
  ) {
    input.SendUsersMessageRequest.MessageConfiguration.APNSMessage.Badge =
      badgeCount;
  }

  const command = new SendUsersMessagesCommand(input);
  return pinpoint.send(command);
};
