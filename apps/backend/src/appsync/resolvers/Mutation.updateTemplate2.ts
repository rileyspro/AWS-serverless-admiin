import { Context, DynamoDBUpdateItemRequest, util } from '@aws-appsync/utils';
import { dynamodbUpdateRequest } from '../helpers/dynamodb';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const {
    input: { id, ...input },
  } = ctx.args;
  const key = { id };
  const condition = {
    id: { attributeExists: true },
  };

  const data = {
    ...input,
    searchName: input.name.toLowerCase(),
    updatedAt: util.time.nowISO8601(),
  };
  return dynamodbUpdateRequest({ key, data, condition });
}

export function response(ctx: Context) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }

  return result;
}
