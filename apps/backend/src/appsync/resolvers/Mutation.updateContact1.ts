import {
  AppSyncIdentityCognito,
  Context,
  DynamoDBUpdateItemRequest,
  util,
} from '@aws-appsync/utils';
import { isAdmin } from '../helpers/cognito';
import { dynamodbUpdateRequest } from '../helpers/dynamodb';
import { toTitleCase } from '../helpers/entity';

export function request(ctx: Context): DynamoDBUpdateItemRequest {
  const { sub, groups } = ctx.identity as AppSyncIdentityCognito;
  const { input } = ctx.args;
  const { id, ...values } = input;
  const key = { id };

  let condition;
  if (util.authType() !== 'IAM Authorization' && !isAdmin(groups)) {
    condition = {
      id: { attributeExists: true },
      owner: { eq: sub },
    };
  }

  const data = {
    ...values,
    //searchName: `${input.companyName ?? ''} ${
    //  input.companyName || `${input.firstName ?? ''} ${input.lastName ?? ''}`
    //}`.toLowerCase()
    updatedAt: util.time.nowISO8601(),
  };

  if (input.firstName) {
    data.firstName = toTitleCase(input.firstName);
  }

  if (input.lastName) {
    data.lastName = toTitleCase(input.lastName);
  }

  return dynamodbUpdateRequest({ key, data, condition });
}

export function response(ctx: Context) {
  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result);
  }
  return result;
}
