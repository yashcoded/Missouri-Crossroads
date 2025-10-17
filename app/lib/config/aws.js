import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';


const awsConfig = {
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AMPLIFY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY,
  },
};

// Initialize AWS SDK v3 clients
const s3Client = new S3Client(awsConfig);
const lambdaClient = new LambdaClient(awsConfig);
const cognitoClient = new CognitoIdentityProviderClient(awsConfig);

// DynamoDB Configuration
const dynamoDBClient = new DynamoDBClient(awsConfig);
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

// Cognito configuration
const cognitoConfig = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
};

export { s3Client, lambdaClient, cognitoClient, dynamoDB, awsConfig, cognitoConfig }; 