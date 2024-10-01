import { appPrefix, env } from './constants';

// MUST ADD ALL EXTERNAL LIBRARIES HERE OTHERWISE LAMBDA WILL BUNDLE THE CODE
export const externalLibs = [
  'aws-sdk',
  '@aws-crypto/util',
  '@aws-appsync/utils',
  '@aws-sdk/client-lambda',
  '@aws-sdk/client-location',
  '@aws-sdk/client-sqs',
  '@aws-sdk/lib-dynamodb',
  '@aws-sdk/client-dynamodb',
  '@aws-sdk/credential-provider-cognito-identity',
  '@aws-sdk/client-cognito-identity',
  '@sentry/serverless',
  'tslib',
  'googleapis-common',
  'csv-parse',
  'protobufjs',
  'uuid',
  'aws-lambda',
  '@aws-crypto/sha256-js',
  '@aws-sdk/client-cognito-identity-provider',
  '@aws-sdk/client-pinpoint',
  '@aws-sdk/client-pinpoint-email',
  '@aws-sdk/client-s3',
  '@aws-sdk/client-secrets-manager',
  '@aws-sdk/client-textract',
  '@aws-sdk/credential-provider-node',
  '@aws-sdk/protocol-http',
  '@aws-sdk/s3-request-presigner',
  '@aws-sdk/signature-v4',
  '@googleapis/androidpublisher',
  'api',
  'aws-serverless-express',
  'aws4',
  'axios',
  'body-parser',
  'csv-parser',
  'express',
  'generate-password',
  'jose',
  'jwt-decode',
  'libphonenumber-js',
  'lodash.camelcase',
  'luxon',
  'mixpanel',
  'node-fetch',
  'openid-client',
  'xero-node',
  //dependency-layer
];

export const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const setResourceName = (name: string) => {
  return `${appPrefix}${env}${name}`;
};
