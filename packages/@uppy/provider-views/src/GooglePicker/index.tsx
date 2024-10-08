import { h } from 'preact'
import { Fragment } from 'preact/compat'
import type { Uppy } from '@uppy/core';
import { useCallback, useEffect, useState } from 'preact/hooks';

import './index.css';


const injectedScripts = new Set<string>();

// https://stackoverflow.com/a/39008859/6519037
async function injectScript(src: string) {
  if (injectedScripts.has(src)) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', e => reject(e.error));
    document.head.appendChild(script);
  });
  injectedScripts.add(src);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function GooglePickerView({ provider, uppy, clientId, apiKey, appId }: {
  provider: unknown, // todo
  uppy: Uppy<any, any>,
  clientId: string,
  apiKey: string,
  appId: string,
}) {
  // Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
  const scopes = 'https://www.googleapis.com/auth/drive.file';
  // 'https://www.googleapis.com/auth/photoslibrary.readonly' would be for google photos,
  // but it doesn't seem to work (see comment below)

  const [accessToken, setAccessToken] = useState<string>();
  const [loading, setLoading] = useState(false); // todo

  useEffect(() => {
    (async () => {
      try {
        await Promise.all([
          injectScript('https://accounts.google.com/gsi/client'), // Google Identity Services
          (async () => {
            await injectScript('https://apis.google.com/js/api.js');
            await new Promise<void>((resolve) => gapi.load('client:picker', () => resolve()));
            await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
          })(),
        ]);


        // setTokenClient(newTokenClient);

      } catch (err) {
        uppy.log(err)
      }
    })()
  }, [uppy]);

  const onPicked = useCallback(async (picked: google.picker.ResponseObject) => {
    if (picked.action === google.picker.Action.PICKED) {
      // eslint-disable-next-line no-console
      console.log('Picker response', JSON.stringify(picked, null, 2));
      // todo add these files along with any metadata needed by companion to download the files,
      // like accessToken, clientId etc.
      // companion needs to present an endpoint that will call gapi.client.drive.files.get,
      // and stream (download/upload) the file to the destination (e.g. tus/s3 etc)
      // something like this:
      /* const document = picked[google.picker.Response.DOCUMENTS][0];
      const fileId = document[google.picker.Document.ID];
      console.log(fileId);
      const res = await gapi.client.drive.files.get({
        fileId,
        'fields': '*',
      });
      console.log('Drive API response for first document', JSON.stringify(res.result, null, 2));
      */
    }
  }, []);

  const showPicker = useCallback((token: string) => {
    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setDeveloperKey(apiKey)
      .setAppId(appId)
      .setOAuthToken(token)
      .addView(
        new google.picker.DocsView(google.picker.ViewId.DOCS)
          .setIncludeFolders(true)
          // Note: setEnableDrives doesn't seem to work
          // .setEnableDrives(true)
          .setSelectFolderEnabled(true)
      )
      // NOTE: photos is broken and results in an error being returned from Google
      // .addView(google.picker.ViewId.PHOTOS)
      .setCallback(onPicked)
      .build();
  
    picker.setVisible(true);
  }, [apiKey, appId, onPicked]);

  const handleAuthOrRefreshClick = useCallback(async () => {
    setLoading(true);
    try {
      const response = await new Promise<google.accounts.oauth2.TokenResponse>((resolve) => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes,
          callback: resolve,
        });

        if (accessToken === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          tokenClient.requestAccessToken({ prompt: '' });
        }
      })
      if (response.error !== undefined) {
        throw (response);
      }
      const { access_token: newAccessToken } = response;
      setAccessToken(newAccessToken);

      showPicker(newAccessToken);
    } finally {
      setLoading(false);
    }
  }, [accessToken, clientId, showPicker]);

  const handleSignoutClick = useCallback(async () => {
    if (accessToken == null) return;
    if (accessToken) {
      await new Promise<void>((resolve) => google.accounts.oauth2.revoke(accessToken, resolve));
      setAccessToken(undefined);
    }
  }, [accessToken]);

  return (
    <>
      {accessToken != null && (
        <>
          <button type="button" onClick={handleSignoutClick} id="signout_button">Sign out</button>
          <button type="button" onClick={() => showPicker(accessToken)} id="signout_button">Pick files</button>
        </>
      )}
      <button type="button" disabled={loading} onClick={handleAuthOrRefreshClick} id="signout_button">{accessToken ? 'Refresh' : 'Authorize'}</button>
    </>
  )
}
