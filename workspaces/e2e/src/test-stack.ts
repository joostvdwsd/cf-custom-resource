import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const handler = new NodejsFunction(this, 'handler');
    // new cdk.CustomResource(this, 'cr', {
    //   serviceToken: handler.functionArn,
    // });
  }
}
