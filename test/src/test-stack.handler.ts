import { wrapHandler } from 'aws-custom-resources';

export const handler = wrapHandler(async event => {
  throw new Error('Omg something is wrong');
  return {
  }
})