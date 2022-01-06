<?php


if(str_starts_with($_SERVER['REQUEST_URI'], '/main.js')) {
    header("Content-Type: text/javascript; charset=UTF-8");
    passthru('corepack yarn outputBundle');
    return true;
} else if (str_starts_with($_SERVER['REQUEST_URI'], '/uppy.min.css')) {
    header("Content-Type: text/css; charset=UTF-8");
    if(readfile(exec('node -p \'require.resolve("uppy").replace((p=require("uppy/package.json")).main,p.style)\'')) === false) {
        http_response_code(404);
        echo 'Cannot find the CSS file, be sure to run the build command.';
    }
    return true;
} else {
    return false;
}
