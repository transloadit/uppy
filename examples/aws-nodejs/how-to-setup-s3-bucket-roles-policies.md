
1. Create a new Bucket https://s3.console.aws.amazon.com/s3/buckets?region=us-east-1
2. Create new Policy that has write access to your bucket:

```
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Sid": "AllowUploadToBucket",
          "Effect": "Allow",
          "Action": [
              "s3:PutObject",
              "s3:AbortMultipartUpload",
              "s3:ListBucket",
              "s3:GetObjectVersion",
              "s3:ListMultipartUploadParts"
          ],
          "Resource": [
              "arn:aws:s3:::example-bucket/*",
              "arn:aws:s3:::example-bucket"
          ]
      }
  ]
}
```

3. Create new Role with the Policy from step 2 https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/roles/create?policies=arn

```
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Principal": {
              "Service": "s3.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
      }
  ]
}
```
4. Create a new user https://us-east-1.console.aws.amazon.com/iamv2/home?region=us-east-1#/users/create, choose Attach Policies Directly, and add the Policy from step 3 to this new user.

5. Copy user ARN, go to the Role from step 3, choose “Edit trust policy”. Make sure your user is listed in the trust policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "YOUR_USER"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

6. Go to your user and create a key. Then use it with `temp-creds.js` key to get temporary AccessKeyId, SecretAccessKey and SessionToken.