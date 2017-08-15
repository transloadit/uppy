<?php

require 'vendor/autoload.php';
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: GET");

// CONFIG: Change these variables to a valid region and bucket.
$awsRegion = 'eu-west-2';
$bucket = 'uppy-test';
// Directory to place uploaded files in.
$directory = 'uppy-php-example';

// Create the S3 client.
$s3 = new Aws\S3\S3Client([
  'version' => 'latest',
  'region' => $awsRegion,
]);

// Retrieve data about the file to be uploaded from the query string.
list(
  'filename' => $filename,
  'content-type' => $contentType,
) = $_GET;

// Prepare a PutObject command.
$command = $s3->getCommand('putObject', [
  'Bucket' => $bucket,
  'Key' => "{$directory}/{$filename}",
  'ContentType' => $contentType,
  'Body' => '',
]);

$request = $s3->createPresignedRequest($command, '+5 minutes');

header('content-type: application/json');
echo json_encode([
  'method' => $request->getMethod(),
  'url' => (string) $request->getUri(),
  'fields' => [],
]);
