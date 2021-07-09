// Type definitions for uppy
// Project: https://uppy.io
// Definitions by: taoqf <https://github.com/taoqf>

// Core
import Core from '@uppy/core';
export { Core };

// Stores
import DefaultStore from '@uppy/store-default';
export { DefaultStore };
import ReduxStore from '@uppy/store-redux';
export { ReduxStore };

// UI plugins
import Dashboard from '@uppy/dashboard';
export { Dashboard };
import DragDrop from '@uppy/drag-drop';
export { DragDrop };
import DropTarget from '@uppy/drop-target';
export { DropTarget };
import FileInput from '@uppy/file-input';
export { FileInput };
import Informer from '@uppy/informer';
export { Informer };
import ProgressBar from '@uppy/progress-bar';
export { ProgressBar };
import StatusBar from '@uppy/status-bar';
export { StatusBar };

// Acquirers
import Dropbox from '@uppy/dropbox';
export { Dropbox };
import Box from '@uppy/box';
export { Box };
import GoogleDrive from '@uppy/google-drive';
export { GoogleDrive };
import Instagram from '@uppy/instagram';
export { Instagram };
import Url from '@uppy/url';
export { Url };
import Webcam from '@uppy/webcam';
export { Webcam };
import ScreenCapture from '@uppy/screen-capture';
export { ScreenCapture };

// Uploaders
import AwsS3 from '@uppy/aws-s3';
export { AwsS3 };
import AwsS3Multipart from '@uppy/aws-s3-multipart';
export { AwsS3Multipart };
import Transloadit from '@uppy/transloadit';
export { Transloadit };
import Tus from '@uppy/tus';
export { Tus };
import XHRUpload from '@uppy/xhr-upload';
export { XHRUpload };

// Miscellaneous
import Form from '@uppy/form';
export { Form };
import GoldenRetriever from '@uppy/golden-retriever';
export { GoldenRetriever };
import ReduxDevTools from '@uppy/redux-dev-tools';
export { ReduxDevTools };
import ThumbnailGenerator from '@uppy/thumbnail-generator';
export { ThumbnailGenerator };
