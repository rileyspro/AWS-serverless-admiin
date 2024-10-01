import { DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  BatchGetCommandInput,
  BatchWriteCommand,
  BatchWriteCommandInput,
  DeleteCommand,
  DeleteCommandInput,
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandInput,
  PutCommand,
  PutCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  UpdateCommand,
  UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb';

export const marshallOptions = {
  // Whether to automatically convert empty strings, blobs, and sets to `null`.
  // convertEmptyValues: false, // false, by default.
  // Whether to remove undefined values while marshalling.
  // removeUndefinedValues: true, // false, by default.
  // Whether to convert typeof object to map attribute.
  convertClassInstanceToMap: true, // false, by default. <-- HERE IS THE ISSUE
};

const DdbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(DdbClient, { marshallOptions });

/**
 * Creates a record
 *
 * @param tableName
 * @param data
 * @param conditionExpression
 */
export const createRecord = async (
  tableName: string,
  data: Record<string, any>,
  conditionExpression?: string
) => {
  const input: PutCommandInput = {
    Item: data,
    TableName: tableName,
    ...(conditionExpression && { ConditionExpression: conditionExpression }),
  };
  const command = new PutCommand(input);
  await docClient.send(command);
  return data; //TODO: return data ?
};

/**
 * Get record for a table
 *
 * @returns {Promise<DocumentClient.AttributeMap[]>}
 * @param tableName
 * @param keys
 */
export const getRecord = async (
  tableName: string,
  keys: Record<string, any>
): Promise<any> => {
  const input: GetCommandInput = {
    TableName: tableName,
    Key: keys,
  };

  const command = new GetCommand(input);
  const { Item } = await docClient.send(command);
  return Item;
};

/**
 * Scan entire database
 * @param tableName
 */
export const scanAllRecords = async (tableName: string) => {
  const input: ScanCommandInput = {
    TableName: tableName,
  };
  let scanResults: any[] = [];
  let items;
  do {
    const command = new ScanCommand(input);
    items = await docClient.send(command);
    scanResults = scanResults.concat(items.Items);
    //items.Items.forEach((item: any) => scanResults.push(item));
    input.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey != 'undefined');
  return scanResults;
};

export interface UpdateRecordProps {
  tableName: string;
  keys: Record<string, any>;
  updateParams: Record<string, any>;
  updateAction?: string;
}

//TODO: REFACTOR = ALLOW CONDITION EXPRESSIONS / LIKE APPSYNC DYNAMODB HELPERS
/**
 * Update record
 *
 * @param keys
 * @param updateParams
 * @param tableName
 * @param updateAction
 */
export const updateRecord = async (
  tableName: string,
  keys: Record<string, any>,
  updateParams: Record<string, any>,
  updateAction = 'SET'
) => {
  let updateExpression = updateAction;
  const expressionAttributeValues: any = {};
  const expressionAttributeNames: any = {};
  let i = 0;

  Object.keys(updateParams).forEach((key) => {
    if (i === 0) {
      updateExpression = `${updateExpression} #${key} = :${key}`;
    } else {
      updateExpression = `${updateExpression}, #${key} = :${key}`;
    }

    if (updateAction === 'SET') {
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updateParams[key];
    }

    i += 1;
  });

  //console.log('updateExpression: ', updateExpression);
  //console.log('expressionAttributeNames: ', expressionAttributeNames);
  //console.log('expressionAttributeValues: ', expressionAttributeValues);

  const conditionExpression = '';

  const input: UpdateCommandInput = {
    TableName: tableName,
    Key: keys,
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: ReturnValue.ALL_NEW,
  };

  if (conditionExpression) {
    input.ConditionExpression = conditionExpression;
  }

  const command = new UpdateCommand(input);
  const data = await docClient.send(command);
  return data.Attributes;
};

export interface incrementRecordProps {
  tableName: string;
  key: { [key: string]: any };
  attributeToUpdate: string;
}

export const incrementRecord = async ({
  tableName,
  key,
  attributeToUpdate,
}: incrementRecordProps) => {
  const params: UpdateCommandInput = {
    TableName: tableName,
    Key: key,
    UpdateExpression: `ADD #attribute :one`,
    ExpressionAttributeNames: {
      '#attribute': attributeToUpdate,
    },
    ExpressionAttributeValues: {
      ':one': 1,
    },
    ReturnValues: 'UPDATED_NEW',
  };

  const command = new UpdateCommand(params);
  const response = await docClient.send(command);
  return response.Attributes;
};

export const deleteRecord = async (
  tableName: string,
  keys: Record<string, any>
) => {
  const input: DeleteCommandInput = {
    TableName: tableName,
    Key: keys,
    ReturnValues: ReturnValue.ALL_OLD,
  };

  const command = new DeleteCommand(input);
  const data = await docClient.send(command);
  return data.Attributes;
};

export interface BatchPutRequest {
  tableName: string;
  items: Record<string, any>[];
}

export const batchPut = async ({ tableName, items }: BatchPutRequest) => {
  for (let i = 0; i < items.length; i += 25) {
    const slicedItems = items.slice(i, i + 25);
    const requests: any = slicedItems.map((item) => ({
      PutRequest: { Item: item },
    }));

    const input: BatchWriteCommandInput = {
      RequestItems: { [tableName]: requests },
    };

    console.log('Input: ', JSON.stringify(input));

    let data: any;
    do {
      const command = new BatchWriteCommand(input);
      data = await docClient.send(command);
      //console.log('batch delete items: ', data.Responses[tableName]);

      if (data.UnprocessedItems) {
        input.RequestItems = data.UnprocessedItems;
        console.log('!!!data.UnprocessedItems!!!: ', data.UnprocessedItems);
      }
    } while (data?.UnprocessedKeys?.[tableName]?.Keys?.length);
    console.log('batch put response: ', data);
  }
};

export const batchDelete = async (
  tableName: string,
  arrayOfKeys: Record<string, any>[]
) => {
  for (let i = 0; i < arrayOfKeys.length; i += 100) {
    const keys = arrayOfKeys.slice(i, i + 100);

    const input: BatchWriteCommandInput = {
      RequestItems: {
        [tableName]: keys,
      },
    };

    let data: any; //TODO: batch delete works
    do {
      const command = new BatchWriteCommand(input);
      data = await docClient.send(command);
      console.log('data: ', data);
      console.log('batch delete items: ', data.Responses[tableName]);

      if (data.UnprocessedKeys) {
        console.log('!!!data.UnprocessedKeys!!!: ', data.UnprocessedKeys);
      }

      // input.RequestItems[tableName].Keys = data.UnprocessedKeys.Keys;
    } while (data?.UnprocessedKeys?.[tableName]?.Keys?.length);
    console.log('batch delete response: ', data);
  }
};

export interface BatchGetRequest {
  tableName: string;
  keys: Record<string, any>[];
}

export const batchGet = async ({ tableName, keys }: BatchGetRequest) => {
  let results: any[] = [];
  for (let i = 0; i < keys.length; i += 100) {
    const slicedKeys = keys.slice(i, i + 100);

    const input: BatchGetCommandInput = {
      RequestItems: {
        [tableName]: {
          Keys: slicedKeys,
        },
      },
    };

    let data;
    do {
      const command = new BatchGetCommand(input);
      data = await docClient.send(command);
      if (data?.Responses?.[tableName]) {
        results = results.concat(data.Responses[tableName]);
        console.log('batch get items: ', data.Responses[tableName]);
      }

      if (
        data.UnprocessedKeys &&
        Object.keys(data.UnprocessedKeys).length > 0
      ) {
        console.log('!!!data.UnprocessedKeys!!!: ', data.UnprocessedKeys);
      }
      // input.RequestItems[tableName].Keys = data.UnprocessedKeys.Keys;
      //TODO: ensure works
    } while (data?.UnprocessedKeys?.[tableName]?.Keys?.length);
  }

  return results;
};

export interface QueryParams {
  tableName: string;
  indexName?: string;
  keys: { [key: string]: any };
  limit?: number;
  sortDirection?: 'ASC' | 'DESC';
  nextToken?: string;
  filter?: { [key: string]: any };
}

//TODO: unit tests for this function, as well as the others
export const queryRecords = async ({
  filter,
  indexName,
  keys,
  limit = 20,
  nextToken,
  sortDirection,
  tableName,
}: QueryParams) => {
  const keyExpression = Object.keys(keys)
    .map((key) => `#${key} = :${key}`)
    .join(' AND ');

  const combinedObject = filter ? { ...keys, ...filter } : keys;
  const expressionNames: { [key: string]: string } = {};
  const expressionValues: { [key: string]: any } = {};

  Object.entries(combinedObject).forEach(([key, value]) => {
    expressionNames[`#${key}`] = key;
    if (typeof value === 'object' && value !== null) {
      const operator = Object.keys(value)[0];
      expressionValues[`:${key}`] = value[operator];
    } else {
      expressionValues[`:${key}`] = value;
    }
  });

  const query: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: keyExpression,
    ExpressionAttributeNames: expressionNames,
    ExpressionAttributeValues: expressionValues,
    IndexName: indexName,
    Limit: limit,
    ExclusiveStartKey: nextToken
      ? { [Object.keys(keys)[0]]: nextToken }
      : undefined,
    ScanIndexForward: sortDirection === 'ASC',
  };

  if (filter) {
    query.FilterExpression = Object.keys(filter)
      .map((key) => {
        if (typeof filter[key] === 'object' && filter[key] !== null) {
          let operator = Object.keys(filter[key])[0];
          // map operators to DynamoDB operators
          switch (operator) {
            case 'ne':
              operator = '<>';
              break;
            case 'lt':
              operator = '<';
              break;
            case 'le':
              operator = '<=';
              break;
            case 'gt':
              operator = '>';
              break;
            case 'ge':
              operator = '>=';
              break;
            case 'begins_with':
              operator = 'begins_with';
              break;
            case 'between':
              operator = 'BETWEEN';
              break;
            default:
              operator = '=';
          }
          return `#${key} ${operator} :${key}`;
        } else {
          return `#${key} = :${key}`;
        }
      })
      .join(' AND ');
  }

  let items: any[] = [];
  let lastEvaluatedKey: any | undefined;
  do {
    const command = new QueryCommand(query);
    const data = await docClient.send(command);
    items = [...items, ...(data.Items ?? [])];
    lastEvaluatedKey = data.LastEvaluatedKey;
    query.ExclusiveStartKey = lastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};

//export const queryRecords = async ({
//  filter,
//  indexName,
//  keys,
//  limit = 20,
//  nextToken,
//  sortDirection,
//  tableName,
//}: QueryParams) => {
//  const keyExpression = Object.keys(keys)
//    .map((key) => `#${key} = :${key}`)
//    .join(' AND ');
//
//  const combinedObject = filter ? { ...keys, ...filter } : keys;
//  const expressionNames: { [key: string]: string } = {};
//  const expressionValues: { [key: string]: any } = {};
//
//  Object.entries(combinedObject).forEach(([key, value]) => {
//    expressionNames[`#${key}`] = key;
//    expressionValues[`:${key}`] = value;
//  });
//
//  const query: QueryCommandInput = {
//    TableName: tableName,
//    KeyConditionExpression: keyExpression,
//    ExpressionAttributeNames: expressionNames,
//    ExpressionAttributeValues: expressionValues,
//    IndexName: indexName,
//    Limit: limit,
//    ExclusiveStartKey: nextToken
//      ? { [Object.keys(keys)[0]]: nextToken }
//      : undefined,
//    ScanIndexForward: sortDirection === 'ASC',
//  };
//
//  if (filter) {
//    query.FilterExpression = Object.keys(filter)
//      .map((key) => `#${key} = :${key}`)
//      .join(' AND ');
//  }
//
//  let items: any[] = [];
//  let lastEvaluatedKey: any | undefined;
//
//  do {
//    const command = new QueryCommand(query);
//    const data = await docClient.send(command);
//    items = [...items, ...(data.Items ?? [])];
//    lastEvaluatedKey = data.LastEvaluatedKey;
//    query.ExclusiveStartKey = lastEvaluatedKey;
//  } while (lastEvaluatedKey);
//
//  return items;
//};
