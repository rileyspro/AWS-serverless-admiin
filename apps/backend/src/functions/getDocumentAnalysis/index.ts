const { TABLE_JOB } = process.env;
import { validateIsEntityUser } from 'dependency-layer/entity';
import { AppSyncIdentityCognito } from '@aws-appsync/utils';
import { AppSyncResolverHandler } from 'aws-lambda';
import { Job } from 'dependency-layer/API';
import { getRecord } from 'dependency-layer/dynamoDB';
import {
  TextractClient,
  GetExpenseAnalysisCommand,
  GetDocumentAnalysisRequest,
} from '@aws-sdk/client-textract'; // ES Modules import

const textExtract = new TextractClient();

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler: AppSyncResolverHandler<any, any> = async (ctx) => {
  const { sub } = ctx.identity as AppSyncIdentityCognito;
  const { id } = ctx.arguments;

  let job: Job | null = null;
  try {
    job = await getRecord(TABLE_JOB ?? '', { id });
    console.log('job: ', job);
  } catch (err: any) {
    console.log('ERROR get job: ', err);
    throw new Error(err.message);
  }

  if (!job?.jobId) {
    throw new Error('NO_JOB');
  }

  await validateIsEntityUser({ entityId: job.entityId, userId: sub });

  const input: GetDocumentAnalysisRequest = {
    // GetDocumentAnalysisRequest
    JobId: job.jobId, // required
    //MaxResults: Number("int"),
    //NextToken: "STRING_VALUE",
  };
  try {
    const command = new GetExpenseAnalysisCommand(input);
    const response = await textExtract.send(command);
    console.log('GetDocumentAnalysisCommand: ', JSON.stringify(response));
  } catch (err: any) {
    console.log('ERROR GetDocumentAnalysisCommand: ', err);
    throw new Error(err.message);
  }
};
