#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Ekstack } from '../lib/eks-cluster-stack';
import { K8sBaselineStack } from '../lib/k8s-baseline';
import { K8snodegroups } from '../lib/k8s-nodegroup';
import {RDSDataStack} from "../lib/rds-database-stack";

const DEFAULT_CONFIG = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
};

const app = new App();
const prefix = stackPrefix(app);
const eks = new Ekstack(app, 'EKSStack', {
  env: DEFAULT_CONFIG.env,
  stackName: `${prefix}EKSStack`,
});

const nodegroups = new K8snodegroups(app, 'EKSNodeGroups', {
  env: DEFAULT_CONFIG.env,
  stackName: `${prefix}EKSNodeGroups`,
  eksCluster: eks.cluster,
  nodeGroupRole: eks.createNodegroupRole('nodeGroup1'),
});

const k8sbase = new K8sBaselineStack(app, 'EKSK8sBaseline', {
  env: DEFAULT_CONFIG.env,
  stackName: `${prefix}EKSK8sBaseline`,
  eksCluster: eks.cluster,
});

const rdsdatabase = new RDSDataStack(app, 'RDSDataStack', {
  env: DEFAULT_CONFIG.env,
  stackName: `${prefix}RDSDataStack`,
  eksCluster: eks.cluster,
});

// Link all the stacks in as deps
rdsdatabase.addDependency(k8sbase);
k8sbase.addDependency(nodegroups);
nodegroups.addDependency(eks);

function stackPrefix (stack: Construct): string {
  const prefixValue = stack.node.tryGetContext('stack_prefix');

  if (prefixValue !== undefined) {
    return prefixValue.trim();
  }
  return ''.trim();
}
app.synth();
