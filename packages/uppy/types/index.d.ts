// Type definitions for uppy
// Project: https://uppy.io
// Definitions by: taoqf <https://github.com/taoqf>

// Core
import Core = require('@uppy/core');
export { Core };

// Stores
import DefaultStore = require('@uppy/store-default');
export { DefaultStore };
import ReduxStore = require('@uppy/store-redux');
export { ReduxStore };

// UI plugins
import Dashboard = require('@uppy/dashboard');
export { Dashboard };
import DragDrop = require('@uppy/drag-drop');
export { DragDrop };
import FileInput = require('@uppy/file-input');
export { FileInput };
import Informer = require('@uppy/informer');
export { Informer };
import ProgressBar = require('@uppy/progress-bar');
export { ProgressBar };
import StatusBar = require('@uppy/status-bar');
export { StatusBar };

// Acquirers
import Dropbox = require('@uppy/dropbox');
export { Dropbox };
import GoogleDrive = require('@uppy/google-drive');
export { GoogleDrive };
import Instagram = require('@uppy/instagram');
export { Instagram };
import Url = require('@uppy/url');
export { Url };
import Webcam = require('@uppy/webcam');
export { Webcam };

// Uploaders
import AwsS3 = require('@uppy/aws-s3');
export { AwsS3 };
import AwsS3Multipart = require('@uppy/aws-s3-multipart');
export { AwsS3Multipart };
import Transloadit = require('@uppy/transloadit');
export { Transloadit };
import Tus = require('@uppy/tus');
export { Tus };
import XHRUpload = require('@uppy/xhr-upload');
export { XHRUpload };

// Miscellaneous
import Form = require('@uppy/form');
export { Form };
import GoldenRetriever = require('@uppy/golden-retriever');
export { GoldenRetriever };
import ReduxDevTools = require('@uppy/redux-dev-tools');
export { ReduxDevTools };
import ThumbnailGenerator = require('@uppy/thumbnail-generator');
export { ThumbnailGenerator };
