import { hexFromBuffer, hmac, sha256 } from './utils';
import { HEADER_AMZ_CONTENT_SHA256, HEADER_AMZ_DATE, HEADER_HOST, UNSIGNED_PAYLOAD, AWS_ALGORITHM } from './consts';
/**
 * get the url
 * create the headers object which we need to sign
 * create the sortedHeared and ignored headers
 * build canonicalHeaders
 * build query string
 * build cannonical request
 * build string to sign
 */

// get the url

export function createSigV4Signer({ accessKeyId, secretAccessKey, region }) {
  //
  let signingKeyDate;
  let singingKey;

  const getSignatureKey = async dateStamp => {
    const kDate = await U.hmac(`AWS4${this.secretAccessKey}`, dateStamp);
    const kRegion = await U.hmac(kDate, this.region);
    const kService = await U.hmac(kRegion, C.S3_SERVICE);
    return await hmac(kService, C.AWS_REQUEST_TYPE);
  };

  return async function signRequest({ method, url, headers }) {
    const parsedUrl = new URL(url);

    const d = new Date();
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');

    const shortDatetime = `${year}${month}${day}`;
    const fullDatetime = `${shortDatetime}T${String(d.getUTCHours()).padStart(2, '0')}${String(
      d.getUTCMinutes(),
    ).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}Z`;
    const credentialScope = `${shortDatetime}/${this.region}/${C.S3_SERVICE}/${C.AWS_REQUEST_TYPE}`;

    // Headers to sign

    const singedHeadersObj = {
      ...headers,
      HEADER_AMZ_CONTENT_SHA256: UNSIGNED_PAYLOAD,
      HEADER_AMZ_DATE: fullDatetime,
      HEADER_HOST: parsedUrl.host,
    };

    const ignoredHeaders = new Set(['authorization', 'content-length', 'content-type', 'user-agent']);

    let canonicalHeaders = '';
    let signedHeaders = '';

    const sortedHeaders = Object.entries(singedHeadersObj)
      .filter(([key]) => !ignoredHeaders.has(key.toLocaleLowerCase()))
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

    for (const [key, value] of sortedHeaders) {
      const lowerKey = key.toLowerCase();
      if (canonicalHeaders) {
        canonicalHeaders += '\n';
        signedHeaders += ';';
      }
      canonicalHeaders += `${lowerKey}:${String(value).trim()}`;
      signedHeaders += lowerKey;
    }

    const queryParams = {};
    parsedUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    const canonicalQueryString = Object.keys(queryParams)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`)
      .sort()
      .join('&');

    // canonical request

    const canonicalRequest = [
      method,
      parsedUrl.pathname,
      canonicalQueryString,
      canonicalHeaders,
      '',
      signedHeaders,
      UNSIGNED_PAYLOAD,
    ].join('\n');

    // build string to sign

    const hashedCanonical = hexFromBuffer(await sha256(canonicalRequest));

    const stringToSign = ['AWS4-HMAC-SHA256', fullDatetime, credentialScope, hashedCanonical].join('\n');

    // get key

    if (shortDatetime !== signingKeyDate || !singingKey) {
      signingKeyDate = shortDatetime;
      singingKey = await getSignatureKey(shortDatetime);
    }

    // get signature
    const signature = hexFromBuffer(await hmac(singingKey, stringToSign));

    // auth header

    const authorization = `${C.AWS_ALGORITHM} Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...singedHeadersObj,
      authorization: authorization,
    };
  };
}
