<?php

require 'vendor/autoload.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: GET, POST');

// CONFIG: Change these variables to a valid region and bucket.
$awsEndpoint = getenv('COMPANION_AWS_ENDPOINT') ?: null;
$awsRegion = getenv('COMPANION_AWS_REGION') ?: 'eu-west-2';
$bucket = getenv('COMPANION_AWS_BUCKET') ?: 'uppy-test';
// Directory to place uploaded files in.
$directory = 'uppy-php-example';

// Create the S3 client.
$s3 = new Aws\S3\S3Client([
  'version' => 'latest',
  'endpoint' => $awsEndpoint,
  'region' => $awsRegion,
]);

// The @uppy/aws-s3 plugin sends `{ method, key }` per operation.
// This example only handles PUT (PutObject) — multipart is disabled client-side.
$body = json_decode(file_get_contents('php://input'));
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
