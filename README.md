# Aws Custom resources

Helper package to work quick and safely with AWS custom resources using typescript

![NPM Version](https://img.shields.io/npm/v/aws-custom-resources)

## Using the package

We use a ***wrapHandler*** function to wrap the actual handler. This wrapper handles all errors and responses to communicate back to cloudformation. It also creates a stong typed interface so all request parameters and response parameters are suggested by your code completion.

### Minimal example

```typescript
import { wrapHandler } from 'aws-custom-resources';

export const handler = wrapHandler(async event => {
  return {};
});
```

This will already handle all the logic to communicate a successfull state back to cloudformation.

### More complete example

```typescript
import { wrapHandler } from 'aws-custom-resources';
import { AppClient } from 'internal-company-package'

const client = new AppClient();

export const handler = wrapHandler(async (event, context) => {
  if (event.RequestType === 'Delete') {
    await client.deleteApplicationRegistration(event.ResourceProperties.applicationId);
    return {};
  }

  // Other options are 'Create' and 'Update'. In this example we consider them equal
  const id = await client.registerApplication(event.ResourceProperties.applicationId, context.logGroupName);
  return {
    PhysicalResourceId: id,
    NoEcho: true
  }
});
```

### Common Errors

Common errors are captured and send as a FAILED state to cloudformation with the message so you will see it in your event trace

```typescript
import { wrapHandler } from 'aws-custom-resources';

export const handler = wrapHandler(async event => {
  throw new Error('Omg something terrible happened!')
});
```

### Timeout errors 

Cdk creates lambdas standard with a timeout of 3 second. This snippet will never finish but will end up in a FAILED state in cloud formation with the message *'Custom Resource timeout'*.

```typescript
import { wrapHandler } from 'aws-custom-resources';

export const handler = wrapHandler(async event => {
  await sleep(10000);
  return {}
});

function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
```



## Reference