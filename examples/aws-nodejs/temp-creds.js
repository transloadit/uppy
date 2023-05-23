const { STSClient, AssumeRoleCommand } = require('@aws-sdk/client-sts')
const path = require('node:path')

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })

const client = new STSClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.COMPANION_AWS_KEY,
    secretAccessKey: process.env.COMPANION_AWS_SECRET,
  },
})

async function getTempCredentials () {
  try {
    // Returns a set of temporary security credentials that you can use to
    // access Amazon Web Services resources that you might not normally
    // have access to.
    const command = new AssumeRoleCommand({
      // The Amazon Resource Name (ARN) of the role to assume.
      RoleArn: process.env.COMPANION_AWS_ROLE,
      // An identifier for the assumed role session.
      RoleSessionName: 'session1',
      // The duration, in seconds, of the role session. The value specified
      // can range from 900 seconds (15 minutes) up to the maximum session
      // duration set for the role.
      DurationSeconds: 60 * 60,
    })
    const response = await client.send(command)
    console.log(response)
    console.log('>>>>>>>>>>', response)
  } catch (err) {
    console.log('>>>>>> error:', err)
  }
}

getTempCredentials()
