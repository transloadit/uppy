import { S3mini } from '../src/S3.js'
import { createSigV4Signer } from '../src/test-utils/sigv4-signer.js'

const accessKeyId = ''
const secretAccessKey = ''
const region = ''
const bucket = ''

const endpoint = `https://${bucket}.s3.${region}.amazonaws.com`

// ! WIP need to add signer and test with aws
;('https://testbucketnewfix.s3.eu-north-1.amazonaws.com')
async function main() {
  const signer = createSigV4Signer({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region,
  })
  const s3 = new S3mini({
    endpoint,
    region,
    signRequest: signer,
  })

  const testKey = `s3mini-test-${Date.now()}.txt`
  const body = 'testing s3 mini plugin'

  console.log('uploading object..')
  await s3.putObject(testKey, body, 'text/plain')

  console.log('listing objects with prefix s3mini')
  const objects = await s3.listObjects('/', 's3mini', 10)

  console.log('logging objects ---> ', objects)

  const downloaded = await s3.getObject(testKey)
  console.log('Content : -----> ', downloaded)

  console.log('not deleting')
  // const deleted = await s3.deleteObject(testKey)
  // console.log("Deleted --->", deleted)
}

main().catch((err) => {
  console.error('Test failed: ', err)
})
