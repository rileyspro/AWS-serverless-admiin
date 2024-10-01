import { Context, DynamoDBPutItemRequest, util } from '@aws-appsync/utils';
import { dynamodbPutRequest } from '../helpers/dynamodb';

export function request(ctx: Context): DynamoDBPutItemRequest {
  const { input } = ctx.arguments;

  if (util.authType() !== 'IAM Authorization') {
    util.unauthorized();
  }

  const key = { id: util.autoId() };
  const createdAt = util.time.nowISO8601();
  const data = {
    ...input,
    status: 'UNREAD',
    createdAt,
    updatedAt: createdAt,
  };
  const condition = { id: { attributeExists: false } };
  return dynamodbPutRequest({ key, data, condition });
}

export function response(ctx: Context) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return ctx.result;
}
