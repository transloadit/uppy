import s3mini from '../src/S3'

const accessKeyId = ''
const secretAccessKey = ''
const region = ''
const bucket = ''

const endpoint = `https://${bucket}.s3.${region}.amazonaws.com`

;('https://testbucketnewfix.s3.eu-north-1.amazonaws.com')
async function main() {
  const s3 = new s3mini({
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
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
