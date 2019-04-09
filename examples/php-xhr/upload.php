<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header('Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT');
    }
    //Make sure you remove those you do not want to support
    header('Access-Control-Allow-Origin: *');

    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header('Access-Control-Allow-Headers: {$_SERVER["HTTP_ACCESS_CONTROL_REQUEST_HEADERS"]}');
    }

    //Just exit with 200 OK with the above headers for OPTIONS method
    exit(0);
}

if ($_POST && !empty($_FILES["files"])) {
    $target_dir = './uploads/';
    $target_file = $target_dir . basename($_FILES['files']['name'][0]);
    try {
        move_uploaded_file($_FILES['files']['tmp_name'][0], $target_file);
        header('Access-Control-Allow-Origin: *');
        header('Content-type: application/json');
        $data = ['url' => $target_file, 'message' => 'The file ' . basename($_FILES['files']['name'][0]) . ' has been uploaded.'];
        http_response_code(201);
        echo json_encode($data);
    } catch (\Throwable $th) {
        header('Access-Control-Allow-Origin: *');
        header('Content-type: application/json');
        $data = ['message' => 'Sorry, there was an error uploading your file.', 'error'=>$th->getMessage()];
        http_response_code(400);
        echo json_encode($data);
    }
}
