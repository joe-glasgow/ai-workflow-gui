import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface AIWorkflowStackProps extends cdk.StackProps {
  stage: string;
  killSwitchThreshold: number;
  warningThreshold: number;
}

export class AIWorkflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AIWorkflowStackProps) {
    super(scope, id, props);

    // VPC for secure networking
    const vpc = new ec2.Vpc(this, 'AIWorkflowVPC', {
      maxAzs: 2,
      natGateways: 0, // Cost optimization - use VPC endpoints instead
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Endpoints for cost optimization (no NAT Gateway needed)
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for AI Workflow database',
      allowAllOutbound: false,
    });

    // Security Group for App Runner
    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc,
      description: 'Security group for AI Workflow application',
    });

    // Allow App Runner to connect to RDS
    dbSecurityGroup.addIngressRule(
      appSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow App Runner to connect to PostgreSQL'
    );

    // RDS PostgreSQL Database
    const database = new rds.DatabaseInstance(this, 'AIWorkflowDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      databaseName: 'aiworkflow',
      credentials: rds.Credentials.fromGeneratedSecret('aiworkflowadmin'),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: props.stage === 'prod',
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.SNAPSHOT : cdk.RemovalPolicy.DESTROY,
    });

    // Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, 'AIWorkflowUserPool', {
      userPoolName: `ai-workflow-${props.stage}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'AIWorkflowUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID, cognito.OAuthScope.PROFILE],
        callbackUrls: [`https://${props.stage}-aiworkflow.example.com/auth/callback`],
        logoutUrls: [`https://${props.stage}-aiworkflow.example.com/auth/logout`],
      },
    });

    // S3 Bucket for application assets
    const assetsBucket = new s3.Bucket(this, 'AIWorkflowAssets', {
      bucketName: `ai-workflow-assets-${props.stage}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: props.stage === 'prod' ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for App Runner
    const appRunnerRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // Grant App Runner access to assets bucket
    assetsBucket.grantRead(appRunnerRole);

    // App Runner Service for Next.js Application
    const appRunnerService = new apprunner.CfnService(this, 'AIWorkflowAppRunnerV2', {
      serviceName: `ai-workflow-${props.stage}-v2`,
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        codeRepository: {
          repositoryUrl: 'https://github.com/joe-glasgow/ai-workflow-gui',
          sourceCodeVersion: {
            type: 'BRANCH',
            value: props.stage === 'prod' ? 'main' : props.stage === 'staging' ? 'staging' : 'develop',
          },
          codeConfiguration: {
            configurationSource: 'REPOSITORY',
          },
        },
        authenticationConfiguration: {
          connectionArn: 'arn:aws:apprunner:eu-west-1:191880149699:connection/ai-workflow-github/d3756bc40221447a9ac5773f4b1f4cb7',
        },
      },
      instanceConfiguration: {
        instanceRoleArn: appRunnerRole.roleArn,
        cpu: '1 vCPU',
        memory: '2 GB',
      },
    });

    // SNS Topic for Cost Alerts
    const costAlertTopic = new sns.Topic(this, 'CostAlertTopic', {
      topicName: `ai-workflow-cost-alerts-${props.stage}`,
      displayName: 'AI Workflow Cost Alerts',
    });

    // Kill Switch Lambda Function
    const killSwitchFunction = new lambda.Function(this, 'KillSwitchFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const apprunner = new AWS.AppRunner();
        const rds = new AWS.RDS();
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Kill switch triggered:', JSON.stringify(event, null, 2));
          
          const actions = [];
          
          try {
            // Pause App Runner service
            if (process.env.APP_RUNNER_ARN) {
              actions.push(apprunner.pauseService({
                ServiceArn: process.env.APP_RUNNER_ARN
              }).promise());
            }
            
            // Stop RDS instance
            if (process.env.DB_INSTANCE_ID) {
              actions.push(rds.stopDBInstance({
                DBInstanceIdentifier: process.env.DB_INSTANCE_ID
              }).promise());
            }
            
            await Promise.all(actions);
            
            // Send notification
            await sns.publish({
              TopicArn: process.env.SNS_TOPIC_ARN,
              Subject: '🚨 AI Workflow Kill Switch Activated',
              Message: \`AI Workflow services have been automatically shut down due to cost threshold breach.
              
Current threshold: $\${process.env.KILL_SWITCH_THRESHOLD}
Timestamp: \${new Date().toISOString()}

Services stopped:
- App Runner service paused
- RDS database stopped (data preserved)

To restart services, run:
cdk deploy --parameters RestartServices=true\`
            }).promise();
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Kill switch executed successfully' })
            };
          } catch (error) {
            console.error('Kill switch error:', error);
            throw error;
          }
        };
      `),
      environment: {
        KILL_SWITCH_THRESHOLD: props.killSwitchThreshold.toString(),
        SNS_TOPIC_ARN: costAlertTopic.topicArn,
        DB_INSTANCE_ID: database.instanceIdentifier,
        APP_RUNNER_ARN: appRunnerService.attrServiceArn,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions to Kill Switch Lambda
    killSwitchFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'apprunner:PauseService',
        'apprunner:ResumeService',
        'rds:StopDBInstance',
        'rds:StartDBInstance',
        'sns:Publish',
      ],
      resources: ['*'],
    }));

    costAlertTopic.grantPublish(killSwitchFunction);

    // CloudWatch Billing Alarm
    const billingAlarm = new cloudwatch.Alarm(this, 'BillingAlarm', {
      alarmName: `ai-workflow-billing-${props.stage}`,
      alarmDescription: `Billing alarm for AI Workflow ${props.stage} environment`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
        },
        statistic: 'Maximum',
        period: cdk.Duration.hours(6),
      }),
      threshold: props.killSwitchThreshold,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    billingAlarm.addAlarmAction({
      bind: () => ({
        alarmActionArn: costAlertTopic.topicArn,
      }),
    });

    // Subscribe Kill Switch Lambda to SNS topic
    costAlertTopic.addSubscription(new snsSubscriptions.LambdaSubscription(killSwitchFunction));

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for AI Workflow',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: 'S3 Assets Bucket Name',
    });

    new cdk.CfnOutput(this, 'KillSwitchFunctionArn', {
      value: killSwitchFunction.functionArn,
      description: 'Kill Switch Lambda Function ARN',
    });

    new cdk.CfnOutput(this, 'AppRunnerServiceUrl', {
      value: `https://${appRunnerService.attrServiceUrl}`,
      description: 'App Runner Service URL',
    });
  }
}
