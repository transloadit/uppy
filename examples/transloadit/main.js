import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import Form from "@uppy/form";
import ImageEditor from "@uppy/image-editor";
import RemoteSources from "@uppy/remote-sources";
import Transloadit, { COMPANION_URL } from "@uppy/transloadit";
import Webcam from "@uppy/webcam";
import GoldenRetriever from "@uppy/golden-retriever";
import "@uppy/core/css/style.css";
import "@uppy/dashboard/css/style.css";
import "@uppy/image-editor/css/style.css";

const TRANSLOADIT_KEY = "RsiWVN5IVqWNbSjPnk79p40TEHnyigoi";
// Trivial image-resize template (matches the prior projection-test fixture).
const TEMPLATE_ID = "e88b6f4e4b434832a6f8b747fc60725d";

/**
 * Form
 */

/**
 * Dashboard
 */

const dashboard = new Uppy({
  debug: true,
  autoProceed: false,
})
  .use(Dashboard, {
    inline: true,
    target: "#dashboard",
    note: "Only PNG files please!",
  })
  .use(RemoteSources, { companionUrl: COMPANION_URL })
  .use(Webcam, { target: Dashboard })
  .use(ImageEditor, { target: Dashboard })
  .use(Transloadit, {
    waitForEncoding: true,
    assemblyOptions: {
      params: {
        auth: { key: TRANSLOADIT_KEY },
        template_id: TEMPLATE_ID,
      },
    },
  })
  .use(GoldenRetriever);

window.dashboard = dashboard;
