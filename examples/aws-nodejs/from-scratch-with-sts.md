Assuming you have MY-UPPY-USER and MY-UPPY-BUCKET, here’s how you can allow MY-UPPY-USER to get STS Federated Token and upload files to MY-UPPY-BUCKET:

1. Set CORS settings on `MY-UPPY-BUCKET` bucket:

    ```json
    [
        {
            "AllowedHeaders": [
                "*"
            ],
            "AllowedMethods": [
                "GET",
                "PUT",
                "HEAD",
                "POST",
                "DELETE"
            ],
            "AllowedOrigins": [
                "*"
            ],
            "ExposeHeaders": [
                "ETag",
                "Location"
            ]
        }
    ]
    ```

2. Add a Policy to `MY-UPPY-BUCKET`:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "MyMultipartPolicyStatement1",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::*:user/MY-UPPY-USER"
                },
                "Action": [
                    "s3:PutObject",
                    "s3:ListMultipartUploadParts",
                    "s3:AbortMultipartUpload"
                ],
                "Resource": "arn:aws:s3:::MY-UPPY-BUCKET/*"
            }
        ]
    }
    ```

3. Add a Policy to `MY-UPPY-USER`:
    
    **Optional** if you’d like to enable signing on the client:

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "MyStsPolicyStatement1",
                "Effect": "Allow",
                "Action": [
                    "sts:GetFederationToken"
                ],
                "Resource": [
                    "arn:aws:sts::*:federated-user/*"
                ]
            }
        ]
    }
	```
