<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Get the maximum upload file size
$max_size = ini_get('upload_max_filesize');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
    }
    //Make sure you remove those you do not want to support
    header('Access-Control-Allow-Origin: *');

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }

    //Just exit with 200 OK with the above headers for OPTIONS method
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_FILES["file"])) {
    $target_dir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
    $file_name = basename($_FILES['file']['name']);
    $file_size = $_FILES['file']['size'];
    $target_file = $target_dir . DIRECTORY_SEPARATOR . $file_name;

    // Validate file size
    if ($file_size > $max_size) {
        header('Access-Control-Allow-Origin: *');
        header('Content-type: application/json');
        $data = ['message' => 'File size exceeds the maximum allowed size of ' . $max_size . '.'];
        http_response_code(400);
        echo json_encode($data);
        exit;
    }

    // Sanitize file name to prevent directory traversal attacks
    $file_name = preg_replace('/[^a-zA-Z0-9._-]/', '', $file_name);
    $target_file = $target_dir . DIRECTORY_SEPARATOR . $file_name;

    try {
        if (move_uploaded_file($_FILES['file']['tmp_name'], $target_file)) {
            header('Access-Control-Allow-Origin: *');
            header('Content-type: application/json');
            $data = ['url' => $target_file, 'message' => 'The file ' . $file_name . ' has been uploaded.'];
            http_response_code(201);
            echo json_encode($data);
        } else {
            throw new Exception('Unable to move the uploaded file to its final location:' . $target_file);
        }

    } catch (\Throwable $th) {
        header('Access-Control-Allow-Origin: *');
        header('Content-type: application/json');
        $data = ['message' => 'Sorry, there was an error uploading your file.', 'error' => $th->getMessage()];
        http_response_code(400);
        echo json_encode($data);
    }
} else {
    header('Access-Control-Allow-Origin: *');
    header('Content-type: application/json');
    $data = ['message' => 'Please upload a file.'];
    http_response_code(400);
    echo json_encode($data);
}
