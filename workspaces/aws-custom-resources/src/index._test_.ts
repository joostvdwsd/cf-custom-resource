import https from 'https';

import { cfRequest, functionContext } from './_tests_/mocks';
import { wrapHandler } from '.';

jest.mock('https');
const requestMock = https.request as jest.Mock;
const writeMock = jest.fn();
requestMock.mockImplementation((_req: any, cb: any) => {
  setTimeout(() => cb({
    on: cb,
    statusCode: 200,
    statusMessage: 'API Success',
  }), 10);

  return { on: () => { }, end: () => { }, write: writeMock,
  };
});

describe('Core functionality', () => {
  it('Should normally complete a request', async () => {
    const handler = wrapHandler(async () => {
      return {};
    });

    await handler(cfRequest('Update'), functionContext(), () => {});

    expect(requestMock).toHaveBeenCalledWith(expect.objectContaining({ method: 'PUT', hostname: 'responseurl.com' }), expect.any(Function));
    expect(writeMock).toHaveBeenNthCalledWith(1, expect.stringContaining('{"Status":"SUCCESS"'));
  });

  it('Should catch an error', async () => {
    console.error = jest.fn();
    const handler = wrapHandler(async () => {
      throw new Error('My Error');
    });

    await handler(cfRequest('Update'), functionContext(), () => { });

    expect(writeMock).toHaveBeenNthCalledWith(2, expect.stringContaining('{"Status":"FAILED","Reason":"My Error'));
  });

  it('Should detect a timeout and send before killed', async () => {
    console.error = jest.fn();
    const handler = wrapHandler(async () => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return {};
    });

    await handler(cfRequest('Update'), functionContext(), () => { });

    expect(writeMock).toHaveBeenNthCalledWith(3, expect.stringContaining('{"Status":"FAILED","Reason":"Custom Resource timeout'));
  });

  it('Should return a failed create physical ID', async () => {
    console.error = jest.fn();
    const handler = wrapHandler(async () => {
      throw new Error('Create failed');
    });

    await handler(cfRequest('Create'), functionContext(), () => { });

    expect(writeMock).toHaveBeenNthCalledWith(5, expect.stringContaining('{"Status":"FAILED","Reason":"Create failed'));
    expect(writeMock).toHaveBeenNthCalledWith(5, expect.stringContaining('"PhysicalResourceId":"aws-custom-resources:CREATE_FAILED_PHYSICAL_ID"'));
  });

  it('Should ignore delete errors when the create failed', async () => {
    console.error = jest.fn();
    const handler = wrapHandler(async () => {
      throw new Error('Create failed');
    });

    await handler(cfRequest('Delete', {
      PhysicalResourceId: 'aws-custom-resources:CREATE_FAILED_PHYSICAL_ID',
    }), functionContext(), () => { });

    expect(writeMock).toHaveBeenNthCalledWith(6, expect.stringContaining('{"Status":"SUCCESS"'));
  });

  it('Should return physical id based on log stream on create when not provided', async () => {
    console.error = jest.fn();
    const handler = wrapHandler(async () => {
      return {};
    });

    await handler(cfRequest('Create'), functionContext(), () => { });

    expect(writeMock).toHaveBeenNthCalledWith(7, expect.stringContaining('{"Status":"SUCCESS"'));
    expect(writeMock).toHaveBeenNthCalledWith(7, expect.stringContaining('"PhysicalResourceId":"logStreamName"'));
  });
});
