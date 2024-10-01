import { Duration, NestedStack, NestedStackProps } from 'aws-cdk-lib';
import { DynamoDbDataSource, IGraphqlApi } from 'aws-cdk-lib/aws-appsync';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import {
  Effect,
  IRole,
  Policy,
  PolicyStatement,
  ServicePrincipal,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import {
  DynamoEventSource,
  SqsEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IDomain } from 'aws-cdk-lib/aws-opensearchservice';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { SqsSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import { JsPipelineResolverConstruct } from '../constructs/jsPipelineResolverConstruct';
import { JsResolverConstruct } from '../constructs/jsResolverConstruct';
import { LambdaAppSyncOperationConstruct } from '../constructs/lambdaAppSyncOperationConstruct';
import { getLambdaDefaultProps, setResourceName } from '../helpers';
import { env, fromEmail, mediaUrl, webDomainName } from '../helpers/constants';

interface TaskServiceStackProps extends NestedStackProps {
  appSyncApi: IGraphqlApi;
  unauthenticatedRole: IRole;
  activityTable: ITable;
  contactsTable: ITable;
  documentAnalysisTable: ITable;
  entityTable: ITable;
  entityUserTable: ITable;
  graphqlUrl: string;
  jobTable: ITable;
  notificationTable: ITable;
  serviceDS: DynamoDbDataSource;
  serviceTable: ITable;
  taskTable: ITable;
  templateDS: DynamoDbDataSource;
  templateTable: ITable;
  templateServiceDS: DynamoDbDataSource;
  userTable: ITable;
  s3mediaBucket: IBucket;
  activityDS: DynamoDbDataSource;
  entityUserDS: DynamoDbDataSource;
  taskDS: DynamoDbDataSource;
  entityDS: DynamoDbDataSource;
  contactsDS: DynamoDbDataSource;
  referralTable: ITable;
  openSearchDomain: IDomain;
}

export class TaskServiceStack extends NestedStack {
  constructor(scope: Construct, id: string, props: TaskServiceStackProps) {
    super(scope, id, props);

    // TASKS
    // task stream
    const taskStreamFunc = new NodejsFunction(this, 'TaskStreamFunction', {
      ...getLambdaDefaultProps(this, 'streamTask'),
      environment: {
        ENV: env,
        FROM_EMAIL: fromEmail,
        TABLE_ACTIVITY: props.activityTable.tableName,
        TABLE_CONTACT: props.contactsTable.tableName,
        TABLE_ENTITY: props.entityTable.tableName,
        TABLE_ENTITY_USER: props.entityUserTable.tableName,
        TABLE_REFERRAL: props.referralTable.tableName,
        TABLE_USER: props.userTable.tableName,
        WEB_DOMAIN: `https://${webDomainName}`, //TODO: combine email template vars into one object to destructure
        MEDIA_URL: mediaUrl,
        TEMPLATE_ARN: `arn:aws:mobiletargeting:${this.region}:${this.account}:templates`,
      },
    });

    taskStreamFunc.addEventSource(
      new DynamoEventSource(props.taskTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
      })
    );
    props.activityTable.grantReadWriteData(taskStreamFunc);
    props.contactsTable.grantReadWriteData(taskStreamFunc);
    props.entityTable.grantReadWriteData(taskStreamFunc);
    props.entityUserTable.grantReadWriteData(taskStreamFunc);
    props.userTable.grantReadWriteData(taskStreamFunc);
    props.referralTable.grantReadWriteData(taskStreamFunc);

    taskStreamFunc.role?.attachInlinePolicy(
      new Policy(this, 'SendEmailTaskStreamPolicy', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'ses:SendTemplatedEmail',
              'mobiletargeting:GetEmailTemplate',
              'ses:SendTemplatedEmail',
            ],
            resources: [
              `arn:aws:ses:${this.region}:${this.account}:identity/*`,
              `arn:aws:mobiletargeting:${this.region}:${this.account}:templates/*`,
              `arn:aws:ses:${this.region}:${this.account}:configuration-set/*`,
            ],
          }),
        ],
      })
    );

    const taskReminderCronFunc = new NodejsFunction(
      this,
      'TaskReminderCronFunction',
      {
        ...getLambdaDefaultProps(this, 'cronTaskReminder'),
        environment: {
          ENV: env,
          TABLE_CONTACT: props.contactsTable.tableName,
          TABLE_ENTITY: props.entityTable.tableName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
          TABLE_USER: props.userTable.tableName,
          FROM_EMAIL: fromEmail,
          WEB_DOMAIN: `https://${webDomainName}`, //TODO: combine email template vars into one object to destructure
          MEDIA_URL: mediaUrl,
          TEMPLATE_ARN: `arn:aws:mobiletargeting:${this.region}:${this.account}:templates`,
        },
      }
    );

    props.contactsTable.grantReadData(taskReminderCronFunc);
    props.entityTable.grantReadData(taskReminderCronFunc);
    props.entityUserTable.grantReadData(taskReminderCronFunc);
    props.userTable.grantReadData(taskReminderCronFunc);
    props.taskTable.grantReadData(taskReminderCronFunc);

    taskReminderCronFunc.role?.attachInlinePolicy(
      new Policy(this, 'SendEmailTaskReminderConfirmationCronPolicy', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'ses:SendTemplatedEmail',
              'mobiletargeting:GetEmailTemplate',
              'ses:SendTemplatedEmail',
            ],
            resources: [
              `arn:aws:ses:${this.region}:${this.account}:identity/*`,
              `arn:aws:mobiletargeting:${this.region}:${this.account}:templates/*`,
              `arn:aws:ses:${this.region}:${this.account}:configuration-set/*`,
            ],
          }),
        ],
      })
    );

    // cron rule and target
    const taskReminderCronRule = new Rule(this, 'TaskReminderCronRule', {
      schedule: Schedule.cron({ hour: '5', minute: '0' }),
    });
    taskReminderCronRule.addTarget(new LambdaFunction(taskReminderCronFunc));

    // task activity
    new JsResolverConstruct(this, 'TaskActivityResolver', {
      api: props.appSyncApi,
      dataSource: props.activityDS,
      typeName: 'Task',
      fieldName: 'activity',
      pathName: 'Task.activity',
    });

    // get task
    new JsPipelineResolverConstruct(this, 'GetTaskResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.taskDS],
      typeName: 'Query',
      fieldName: 'getTask',
      pathName: 'Query.getTask',
    });

    new JsPipelineResolverConstruct(this, 'GetTaskGuestResolver', {
      api: props.appSyncApi,
      dataSources: [props.taskDS],
      typeName: 'Query',
      fieldName: 'getTaskGuest',
      pathName: 'Query.getTaskGuest',
    });

    const createTask = new LambdaAppSyncOperationConstruct(
      this,
      'CreateTaskResolver',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'createTask',
        timeout: Duration.minutes(2),
        environmentVars: {
          TABLE_CONTACT: props.contactsTable.tableName,
          TABLE_ENTITY: props.entityTable.tableName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );

    props.contactsTable.grantReadData(createTask.lambda);
    props.entityTable.grantReadData(createTask.lambda);
    props.entityUserTable.grantReadData(createTask.lambda);
    props.taskTable.grantWriteData(createTask.lambda);

    // update task
    const updateTask = new LambdaAppSyncOperationConstruct(
      this,
      'UpdateTaskResolver',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'updateTask',
        timeout: Duration.minutes(2),
        environmentVars: {
          TABLE_CONTACT: props.contactsTable.tableName,
          TABLE_ENTITY: props.entityTable.tableName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );

    props.contactsTable.grantReadData(updateTask.lambda);
    props.entityTable.grantReadData(updateTask.lambda);
    props.entityUserTable.grantReadData(updateTask.lambda);
    props.taskTable.grantReadWriteData(updateTask.lambda);

    const updateTaskGuest = new LambdaAppSyncOperationConstruct(
      this,
      'UpdateTaskGuestResolver',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'updateTaskGuest',
        environmentVars: {
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );

    props.taskTable.grantReadWriteData(updateTaskGuest.lambda);

    // list tasks by entity from and search status
    new JsPipelineResolverConstruct(this, 'TasksByEntityFromResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.taskDS],
      typeName: 'Query',
      fieldName: 'tasksByEntityFrom',
      pathName: 'Query.tasksByEntityFrom',
    });

    // list tasks by entity to and search status
    new JsPipelineResolverConstruct(this, 'TasksByEntityToResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.taskDS],
      typeName: 'Query',
      fieldName: 'tasksByEntityTo',
      pathName: 'Query.tasksByEntityTo',
    });

    // list tasks by entity by
    new JsPipelineResolverConstruct(this, 'TasksByEntityByResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.taskDS],
      typeName: 'Query',
      fieldName: 'tasksByEntityBy',
      pathName: 'Query.tasksByEntityBy',
    });

    // tasksByEntityByIdContactId
    new JsPipelineResolverConstruct(
      this,
      'TasksByEntityByIdContactIdResolver',
      {
        api: props.appSyncApi,
        dataSources: [props.entityUserDS, props.taskDS],
        typeName: 'Query',
        fieldName: 'tasksByEntityByIdContactId',
        pathName: 'Query.tasksByEntityByIdContactId',
      }
    );

    // tasks by search name
    new JsPipelineResolverConstruct(this, 'TasksBySearchNameResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.taskDS],
      typeName: 'Query',
      fieldName: 'searchTasks',
      pathName: 'Query.tasksBySearchName',
    });

    // TASKS GUEST
    new JsResolverConstruct(this, 'TaskGuestFromEntityResolver', {
      api: props.appSyncApi,
      dataSource: props.entityDS,
      typeName: 'TaskGuest',
      fieldName: 'fromEntity',
      pathName: 'TaskGuest.fromEntity',
    });

    // from contact
    new JsResolverConstruct(this, 'TaskGuestFromContactResolver', {
      api: props.appSyncApi,
      dataSource: props.contactsDS,
      typeName: 'TaskGuest',
      fieldName: 'fromContact',
      pathName: 'TaskGuest.fromContact',
    });

    new JsResolverConstruct(this, 'TaskGuestToEntityResolver', {
      api: props.appSyncApi,
      dataSource: props.entityDS,
      typeName: 'TaskGuest',
      fieldName: 'toEntity',
      pathName: 'TaskGuest.toEntity',
    });

    new JsResolverConstruct(this, 'TaskGuestToContactResolver', {
      api: props.appSyncApi,
      dataSource: props.contactsDS,
      typeName: 'TaskGuest',
      fieldName: 'toContact',
      pathName: 'TaskGuest.toContact',
    });

    // TASK DOCUMENT URL
    // task presigned document url from lambda
    const createTaskDocumentUrl = new LambdaAppSyncOperationConstruct(
      this,
      'CreateTaskDocumentUrl',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'createTaskDocumentUrl',
        environmentVars: {
          STORAGE_BUCKETNAME: props.s3mediaBucket.bucketName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );
    props.entityUserTable.grantReadData(createTaskDocumentUrl.lambda);
    props.taskTable.grantReadData(createTaskDocumentUrl.lambda);
    props.s3mediaBucket.grantReadWrite(createTaskDocumentUrl.lambda);

    // TASK DOCUMENT URL GUEST
    // task presigned document url from lambda
    const createTaskDocumentUrlGuest = new LambdaAppSyncOperationConstruct(
      this,
      'CreateTaskDocumentUrlGuest',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'createTaskDocumentUrlGuest',
        environmentVars: {
          STORAGE_BUCKETNAME: props.s3mediaBucket.bucketName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );
    props.taskTable.grantReadWriteData(createTaskDocumentUrlGuest.lambda); // Review: Currently write required to update task viewed at
    props.s3mediaBucket.grantReadWrite(createTaskDocumentUrlGuest.lambda);

    // SERVICES
    // get service
    new JsPipelineResolverConstruct(this, 'GetServiceResolver', {
      api: props.appSyncApi,
      dataSources: [props.serviceDS, props.entityUserDS],
      typeName: 'Query',
      fieldName: 'getService',
      pathName: 'Query.getService',
    });

    // services by entity
    new JsPipelineResolverConstruct(this, 'ListServicesByEntityResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.serviceDS],
      typeName: 'Query',
      fieldName: 'servicesByEntity',
      pathName: 'Query.servicesByEntity',
    });

    // create service mutation resolver
    new JsPipelineResolverConstruct(this, 'CreateServiceResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.serviceDS],
      typeName: 'Mutation',
      fieldName: 'createService',
      pathName: 'Mutation.createService',
    });

    // update service mutation resolver
    new JsPipelineResolverConstruct(this, 'UpdateServiceResolver', {
      api: props.appSyncApi,
      dataSources: [props.serviceDS, props.entityUserDS, props.serviceDS],
      typeName: 'Mutation',
      fieldName: 'updateService',
      pathName: 'Mutation.updateService',
    });

    // TEMPLATES
    // templates.services
    new JsResolverConstruct(this, 'TemplateServicesResolver', {
      api: props.appSyncApi,
      dataSource: props.templateServiceDS,
      typeName: 'Template',
      fieldName: 'templateServices',
      pathName: 'Template.templateServices',
    });

    // get template
    new JsPipelineResolverConstruct(this, 'GetTemplateResolver', {
      api: props.appSyncApi,
      dataSources: [props.templateDS, props.entityUserDS],
      typeName: 'Query',
      fieldName: 'getTemplate',
      pathName: 'Query.getTemplate',
    });

    // templates by entity
    new JsPipelineResolverConstruct(this, 'ListTemplatesByEntityResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.templateDS],
      typeName: 'Query',
      fieldName: 'templatesByEntity',
      pathName: 'Query.templatesByEntity',
    });

    // create template mutation resolver
    new JsPipelineResolverConstruct(this, 'CreateTemplateResolver', {
      api: props.appSyncApi,
      dataSources: [props.entityUserDS, props.templateDS],
      typeName: 'Mutation',
      fieldName: 'createTemplate',
      pathName: 'Mutation.createTemplate',
    });

    // update template mutation resolver
    new JsPipelineResolverConstruct(this, 'UpdateTemplateResolver', {
      api: props.appSyncApi,
      dataSources: [props.templateDS, props.entityUserDS, props.templateDS],
      typeName: 'Mutation',
      fieldName: 'updateTemplate',
      pathName: 'Mutation.updateTemplate',
    });

    // TEMPLATE SERVICES
    // TemplateService.service
    new JsResolverConstruct(this, 'TemplateServiceServiceResolver', {
      api: props.appSyncApi,
      dataSource: props.serviceDS,
      typeName: 'TemplateService',
      fieldName: 'service',
      pathName: 'TemplateService.service',
    });

    // create template service
    new JsPipelineResolverConstruct(this, 'CreateTemplateServiceResolver', {
      api: props.appSyncApi,
      dataSources: [
        props.templateDS,
        props.entityUserDS,
        props.templateServiceDS,
      ],
      typeName: 'Mutation',
      fieldName: 'createTemplateService',
      pathName: 'Mutation.createTemplateService',
    });

    // delete template service
    new JsPipelineResolverConstruct(this, 'DeleteTemplateServiceResolver', {
      api: props.appSyncApi,
      dataSources: [
        props.templateDS,
        props.entityUserDS,
        props.templateServiceDS,
      ],
      typeName: 'Mutation',
      fieldName: 'deleteTemplateService',
      pathName: 'Mutation.deleteTemplateService',
    });

    // OCR / DOCUMENT ANALYSIS

    // queue
    const documentAnalysisQueue = new Queue(this, 'DocumentAnalysisQueue', {
      queueName: setResourceName('DocumentAnalysisQueue'),
      visibilityTimeout: Duration.minutes(15),
    });

    // topic
    const documentAnalysisTopic = new Topic(this, 'DocumentAnalysisTopic', {
      topicName: setResourceName('DocumentAnalysisTopic'),
      displayName: `Document Analysis Topic ${env}`,
    });

    documentAnalysisTopic.addSubscription(
      new SqsSubscription(documentAnalysisQueue)
    );

    const textractRole = new Role(this, 'TextractRole', {
      assumedBy: new ServicePrincipal('textract.amazonaws.com'),
    });

    // Attach the permissions policy to the role
    textractRole.addToPolicy(
      new PolicyStatement({
        actions: ['s3:GetObject', 'sns:Publish'],
        resources: [
          props.s3mediaBucket.bucketArn + '/*',
          documentAnalysisTopic.topicArn,
        ],
      })
    );

    const createdDocumentAnalysis = new LambdaAppSyncOperationConstruct(
      this,
      'CreateDocumentAnalysisResolver',
      {
        api: props.appSyncApi,
        typeName: 'Mutation',
        fieldName: 'createDocumentAnalysis',
        environmentVars: {
          SQS_QUEUE_URL: documentAnalysisQueue.queueUrl,
          SNS_TOPIC_ARN: documentAnalysisTopic.topicArn,
          SNS_TOPIC_ROLE_ARN: textractRole.roleArn,
          STORAGE_BUCKETNAME: props.s3mediaBucket.bucketName,
          TABLE_DOCUMENT_ANALYSIS: props.documentAnalysisTable.tableName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_JOB: props.jobTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );

    props.documentAnalysisTable.grantReadWriteData(
      createdDocumentAnalysis.lambda
    );
    props.entityUserTable.grantReadData(createdDocumentAnalysis.lambda);
    props.jobTable.grantReadWriteData(createdDocumentAnalysis.lambda);
    props.taskTable.grantReadWriteData(createdDocumentAnalysis.lambda);
    props.s3mediaBucket.grantReadWrite(createdDocumentAnalysis.lambda);
    createdDocumentAnalysis.lambda.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'textract:StartExpenseAnalysis',
          'textract:StartDocumentAnalysis',
        ],
        resources: ['*'],
      })
    );
    documentAnalysisQueue.grantSendMessages(createdDocumentAnalysis.lambda);
    documentAnalysisTopic.grantPublish(createdDocumentAnalysis.lambda);

    // process document analysis
    const processDocumentAnalysis = new NodejsFunction(
      this,
      'ProcessDocumentAnalysisFunction',
      {
        ...getLambdaDefaultProps(this, 'processDocumentAnalysis'),
        timeout: Duration.minutes(15),
        environment: {
          API_GRAPHQLAPIENDPOINT: props.graphqlUrl,
          TABLE_DOCUMENT_ANALYSIS: props.documentAnalysisTable.tableName,
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_JOB: props.jobTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
          TABLE_NOTIFICATION: props.notificationTable.tableName,
          OPENSEARCH_DOMAIN_ENDPOINT: props.openSearchDomain.domainEndpoint,
        },
      }
    );
    props.documentAnalysisTable.grantReadWriteData(processDocumentAnalysis);
    props.entityUserTable.grantReadData(processDocumentAnalysis);
    props.jobTable.grantReadWriteData(processDocumentAnalysis);
    props.taskTable.grantReadData(processDocumentAnalysis);
    props.notificationTable.grantWriteData(processDocumentAnalysis);
    props.openSearchDomain.grantRead(processDocumentAnalysis);
    props.openSearchDomain.grantIndexRead('entity', processDocumentAnalysis);
    props.openSearchDomain.grantIndexRead('contact', processDocumentAnalysis);

    processDocumentAnalysis.role?.attachInlinePolicy(
      new Policy(this, 'AppSyncInvokeProcessDocumentAnalysisPolicy', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['appsync:GraphQL'],
            resources: [
              `arn:aws:appsync:${this.region}:${this.account}:apis/${props.appSyncApi.apiId}/*`,
            ],
          }),
        ],
      })
    );

    processDocumentAnalysis.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'textract:GetExpenseAnalysis',
          'textract:GetDocumentAnalysis',
        ],
        resources: ['*'],
      })
    );
    documentAnalysisQueue.grantConsumeMessages(processDocumentAnalysis);
    const processDocumentAnalysisEventSource = new SqsEventSource(
      documentAnalysisQueue,
      {
        batchSize: 1,
      }
    );
    processDocumentAnalysis.addEventSource(processDocumentAnalysisEventSource);

    processDocumentAnalysis.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['es:ESHttpPost'],
        resources: [`${props.openSearchDomain.domainArn}/*`],
      })
    );

    processDocumentAnalysis.role?.attachInlinePolicy(
      new Policy(this, 'AppSyncInvokeBeneficialOwnerStreamPolicy', {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['appsync:GraphQL'],
            resources: [
              `arn:aws:appsync:${this.region}:${this.account}:apis/${props.appSyncApi.apiId}/*`,
            ],
          }),
        ],
      })
    );

    // get document analysis
    const getDocumentAnalysis = new LambdaAppSyncOperationConstruct(
      this,
      'GetDocumentAnalysisResolver',
      {
        api: props.appSyncApi,
        typeName: 'Query',
        fieldName: 'getDocumentAnalysis',
        environmentVars: {
          TABLE_ENTITY_USER: props.entityUserTable.tableName,
          TABLE_JOB: props.jobTable.tableName,
          TABLE_TASK: props.taskTable.tableName,
        },
      }
    );

    props.entityUserTable.grantReadData(getDocumentAnalysis.lambda);
    props.jobTable.grantReadWriteData(getDocumentAnalysis.lambda);
    props.taskTable.grantReadData(getDocumentAnalysis.lambda);
    getDocumentAnalysis.lambda.addToRolePolicy(
      new PolicyStatement({
        actions: ['textract:GetExpenseAnalysis'],
        resources: ['*'],
      })
    );
  }
}
