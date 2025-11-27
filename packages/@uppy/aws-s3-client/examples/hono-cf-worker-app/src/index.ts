import { Hono } from 'hono';
import { S3mini } from '../../../dist/s3mini.js';

const app = new Hono();

app.get('/', async c => {
  const s3 = new S3mini({
    // enter your credentials!
  });
  let exists: boolean = false;
  try {
    // Check if the bucket exists
    exists = await s3.bucketExists();
  } catch (err: any) {
    throw new Error(`Failed bucketExists() call, wrong credentials maybe: ${err.message}`);
  }
  if (!exists) {
    // Create the bucket based on the endpoint bucket name
    await s3.createBucket();
  }
  return c.text('Bucket is ready!');
});

export default app;
