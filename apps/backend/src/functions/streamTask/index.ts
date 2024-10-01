const { FROM_EMAIL, WEB_DOMAIN } = process.env;
import {
  Activity,
  ActivityType,
  Task,
  TaskPaymentStatus,
  TaskSignatureStatus,
  TaskStatus,
  TaskType,
} from 'dependency-layer/API';
import { batchPut, createRecord, getRecord } from 'dependency-layer/dynamoDB';
import { sendInvoiceEmail } from 'dependency-layer/payment';
import { sendEmail } from 'dependency-layer/pinpoint';
import {
  AnnotationDocument,
  getCreatedAnnotations,
  getUpdatedAnnotations,
  sendSignatureEmail,
} from 'dependency-layer/task';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBStreamHandler } from 'aws-lambda';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import { updateReferral } from 'dependency-layer/user';

const { TABLE_ACTIVITY, TABLE_ENTITY_USER, TABLE_CONTACT, TABLE_USER } =
  process.env;

const handleInsert = async (task: Task) => {
  // create task activity
  try {
    await createActivity(
      task,
      task.status === TaskStatus.DRAFT ? 'TASK_DRAFT' : 'TASK_CREATED'
    );
  } catch (err: any) {
    console.log('ERROR create activity: ', err);
  }

  if (task.annotations) {
    const updatedAnnotations = getCreatedAnnotations({
      newAnnotations: task.annotations as
        | AnnotationDocument
        | null
        | undefined
        | any, //TODO: fix type once schema defined for annotations
    });
    for (const annotation of updatedAnnotations) {
      let entityUser;
      let name = '';
      if (
        annotation.customData.signerType === 'ENTITY_USER' &&
        annotation.customData?.userId &&
        annotation.customData?.entityId
      ) {
        try {
          entityUser = await getRecord(TABLE_ENTITY_USER ?? '', {
            entityId: annotation.customData.entityId,
            userId: annotation.customData.userId,
          });
        } catch (err) {
          console.log('ERROR get entity user: ', err);
        }

        if (entityUser) {
          name = `${entityUser.firstName} ${entityUser.lastName}`;
        }
      }

      if (
        annotation.customData.signerType === 'CONTACT' &&
        annotation.customData?.contactId
      ) {
        let contact;
        try {
          contact = await getRecord(TABLE_CONTACT ?? '', {
            id: annotation.customData.contactId,
          });
        } catch (err) {
          console.log('ERROR get contact: ', err);
        }

        if (contact) {
          name = `${contact.firstName} ${contact.lastName}`;
        }
      }

      if (name) {
        try {
          await createActivity(
            task,
            'TASK_USER_SIGNED',
            annotation.customData.userId,
            name
          );
        } catch (err) {
          console.log('ERROR create activity: ', err);
        }
      }
    }
  }

  // signature requested
  if (
    task.type === TaskType.SIGN_ONLY &&
    //task.entityIdBy !== task.toId &&
    task.status !== TaskStatus.DRAFT
  ) {
    try {
      await sendSignatureEmail(task, 'signature');
    } catch (err) {
      console.log('ERROR send signature email: ', err);
    }
  }

  // payment requested
  else if (
    task.paymentStatus === TaskPaymentStatus.PENDING_PAYMENT &&
    task.entityIdBy !== task.toId &&
    task.status !== TaskStatus.DRAFT
  ) {
    try {
      await sendInvoiceEmail(task, 'invoice');
    } catch (err) {
      console.log('ERROR send invoice email: ', err);
    }
  }
};

const handleModify = async (newTask: Task, oldTask: Task) => {
  // task activity for signatures
  const activityMessages: {
    message: string;
    userId?: string;
    entityId?: string;
    contactId?: string;
    signerType?: string;
  }[] = getUpdatedActivityMessages(newTask, oldTask);
  if (activityMessages.length > 0) {
    const activityRecords: any[] = [];
    const dateNow = new Date();
    for (let index = 0; index < activityMessages.length; index++) {
      const { message, userId, entityId, contactId, signerType } =
        activityMessages[index];
      let name = '';
      if (signerType === 'ENTITY_USER') {
        let entityUser;
        try {
          entityUser = await getRecord(TABLE_ENTITY_USER ?? '', {
            entityId,
            userId,
          });

          name = `${entityUser?.firstName ?? ''} ${entityUser?.lastName ?? ''}`;
        } catch (err) {
          console.log('ERROR get entity user: ', err);
        }
      }

      if (signerType === 'CONTACT') {
        let contact;
        try {
          contact = await getRecord(TABLE_CONTACT ?? '', {
            id: contactId,
          });

          name = `${contact?.firstName ?? ''} ${contact?.lastName ?? ''}`;
        } catch (err) {
          console.log('ERROR get contact: ', err);
        }
      }

      // dateNow + index as milliseconds to isostring
      const createdAt = new Date(dateNow.getTime() + index).toISOString();
      const activity = createActivityObject(
        newTask,
        message,
        createdAt,
        userId,
        name
      );

      activityRecords.push(activity);

      // signed email notification to createdBy

      let user;
      try {
        user = await getRecord(TABLE_USER ?? '', {
          id: newTask.createdBy,
        });
      } catch (err: any) {
        console.log('ERROR get user: ', err);
      }

      if (user?.email) {
        try {
          await sendEmail({
            senderAddress: FROM_EMAIL ?? '',
            templateName: 'document-signed',
            toAddresses: [user.email],
            templateData: {
              user,
              task: {
                ...newTask,
                url: `${WEB_DOMAIN}/guest/pay-task?entityId=${newTask.entityId}&taskId=${newTask.id}`,
              },
              signer: {
                name,
                dateSignedFormatted: DateTime.fromISO(createdAt).toLocaleString(
                  DateTime.DATE_HUGE
                ),
              },
            },
          });
        } catch (err: any) {
          console.log('ERROR send email: ', err);
        }
      }
    }
    console.log('activityRecords: ', activityRecords);

    try {
      await batchPut({
        tableName: TABLE_ACTIVITY ?? '',
        items: activityRecords,
      });
    } catch (err) {
      console.log('ERROR batch put activity: ', err);
    }
  }

  // signature requested email
  if (
    newTask.type === TaskType.SIGN_ONLY &&
    newTask.entityIdBy !== newTask.toId &&
    oldTask.status === TaskStatus.DRAFT &&
    newTask.status !== TaskStatus.DRAFT
  ) {
    try {
      await sendSignatureEmail(newTask, 'signature');
    } catch (err) {
      console.log('ERROR send signature email: ', err);
    }
  }

  // payment requested email
  else if (
    newTask.paymentStatus === TaskPaymentStatus.PENDING_PAYMENT &&
    newTask.entityIdBy !== newTask.toId &&
    oldTask.status === TaskStatus.DRAFT &&
    newTask.status !== TaskStatus.DRAFT
  ) {
    try {
      await sendInvoiceEmail(newTask, 'invoice');
    } catch (err) {
      console.log('ERROR send invoice email: ', err);
    }
  }

  if (newTask.status !== oldTask.status) {
    if (newTask.status === TaskStatus.COMPLETED)
      try {
        await updateReferral(newTask);
      } catch (err) {
        console.log('ERROR updateReferral: ', err);
      }
  }
};

const getUpdatedActivityMessages = (newTask: Task, oldTask: Task) => {
  const activityMessages: {
    message: string;
    userId?: string;
    entityId?: string;
    contactId?: string;
    signerType?: string;
  }[] = [];

  const updatedAnnotations = getUpdatedAnnotations({
    oldAnnotations: oldTask.annotations as
      | AnnotationDocument
      | null
      | undefined,
    newAnnotations: newTask.annotations as
      | AnnotationDocument
      | null
      | undefined,
  });
  console.log('updatedAnnotations: ', updatedAnnotations);
  for (const annotation of updatedAnnotations) {
    if (
      annotation.customData.signerType === 'ENTITY_USER' &&
      annotation.customData?.userId &&
      annotation.customData?.userId !== 'undefined' && //TODO: should undefined be even saved?
      annotation.customData?.entityId
    ) {
      activityMessages.push({
        message: 'TASK_USER_SIGNED',
        userId: annotation.customData.userId,
        entityId: annotation.customData.entityId,
        signerType: annotation.customData.signerType,
      });
    } else if (
      annotation.customData.signerType === 'CONTACT' &&
      annotation.customData?.contactId &&
      annotation.customData?.contactId !== 'undefined'
    ) {
      activityMessages.push({
        message: 'TASK_USER_SIGNED',
        contactId: annotation.customData.contactId,
        signerType: annotation.customData.signerType,
      });
    }
  }

  if (
    newTask.signatureStatus !== oldTask.signatureStatus &&
    newTask.signatureStatus === TaskSignatureStatus.SIGNED
  ) {
    activityMessages.push({ message: 'TASK_SIGNED' });
  }

  if (newTask.viewedAt && !oldTask.viewedAt) {
    activityMessages.push({ message: 'TASK_VIEWED' });
  }

  if (newTask.paymentStatus !== oldTask.paymentStatus) {
    if (newTask.paymentStatus === TaskPaymentStatus.PAID)
      activityMessages.push({ message: 'TASK_PAID' });
    else if (newTask.paymentStatus === TaskPaymentStatus.MARKED_AS_PAID)
      activityMessages.push({ message: 'TASK_MARKED_AS_PAID' });
  }

  if (newTask.status !== oldTask.status) {
    if (newTask.status === TaskStatus.COMPLETED)
      activityMessages.push({ message: 'TASK_COMPLETED' });
    else if (newTask.status === TaskStatus.ARCHIVED)
      activityMessages.push({ message: 'TASK_ARCHIVED' });
    else if (newTask.status === TaskStatus.SCHEDULED)
      activityMessages.push({ message: 'TASK_SCHEDULED' });
  }

  return activityMessages;
};

const createActivity = async (
  task: Task,
  message: string,
  userId?: string,
  name?: string
) => {
  const activity = createActivityObject(
    task,
    message,
    new Date().toISOString(),
    userId,
    name
  );
  await createRecord(TABLE_ACTIVITY ?? '', activity);
};

const createActivityObject = (
  task: Task,
  message: string,
  createdAt: string,
  userId?: string,
  name?: string
): Activity => {
  return {
    id: randomUUID(),
    compositeId: `${task.entityId}#${task.id}`,
    message,
    userId: userId ?? task.createdBy,
    entityId: task.entityId,
    type: ActivityType.TASK,
    createdAt,
    updatedAt: createdAt,
    metadata: name
      ? { name, __typename: 'ActivityMetadata' }
      : { __typename: 'ActivityMetadata' },
    __typename: 'Activity',
  };
};

export const handler: DynamoDBStreamHandler = async (event) => {
  for (const data of event.Records) {
    if (data.eventName === 'INSERT' && data?.dynamodb?.NewImage) {
      const task = unmarshall(
        data.dynamodb.NewImage as { [key: string]: AttributeValue }
      ) as Task;
      console.log('INSERT task: ', JSON.stringify(task));
      await handleInsert(task);
    }

    if (
      data.eventName === 'MODIFY' &&
      data?.dynamodb?.NewImage &&
      data?.dynamodb?.OldImage
    ) {
      const newTask = unmarshall(
        data.dynamodb.NewImage as { [key: string]: AttributeValue }
      ) as Task;
      const oldTask = unmarshall(
        data.dynamodb.OldImage as { [key: string]: AttributeValue }
      ) as Task;
      console.log('MODIFY newTask: ', JSON.stringify(newTask));
      console.log('MODIFY oldTask: ', JSON.stringify(oldTask));
      await handleModify(newTask, oldTask);
    }
  }
};
