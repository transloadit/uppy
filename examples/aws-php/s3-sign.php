<?php

require 'vendor/autoload.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Short-circuit CORS preflight before any further processing.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

// CONFIG: Change these variables to a valid region and bucket.
$awsEndpoint = getenv('COMPANION_AWS_ENDPOINT') ?: null;
$awsRegion = getenv('COMPANION_AWS_REGION') ?: 'eu-west-2';
$bucket = getenv('COMPANION_AWS_BUCKET') ?: 'uppy-test';
// Directory to place uploaded files in.
$directory = 'uppy-php-example';

// Read credentials from the repo's Companion-style env vars (matches the
// .env used by the rest of the examples). Fall back to the AWS SDK's default
// credential chain (~/.aws/credentials, AWS_ACCESS_KEY_ID, etc.) if these
// aren't set.
$awsKey = getenv('COMPANION_AWS_KEY') ?: null;
$awsSecret = getenv('COMPANION_AWS_SECRET') ?: null;

$clientConfig = [
  'version' => 'latest',
  'endpoint' => $awsEndpoint,
  'region' => $awsRegion,
];
if ($awsKey && $awsSecret) {
  $clientConfig['credentials'] = [
    'key' => $awsKey,
    'secret' => $awsSecret,
  ];
}

$s3 = new Aws\S3\S3Client($clientConfig);

// The @uppy/aws-s3 plugin sends `{ method, key }` per operation.
// This example only handles PUT (PutObject) — multipart is disabled client-side.
$body = json_decode(file_get_contents('php://input'));
if (!is_object($body)) {
  http_response_code(400);
  header('content-type: application/json');
  echo json_encode(['error' => 'Invalid or empty JSON body']);
  exit;
}

$method = $body->method ?? 'PUT';
$key = $body->key ?? null;

if ($method !== 'PUT' || !$key) {
  http_response_code(400);
  header('content-type: application/json');
  echo json_encode(['error' => 'Only PUT requests with a key are supported']);
  exit;
}

$command = $s3->getCommand('putObject', [
  'Bucket' => $bucket,
  'Key' => "{$directory}/{$key}",
]);

$request = $s3->createPresignedRequest($command, '+5 minutes');

header('content-type: application/json');
// signRequest expects a `{ url }` response — no method/fields/headers.
echo json_encode([
  'url' => (string) $request->getUri(),
]);
