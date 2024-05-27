import { wrapHandler } from 'aws-custom-resources';

export const handler = wrapHandler(async event => {
  await sleep(10000);
  return {};
});

function sleep(millis: number) {
  return new Promise(resolve => setTimeout(resolve, millis));
}
