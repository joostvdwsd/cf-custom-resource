import {
  CloudFormationCustomResourceEvent,
  CloudFormationCustomResourceHandler,
  CloudFormationCustomResourceResponse,
  Context,
} from "aws-lambda";
import * as https from 'https';
import { LogLevel, Logger } from './logger';

export interface TypeSafeCloudFormationResourceResponse {
  PhysicalResourceId?: string;
  Data?: Record<string, string>;
  NoEcho?: boolean;
}
export type TypeSafeCloudFormationResourceEvent = Omit<CloudFormationCustomResourceEvent, 'ResponseURL'>;
export type TypesafeCloudFormationResourceHandler = (event: TypeSafeCloudFormationResourceEvent, context: Context) => Promise<TypeSafeCloudFormationResourceResponse>;

export function wrapHandler(handler: TypesafeCloudFormationResourceHandler, logLevel: LogLevel = LogLevel.warn) : CloudFormationCustomResourceHandler {
  return async (event, context) => {
    const resourceHandler = new CustomResourceHandler(handler, event, context, logLevel);
    await resourceHandler.handle();
  }
}

export class CustomResourceHandler {
  private logger: Logger;
  private timeoutHandler: NodeJS.Timeout;

  constructor(private handlerFunction: TypesafeCloudFormationResourceHandler, private event: CloudFormationCustomResourceEvent, private context: Context, private logLevel: LogLevel) {
    this.logger = new Logger(logLevel);
  }

  async handle() {
    this.logger.debug('EVENT  :', this.event);
    this.logger.debug('CONTEXT:', this.context);

    this.startTimeout();

    try {
      const result = await this.handlerFunction(this.event, this.context)
      await this.sendSuccess(result);
    } catch (error) {
      this.logger.error('ERROR:', error);
      if (error instanceof Error) {
        this.sendFailure(error.message);
      } else {
        this.sendFailure(`${error}`);
      }
    }
  }

  startTimeout() {
    this.timeoutHandler = setTimeout(() => {
      this.sendFailure('Custom Resource timeout');
    },
      this.context.getRemainingTimeInMillis() - 1000,
    );
  }

  resetTimeout() {
    clearTimeout(this.timeoutHandler);
  }

  getPhysicalResourceId(PhysicalResourceId?: string): string {
    if (PhysicalResourceId) {
      return PhysicalResourceId;
    }

    if (this.event.RequestType === 'Update' || this.event.RequestType === 'Delete') {
      return this.event.PhysicalResourceId;
    }

    return this.context.logStreamName;
  }

  async sendSuccess(response: TypeSafeCloudFormationResourceResponse) {
    this.resetTimeout();

    this.logger.debug(`[SUCCESS] Recieved response:`, JSON.stringify(response.Data, null, 2), );

    const responseBody: CloudFormationCustomResourceResponse = {
      /* eslint-disable @typescript-eslint/naming-convention */
      Status: 'SUCCESS',
      PhysicalResourceId: this.getPhysicalResourceId(response.PhysicalResourceId),
      StackId: this.event.StackId,
      RequestId: this.event.RequestId,
      LogicalResourceId: this.event.LogicalResourceId,
      Data: response.Data,
      NoEcho: response.NoEcho,
      /* eslint-enable @typescript-eslint/naming-convention */
    };
    await this.sendHttpResponse(responseBody);
  }

  async sendFailure(message: string) {
    this.resetTimeout();

    this.logger.debug(`[FAILURE] Recieved failure:`, message);

    const responseBody: CloudFormationCustomResourceResponse = {
      /* eslint-disable @typescript-eslint/naming-convention */
      Status: 'FAILED',
      Reason: `Cloudwatch Log: ${this.context.logStreamName}\n${message}`,
      PhysicalResourceId: this.getPhysicalResourceId(),
      StackId: this.event.StackId,
      RequestId: this.event.RequestId,
      LogicalResourceId: this.event.LogicalResourceId,
      /* eslint-enable @typescript-eslint/naming-convention */
    };
    await this.sendHttpResponse(responseBody);    
  }

  async sendHttpResponse(response: CloudFormationCustomResourceResponse) {
    return new Promise<void>((resolve, reject) => {
      const bodyString = JSON.stringify(response);

      const url = new URL(this.event.ResponseURL!);

      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: `${url.pathname}${url.search}`,
        method: 'PUT',
        headers: {
          /* eslint-disable @typescript-eslint/naming-convention */
          'content-type': '',
          'content-length': bodyString.length,
          /* eslint-enable @typescript-eslint/naming-convention */
        },
      };

      this.logger.info('Sending response to cloudformation: ', JSON.stringify({ options, bodyString }, null, 2),);
      
      const request = https.request(options, (response) => {
        this.logger.debug('HTTP Response:', {
          status: response.statusCode,
          headers: response.headers,
        });
        resolve();
      });

      request.on('error', (error) => {
        this.logger.error('sendHttpResponse stream Error:', JSON.stringify(error));
        reject(error);
      });

      request.write(bodyString);
      request.end();
    })
  }

}