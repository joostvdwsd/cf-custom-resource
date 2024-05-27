import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';

export function functionContext(): Context {
  return {
    getRemainingTimeInMillis: () => 1000,
    logGroupName: 'logGroupName',
    logStreamName: 'logStreamName',
  } as Context;
}

export function cfRequest(type: 'Create' | 'Update' | 'Delete', request?: Partial<CloudFormationCustomResourceEvent>): CloudFormationCustomResourceEvent {
  return {
    LogicalResourceId: 'LogicalResourceId',
    OldResourceProperties: {},
    PhysicalResourceId: 'PhysicalResourceId',
    RequestId: 'RequestId',
    ResourceProperties: {
      ServiceToken: 'ServiceToken',
    },
    ResourceType: 'ResourceType',
    ResponseURL: 'https://responseurl.com/',
    ServiceToken: 'ServiceToken',
    StackId: 'StackId',
    RequestType: type,
    ...request,
  };
}
