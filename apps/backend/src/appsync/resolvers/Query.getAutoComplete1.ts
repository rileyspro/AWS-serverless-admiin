import { Context, util, DynamoDBGetItemRequest } from '@aws-appsync/utils';
import { dynamoDBGetItemRequest } from '../helpers/dynamodb';

export function request(ctx: Context): DynamoDBGetItemRequest {
  const {
    args: { id },
  } = ctx;
  return dynamoDBGetItemRequest({ id });
}

export function response(ctx: Context) {
  const { error, result } = ctx;
  const foundEntity = ctx.stash.foundEntity;

  if (error) {
    return util.appendError(error.message, error.type, result);
  }

  return { entity: foundEntity, contact: ctx.result };
}
