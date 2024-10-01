import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { DynamoDbDataSource, IGraphqlApi } from 'aws-cdk-lib/aws-appsync';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import {
  Effect,
  Policy,
  PolicyStatement,
  Role,
  IRole,
} from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { JsResolverConstruct } from '../constructs/jsResolverConstruct';
import { LambdaAppSyncOperationConstruct } from '../constructs/lambdaAppSyncOperationConstruct';
import { getLambdaDefaultProps } from '../helpers';
import {
  env,
  fromEmail,
  mediaUrl,
  mixpanelToken,
  webDomainName,
  zaiClientId,
  zaiClientScope,
  zaiDomain,
  zaiTokenDomain,
} from '../helpers/constants';
import { IUserPool } from 'aws-cdk-lib/aws-cognito';

interface UserServiceStackProps extends NestedStackProps {
  appSyncApi: IGraphqlApi;
  authenticatedRole: IRole;
  autoCompleteResultsDS: DynamoDbDataSource;
  entityTable: ITable;
  entityUserTable: ITable;
  userPool: IUserPool;
  userTable: ITable;
  zaiSecrets: ISecret;
  userDS: DynamoDbDataSource;
  activityDS: DynamoDbDataSource;
  signatureDS: DynamoDbDataSource;
  referralDS: DynamoDbDataSource;
  referralTable: ITable;
}

export class UserServiceStack extends NestedStack {
  constructor(scope: Construct, id: string, props: UserServiceStackProps) {
    super(scope, id, props);

    const userStreamFunc = new NodejsFunction(this, 'UserStreamFunction', {
      ...getLambdaDefaultProps(this, 'streamUser'),
      timeout: Duration.minutes(15),
      environment: {
        TABLE_ENTITY: props.entityTable.tableName,
        TABLE_ENTITY_USER: props.entityUserTable.tableName,
        TABLE_USER: props.userTable.tableName,
        ZAI_DOMAIN: zaiDomain,
        ZAI_TOKEN_DOMAIN: zaiTokenDomain,
        ZAI_CLIENT_ID: zaiClientId,
        ZAI_CLIENT_SCOPE: zaiClientScope,
        AUTH_USERPOOLID: props.userPool.userPoolId,
        ENV: env,
      },
    });
    userStreamFunc.addEventSource(
      new DynamoEventSource(props.userTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );
    props.entityTable.grantReadWriteData(userStreamFunc);
    props.entityUserTable.grantReadWriteData(userStreamFunc);
    props.userTable.grantReadWriteData(userStreamFunc);
    props.zaiSecrets.grantRead(userStreamFunc);

    userStreamFunc.role?.attachInlinePolicy(
      new Policy(this, 'UserStreamFuncUserPoolPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['cognito-idp:AdminUpdateUserAttributes'],
            effect: Effect.ALLOW,
            resources: [props.userPool.userPoolArn],
          }),
        ],
      })
    );

    userStreamFunc.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:Query'],
        resources: [
          `arn:aws:dynamodb:${this.region}:${this.account}:table/${props.entityTable.tableName}/index/usersByReferralCode`,
        ],
      })
    );

    // update user
    const updateUser = new LambdaAppSyncOperationConstruct(this, 'UpdateUser', {
      api: props.appSyncApi,
      typeName: 'Mutation',
      fieldName: 'updateUser',
      environmentVars: {
        AUTH_USERPOOLID: props.userPool.userPoolId,
        TABLE_USER: props.userTable.tableName,
        MIXPANEL_TOKEN: mixpanelToken,
        ENV: env,
        ZAI_DOMAIN: zaiDomain,
        ZAI_TOKEN_DOMAIN: zaiTokenDomain,
        ZAI_CLIENT_ID: zaiClientId,
        ZAI_CLIENT_SCOPE: zaiClientScope,
      },
    });
    props.userTable.grantWriteData(updateUser.lambda);
    props.zaiSecrets.grantRead(updateUser.lambda);

    updateUser.lambda.role?.attachInlinePolicy(
      new Policy(this, 'UpdateUserFuncUserPoolPolicy', {
        statements: [
          new PolicyStatement({
            actions: ['cognito-idp:AdminUpdateUserAttributes'],
            effect: Effect.ALLOW,
            resources: [props.userPool.userPoolArn],
          }),
        ],
      })
    );

    // get user
    new JsResolverConstruct(this, 'GetUserResolver', {
      api: props.appSyncApi,
      dataSource: props.userDS,
      typeName: 'Query',
      fieldName: 'getUser',
      pathName: 'getUser',
    });

    new JsResolverConstruct(this, 'GetUserActivityResolver', {
      api: props.appSyncApi,
      dataSource: props.activityDS,
      typeName: 'Query',
      fieldName: 'getActivitiesByUser',
      pathName: 'Query.getActivitiesByUser',
    });

    new JsResolverConstruct(this, 'GetUserReferralsResolver', {
      api: props.appSyncApi,
      dataSource: props.referralDS,
      typeName: 'Query',
      fieldName: 'getReferralsByUser',
      pathName: 'Query.getReferralsByUser',
    });

    // list users
    new JsResolverConstruct(this, 'ListUsersResolver', {
      api: props.appSyncApi,
      dataSource: props.userDS,
      typeName: 'Query',
      fieldName: 'listUsers',
      pathName: 'Query.listUsers',
    });

    new JsResolverConstruct(this, 'CreateSignatureResolver', {
      api: props.appSyncApi,
      dataSource: props.signatureDS,
      typeName: 'Mutation',
      fieldName: 'createSignature',
      pathName: 'Mutation.createSignature',
    });

    // delete signature
    new JsResolverConstruct(this, 'DeleteSignatureResolver', {
      api: props.appSyncApi,
      dataSource: props.signatureDS,
      typeName: 'Mutation',
      fieldName: 'deleteSignature',
      pathName: 'Mutation.deleteSignature',
    });

    // user signatures
    new JsResolverConstruct(this, 'UserSignaturesResolver', {
      api: props.appSyncApi,
      dataSource: props.signatureDS,
      typeName: 'User',
      fieldName: 'signatures',
      pathName: 'User.signatures',
    });
  }
}
