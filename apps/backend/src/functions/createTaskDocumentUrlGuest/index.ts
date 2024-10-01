const { REGION, STORAGE_BUCKETNAME, TABLE_TASK } = process.env;
import { Task } from 'dependency-layer/API';
import { getRecord, updateRecord } from 'dependency-layer/dynamoDB';
import { AppSyncIdentityIAM } from '@aws-appsync/utils';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AppSyncResolverHandler } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: REGION, apiVersion: '2012-10-17' });

const validateTask = (task: Task) => {
  if (!task) {
    throw new Error('INVALID_TASK');
  }

  if (!task?.documents?.[0]?.key) {
    console.log('NO DOCUMENT KEY FOR TASK', task?.documents);
    throw new Error('NO_DOCUMENT_FOR_TASK');
  }

  //TODO: LOGIC TO PREVENT EXPIRED TASK / DOCUMENTS FROM BEING ACCESSED
};

export const handler: AppSyncResolverHandler<any, any> = async (ctx) => {
  const { sourceIp, cognitoIdentityId } = ctx.identity as AppSyncIdentityIAM;
  const { taskId, entityId } = ctx.arguments.input;

  console.log('cognitoIdentityId: ', cognitoIdentityId);
  console.log('sourceIp: ', sourceIp);

  // get task
  let task: Task;
  try {
    task = await getRecord(TABLE_TASK ?? '', {
      id: taskId,
      entityId,
    });
    console.log('task: ', task);
  } catch (err: any) {
    console.log('ERROR get task: ', err);
    throw new Error(err.message);
  }

  validateTask(task);

  //let entityUser;
  //try {
  //  entityUser = await getRecord(TABLE_ENTITY_USER ?? '', {
  //    entityId,
  //    userId: sub,
  //  });
  //} catch (err: any) {
  //  console.log('ERROR get entity user: ', err);
  //  throw new Error(err.message);
  //}
  //
  //validateEntityUser(entityUser);

  if (!task.viewedAt) {
    // update task viewedAt
    try {
      await updateRecord(
        TABLE_TASK ?? '',
        {
          id: taskId,
          entityId,
        },
        {
          viewedAt: new Date().toISOString(),
        }
      );
    } catch (err: any) {
      console.log('ERROR update task viewedAt: ', err);
      throw new Error(err.message);
    }
  }

  if (task?.documents?.[0]) {
    // get document url from s3
    try {
      const expiresIn = 900; // seconds
      const getParams = {
        Bucket: STORAGE_BUCKETNAME,
        Key: `private/${task.documents[0].identityId}/${task.documents[0].key}`, //TODO: identityId for document upload by backend
        Expires: 900,
      };

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      const command = new GetObjectCommand(getParams);
      const signedUrl = await getSignedUrl(s3, command, { expiresIn });
      console.log('signedUrl: ', signedUrl);
      return {
        url: signedUrl,
        expiresAt: expiresAt.toISOString(),
      };
    } catch (err: any) {
      console.log('ERROR get document url: ', err);
      throw new Error(err.message);
    }
  }

  return {
    url: null,
    expiresAt: null,
  };
};
