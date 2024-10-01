const {
  AWS_REGION,
  STORAGE_BUCKETNAME,
  TABLE_JOB,
  SNS_TOPIC_ARN,
  SNS_TOPIC_ROLE_ARN,
} = process.env;
import { createRecord } from 'dependency-layer/dynamoDB';
import { validateIsEntityUser } from 'dependency-layer/entity';
import { AppSyncIdentityCognito } from '@aws-appsync/utils';
import { AppSyncResolverHandler } from 'aws-lambda';
import {
  TextractClient,
  StartExpenseAnalysisCommand,
  StartExpenseAnalysisCommandInput,
  StartDocumentAnalysisCommand,
  StartDocumentAnalysisRequest,
} from '@aws-sdk/client-textract';
import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';

const textExtract = new TextractClient({ region: AWS_REGION });

export const handler: AppSyncResolverHandler<any, any> = async (ctx) => {
  console.log(`EVENT: ${JSON.stringify(ctx)}`);
  const { claims, sub } = ctx.identity as AppSyncIdentityCognito;
  const { entityId, fileKey } = ctx.arguments.input;

  await validateIsEntityUser({ entityId, userId: sub });

  if (!claims['custom:identityId']) {
    throw new Error('ERROR_IDENTITY_ID_EMPTY');
  }

  const expenseAnalysisInput: StartExpenseAnalysisCommandInput = {
    // StartExpenseAnalysisRequest
    DocumentLocation: {
      S3Object: {
        Bucket: STORAGE_BUCKETNAME,
        Name: `private/${claims['custom:identityId']}/${fileKey}`,
      },
    },
    NotificationChannel: {
      SNSTopicArn: SNS_TOPIC_ARN,
      RoleArn: SNS_TOPIC_ROLE_ARN,
    },
  };

  console.log(
    'StartExpenseAnalysisCommandInput: ',
    JSON.stringify(expenseAnalysisInput, null, 2)
  );

  const queries = [
    { Text: 'What is the BPAY biller?', Alias: 'BPAY_BILLER' }, // TODO: can be picked up as the BSB
    { Text: 'What is the BPAY reference?', Alias: 'BPAY_REFERENCE' }, // TODO: can be picked up as the BSB
    // { Text: 'What is the bank name?', Alias: 'BANK_NAME' }, //TODO: generate automatically
    { Text: 'What is the bank account BSB?', Alias: 'BANK_BSB' }, // alternative could be What is the BSB
    { Text: 'What is the bank account number?', Alias: 'BANK_ACCOUNT' },
  ];

  const documentAnalysisInput: StartDocumentAnalysisRequest = {
    DocumentLocation: {
      S3Object: {
        Bucket: STORAGE_BUCKETNAME,
        Name: `private/${claims['custom:identityId']}/${fileKey}`,
      },
    },
    FeatureTypes: ['QUERIES'],
    QueriesConfig: {
      Queries: queries,
    },
    NotificationChannel: {
      SNSTopicArn: SNS_TOPIC_ARN,
      RoleArn: SNS_TOPIC_ROLE_ARN,
    },
  };

  let expenseAnalysisJobId = '';
  let queryDocumentJobId = '';
  try {
    const expenseAnalysisCommand = new StartExpenseAnalysisCommand(
      expenseAnalysisInput
    );
    const queryDocumentCommand = new StartDocumentAnalysisCommand(
      documentAnalysisInput
    );
    const [expenseAnalysisResponse, queryDocumentResponse] = await Promise.all([
      textExtract.send(expenseAnalysisCommand),
      textExtract.send(queryDocumentCommand),
    ]);
    console.log(
      'StartExpenseAnalysisCommand response: ',
      expenseAnalysisResponse
    );
    console.log(
      'StartDocumentAnalysisCommand response: ',
      queryDocumentResponse
    );
    expenseAnalysisJobId = expenseAnalysisResponse.JobId ?? '';
    queryDocumentJobId = queryDocumentResponse.JobId ?? '';
  } catch (err: any) {
    console.log('ERROR StartExpenseAnalysisCommand: ', err);
    throw new Error(err.message);
  }

  if (!expenseAnalysisJobId) {
    throw new Error('ERROR_ANALYSIS_JOB_EMPTY');
  }

  if (!queryDocumentJobId) {
    throw new Error('ERROR_QUERY_JOB_EMPTY');
  }

  const createdAt = new Date().toISOString();
  //const expenseAnalysisJob: Job = {
  const expenseAnalysisJob: any = {
    id: randomUUID(),
    jobId: expenseAnalysisJobId,
    //status: JobStatus.IN_PROGRESS,
    status: 'IN_PROGRESS',
    //type: JobType.INVOICE_ANALYSIS,
    type: 'INVOICE_ANALYSIS',
    entityId,
    createdBy: sub,
    expiresAt: DateTime.now().plus({ days: 7 }).toISO(), // ocr results available for 7 days only
    createdAt,
    updatedAt: createdAt,
    __typename: 'Job',
  };

  //const queryDocumentJob: Job = {
  const queryDocumentJob: any = {
    id: randomUUID(),
    jobId: queryDocumentJobId,
    //status: JobStatus.IN_PROGRESS,
    status: 'IN_PROGRESS',
    //type: JobType.INVOICE_QUERIES,
    type: 'INVOICE_QUERIES',
    entityId,
    createdBy: sub,
    expiresAt: DateTime.now().plus({ days: 7 }).toISO(), // ocr results available for 7 days only
    createdAt,
    updatedAt: createdAt,
    __typename: 'Job',
  };

  //const expenseDocumentAnalysis: DocumentAnalysis = {
  //  id: randomUUID(),
  //  fileKey,
  //  status: JobStatus.IN_PROGRESS,
  //  createdBy: sub,
  //  createdAt,
  //  updatedAt: createdAt,
  //  __typename: 'DocumentAnalysis',
  //}

  try {
    await Promise.all([
      createRecord(TABLE_JOB ?? '', expenseAnalysisJob),
      createRecord(TABLE_JOB ?? '', queryDocumentJob),
      //createRecord(TABLE_DOCUMENT_ANALYSIS ?? '', {
      //  id: randomUUID(),
      //  jobId: expenseAnalysisJob.id,
      //  documentId: fileKey,
      //  status: JobStatus.IN_PROGRESS,
      //  createdBy: sub,
      //  createdAt,
      //  updatedAt: createdAt,
      //}),
    ]);
  } catch (err: any) {
    console.log('ERROR createRecord: ', err);
    throw new Error(err.message);
  }

  return [expenseAnalysisJob, queryDocumentJob];
};
