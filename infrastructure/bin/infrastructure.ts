#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AIWorkflowStack } from '../lib/ai-workflow-stack';

const app = new cdk.App();

// Get stage from context or default to 'dev'
const stage = app.node.tryGetContext('stage') || 'dev';

// Environment-specific configuration
const envConfig = {
  dev: {
    killSwitchThreshold: 10,
    warningThreshold: 5,
  },
  staging: {
    killSwitchThreshold: 25,
    warningThreshold: 15,
  },
  prod: {
    killSwitchThreshold: 100,
    warningThreshold: 60,
  },
};

const config = envConfig[stage as keyof typeof envConfig] || envConfig.dev;

new AIWorkflowStack(app, `AIWorkflowStack-${stage}`, {
  stage,
  killSwitchThreshold: config.killSwitchThreshold,
  warningThreshold: config.warningThreshold,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'eu-west-1',
  },
  description: `AI Workflow GUI infrastructure for ${stage} environment`,
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'AI-Workflow-GUI');
cdk.Tags.of(app).add('Stage', stage);
cdk.Tags.of(app).add('ManagedBy', 'CDK');
