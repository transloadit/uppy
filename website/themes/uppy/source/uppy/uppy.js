(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Uppy = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Module dependencies.
 */

var Emitter = require('emitter');
var reduce = require('reduce');

/**
 * Root reference for iframes.
 */

var root;
if (typeof window !== 'undefined') { // Browser window
  root = window;
} else if (typeof self !== 'undefined') { // Web Worker
  root = self;
} else { // Other environments
  root = this;
}

/**
 * Noop.
 */

function noop(){};

/**
 * Check if `obj` is a host object,
 * we don't want to serialize these :)
 *
 * TODO: future proof, move to compoent land
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isHost(obj) {
  var str = {}.toString.call(obj);

  switch (str) {
    case '[object File]':
    case '[object Blob]':
    case '[object FormData]':
      return true;
    default:
      return false;
  }
}

/**
 * Determine XHR.
 */

request.getXHR = function () {
  if (root.XMLHttpRequest
      && (!root.location || 'file:' != root.location.protocol
          || !root.ActiveXObject)) {
    return new XMLHttpRequest;
  } else {
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}
  }
  return false;
};

/**
 * Removes leading and trailing whitespace, added to support IE.
 *
 * @param {String} s
 * @return {String}
 * @api private
 */

var trim = ''.trim
  ? function(s) { return s.trim(); }
  : function(s) { return s.replace(/(^\s*|\s*$)/g, ''); };

/**
 * Check if `obj` is an object.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isObject(obj) {
  return obj === Object(obj);
}

/**
 * Serialize the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

function serialize(obj) {
  if (!isObject(obj)) return obj;
  var pairs = [];
  for (var key in obj) {
    if (null != obj[key]) {
      pushEncodedKeyValuePair(pairs, key, obj[key]);
        }
      }
  return pairs.join('&');
}

/**
 * Helps 'serialize' with serializing arrays.
 * Mutates the pairs array.
 *
 * @param {Array} pairs
 * @param {String} key
 * @param {Mixed} val
 */

function pushEncodedKeyValuePair(pairs, key, val) {
  if (Array.isArray(val)) {
    return val.forEach(function(v) {
      pushEncodedKeyValuePair(pairs, key, v);
    });
  }
  pairs.push(encodeURIComponent(key)
    + '=' + encodeURIComponent(val));
}

/**
 * Expose serialization method.
 */

 request.serializeObject = serialize;

 /**
  * Parse the given x-www-form-urlencoded `str`.
  *
  * @param {String} str
  * @return {Object}
  * @api private
  */

function parseString(str) {
  var obj = {};
  var pairs = str.split('&');
  var parts;
  var pair;

  for (var i = 0, len = pairs.length; i < len; ++i) {
    pair = pairs[i];
    parts = pair.split('=');
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
  }

  return obj;
}

/**
 * Expose parser.
 */

request.parseString = parseString;

/**
 * Default MIME type map.
 *
 *     superagent.types.xml = 'application/xml';
 *
 */

request.types = {
  html: 'text/html',
  json: 'application/json',
  xml: 'application/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  'form': 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

/**
 * Default serialization map.
 *
 *     superagent.serialize['application/xml'] = function(obj){
 *       return 'generated xml here';
 *     };
 *
 */

 request.serialize = {
   'application/x-www-form-urlencoded': serialize,
   'application/json': JSON.stringify
 };

 /**
  * Default parsers.
  *
  *     superagent.parse['application/xml'] = function(str){
  *       return { object parsed from str };
  *     };
  *
  */

request.parse = {
  'application/x-www-form-urlencoded': parseString,
  'application/json': JSON.parse
};

/**
 * Parse the given header `str` into
 * an object containing the mapped fields.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function parseHeader(str) {
  var lines = str.split(/\r?\n/);
  var fields = {};
  var index;
  var line;
  var field;
  var val;

  lines.pop(); // trailing CRLF

  for (var i = 0, len = lines.length; i < len; ++i) {
    line = lines[i];
    index = line.indexOf(':');
    field = line.slice(0, index).toLowerCase();
    val = trim(line.slice(index + 1));
    fields[field] = val;
  }

  return fields;
}

/**
 * Return the mime type for the given `str`.
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

function type(str){
  return str.split(/ *; */).shift();
};

/**
 * Return header field parameters.
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function params(str){
  return reduce(str.split(/ *; */), function(obj, str){
    var parts = str.split(/ *= */)
      , key = parts.shift()
      , val = parts.shift();

    if (key && val) obj[key] = val;
    return obj;
  }, {});
};

/**
 * Initialize a new `Response` with the given `xhr`.
 *
 *  - set flags (.ok, .error, etc)
 *  - parse header
 *
 * Examples:
 *
 *  Aliasing `superagent` as `request` is nice:
 *
 *      request = superagent;
 *
 *  We can use the promise-like API, or pass callbacks:
 *
 *      request.get('/').end(function(res){});
 *      request.get('/', function(res){});
 *
 *  Sending data can be chained:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' })
 *        .end(function(res){});
 *
 *  Or passed to `.send()`:
 *
 *      request
 *        .post('/user')
 *        .send({ name: 'tj' }, function(res){});
 *
 *  Or passed to `.post()`:
 *
 *      request
 *        .post('/user', { name: 'tj' })
 *        .end(function(res){});
 *
 * Or further reduced to a single call for simple cases:
 *
 *      request
 *        .post('/user', { name: 'tj' }, function(res){});
 *
 * @param {XMLHTTPRequest} xhr
 * @param {Object} options
 * @api private
 */

function Response(req, options) {
  options = options || {};
  this.req = req;
  this.xhr = this.req.xhr;
  // responseText is accessible only if responseType is '' or 'text' and on older browsers
  this.text = ((this.req.method !='HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined')
     ? this.xhr.responseText
     : null;
  this.statusText = this.req.xhr.statusText;
  this.setStatusProperties(this.xhr.status);
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
  // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
  // getResponseHeader still works. so we get content-type even if getting
  // other headers fails.
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');
  this.setHeaderProperties(this.header);
  this.body = this.req.method != 'HEAD'
    ? this.parseBody(this.text ? this.text : this.xhr.response)
    : null;
}

/**
 * Get case-insensitive `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api public
 */

Response.prototype.get = function(field){
  return this.header[field.toLowerCase()];
};

/**
 * Set header related properties:
 *
 *   - `.type` the content type without params
 *
 * A response of "Content-Type: text/plain; charset=utf-8"
 * will provide you with a `.type` of "text/plain".
 *
 * @param {Object} header
 * @api private
 */

Response.prototype.setHeaderProperties = function(header){
  // content-type
  var ct = this.header['content-type'] || '';
  this.type = type(ct);

  // params
  var obj = params(ct);
  for (var key in obj) this[key] = obj[key];
};

/**
 * Parse the given body `str`.
 *
 * Used for auto-parsing of bodies. Parsers
 * are defined on the `superagent.parse` object.
 *
 * @param {String} str
 * @return {Mixed}
 * @api private
 */

Response.prototype.parseBody = function(str){
  var parse = request.parse[this.type];
  return parse && str && (str.length || str instanceof Object)
    ? parse(str)
    : null;
};

/**
 * Set flags such as `.ok` based on `status`.
 *
 * For example a 2xx response will give you a `.ok` of __true__
 * whereas 5xx will be __false__ and `.error` will be __true__. The
 * `.clientError` and `.serverError` are also available to be more
 * specific, and `.statusType` is the class of error ranging from 1..5
 * sometimes useful for mapping respond colors etc.
 *
 * "sugar" properties are also defined for common cases. Currently providing:
 *
 *   - .noContent
 *   - .badRequest
 *   - .unauthorized
 *   - .notAcceptable
 *   - .notFound
 *
 * @param {Number} status
 * @api private
 */

Response.prototype.setStatusProperties = function(status){
  // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  var type = status / 100 | 0;

  // status / class
  this.status = this.statusCode = status;
  this.statusType = type;

  // basics
  this.info = 1 == type;
  this.ok = 2 == type;
  this.clientError = 4 == type;
  this.serverError = 5 == type;
  this.error = (4 == type || 5 == type)
    ? this.toError()
    : false;

  // sugar
  this.accepted = 202 == status;
  this.noContent = 204 == status;
  this.badRequest = 400 == status;
  this.unauthorized = 401 == status;
  this.notAcceptable = 406 == status;
  this.notFound = 404 == status;
  this.forbidden = 403 == status;
};

/**
 * Return an `Error` representative of this response.
 *
 * @return {Error}
 * @api public
 */

Response.prototype.toError = function(){
  var req = this.req;
  var method = req.method;
  var url = req.url;

  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
  var err = new Error(msg);
  err.status = this.status;
  err.method = method;
  err.url = url;

  return err;
};

/**
 * Expose `Response`.
 */

request.Response = Response;

/**
 * Initialize a new `Request` with the given `method` and `url`.
 *
 * @param {String} method
 * @param {String} url
 * @api public
 */

function Request(method, url) {
  var self = this;
  Emitter.call(this);
  this._query = this._query || [];
  this.method = method;
  this.url = url;
  this.header = {};
  this._header = {};
  this.on('end', function(){
    var err = null;
    var res = null;

    try {
      res = new Response(self);
    } catch(e) {
      err = new Error('Parser is unable to parse the response');
      err.parse = true;
      err.original = e;
      return self.callback(err);
    }

    self.emit('response', res);

    if (err) {
      return self.callback(err, res);
    }

    if (res.status >= 200 && res.status < 300) {
      return self.callback(err, res);
    }

    var new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
    new_err.original = err;
    new_err.response = res;
    new_err.status = res.status;

    self.callback(new_err, res);
  });
}

/**
 * Mixin `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Allow for extension
 */

Request.prototype.use = function(fn) {
  fn(this);
  return this;
}

/**
 * Set timeout to `ms`.
 *
 * @param {Number} ms
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.timeout = function(ms){
  this._timeout = ms;
  return this;
};

/**
 * Clear previous timeout.
 *
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.clearTimeout = function(){
  this._timeout = 0;
  clearTimeout(this._timer);
  return this;
};

/**
 * Abort the request, and clear potential timeout.
 *
 * @return {Request}
 * @api public
 */

Request.prototype.abort = function(){
  if (this.aborted) return;
  this.aborted = true;
  this.xhr.abort();
  this.clearTimeout();
  this.emit('abort');
  return this;
};

/**
 * Set header `field` to `val`, or multiple fields with one object.
 *
 * Examples:
 *
 *      req.get('/')
 *        .set('Accept', 'application/json')
 *        .set('X-API-Key', 'foobar')
 *        .end(callback);
 *
 *      req.get('/')
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
 *        .end(callback);
 *
 * @param {String|Object} field
 * @param {String} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.set = function(field, val){
  if (isObject(field)) {
    for (var key in field) {
      this.set(key, field[key]);
    }
    return this;
  }
  this._header[field.toLowerCase()] = val;
  this.header[field] = val;
  return this;
};

/**
 * Remove header `field`.
 *
 * Example:
 *
 *      req.get('/')
 *        .unset('User-Agent')
 *        .end(callback);
 *
 * @param {String} field
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.unset = function(field){
  delete this._header[field.toLowerCase()];
  delete this.header[field];
  return this;
};

/**
 * Get case-insensitive header `field` value.
 *
 * @param {String} field
 * @return {String}
 * @api private
 */

Request.prototype.getHeader = function(field){
  return this._header[field.toLowerCase()];
};

/**
 * Set Content-Type to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.xml = 'application/xml';
 *
 *      request.post('/')
 *        .type('xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 *      request.post('/')
 *        .type('application/xml')
 *        .send(xmlstring)
 *        .end(callback);
 *
 * @param {String} type
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.type = function(type){
  this.set('Content-Type', request.types[type] || type);
  return this;
};

/**
 * Force given parser
 *
 * Sets the body parser no matter type.
 *
 * @param {Function}
 * @api public
 */

Request.prototype.parse = function(fn){
  this._parser = fn;
  return this;
};

/**
 * Set Accept to `type`, mapping values from `request.types`.
 *
 * Examples:
 *
 *      superagent.types.json = 'application/json';
 *
 *      request.get('/agent')
 *        .accept('json')
 *        .end(callback);
 *
 *      request.get('/agent')
 *        .accept('application/json')
 *        .end(callback);
 *
 * @param {String} accept
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.accept = function(type){
  this.set('Accept', request.types[type] || type);
  return this;
};

/**
 * Set Authorization field value with `user` and `pass`.
 *
 * @param {String} user
 * @param {String} pass
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.auth = function(user, pass){
  var str = btoa(user + ':' + pass);
  this.set('Authorization', 'Basic ' + str);
  return this;
};

/**
* Add query-string `val`.
*
* Examples:
*
*   request.get('/shoes')
*     .query('size=10')
*     .query({ color: 'blue' })
*
* @param {Object|String} val
* @return {Request} for chaining
* @api public
*/

Request.prototype.query = function(val){
  if ('string' != typeof val) val = serialize(val);
  if (val) this._query.push(val);
  return this;
};

/**
 * Write the field `name` and `val` for "multipart/form-data"
 * request bodies.
 *
 * ``` js
 * request.post('/upload')
 *   .field('foo', 'bar')
 *   .end(callback);
 * ```
 *
 * @param {String} name
 * @param {String|Blob|File} val
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.field = function(name, val){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(name, val);
  return this;
};

/**
 * Queue the given `file` as an attachment to the specified `field`,
 * with optional `filename`.
 *
 * ``` js
 * request.post('/upload')
 *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
 *   .end(callback);
 * ```
 *
 * @param {String} field
 * @param {Blob|File} file
 * @param {String} filename
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.attach = function(field, file, filename){
  if (!this._formData) this._formData = new root.FormData();
  this._formData.append(field, file, filename);
  return this;
};

/**
 * Send `data`, defaulting the `.type()` to "json" when
 * an object is given.
 *
 * Examples:
 *
 *       // querystring
 *       request.get('/search')
 *         .end(callback)
 *
 *       // multiple data "writes"
 *       request.get('/search')
 *         .send({ search: 'query' })
 *         .send({ range: '1..5' })
 *         .send({ order: 'desc' })
 *         .end(callback)
 *
 *       // manual json
 *       request.post('/user')
 *         .type('json')
 *         .send('{"name":"tj"}')
 *         .end(callback)
 *
 *       // auto json
 *       request.post('/user')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // manual x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send('name=tj')
 *         .end(callback)
 *
 *       // auto x-www-form-urlencoded
 *       request.post('/user')
 *         .type('form')
 *         .send({ name: 'tj' })
 *         .end(callback)
 *
 *       // defaults to x-www-form-urlencoded
  *      request.post('/user')
  *        .send('name=tobi')
  *        .send('species=ferret')
  *        .end(callback)
 *
 * @param {String|Object} data
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.send = function(data){
  var obj = isObject(data);
  var type = this.getHeader('Content-Type');

  // merge
  if (obj && isObject(this._data)) {
    for (var key in data) {
      this._data[key] = data[key];
    }
  } else if ('string' == typeof data) {
    if (!type) this.type('form');
    type = this.getHeader('Content-Type');
    if ('application/x-www-form-urlencoded' == type) {
      this._data = this._data
        ? this._data + '&' + data
        : data;
    } else {
      this._data = (this._data || '') + data;
    }
  } else {
    this._data = data;
  }

  if (!obj || isHost(data)) return this;
  if (!type) this.type('json');
  return this;
};

/**
 * Invoke the callback with `err` and `res`
 * and handle arity check.
 *
 * @param {Error} err
 * @param {Response} res
 * @api private
 */

Request.prototype.callback = function(err, res){
  var fn = this._callback;
  this.clearTimeout();
  fn(err, res);
};

/**
 * Invoke callback with x-domain error.
 *
 * @api private
 */

Request.prototype.crossDomainError = function(){
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
  err.crossDomain = true;
  this.callback(err);
};

/**
 * Invoke callback with timeout error.
 *
 * @api private
 */

Request.prototype.timeoutError = function(){
  var timeout = this._timeout;
  var err = new Error('timeout of ' + timeout + 'ms exceeded');
  err.timeout = timeout;
  this.callback(err);
};

/**
 * Enable transmission of cookies with x-domain requests.
 *
 * Note that for this to work the origin must not be
 * using "Access-Control-Allow-Origin" with a wildcard,
 * and also must set "Access-Control-Allow-Credentials"
 * to "true".
 *
 * @api public
 */

Request.prototype.withCredentials = function(){
  this._withCredentials = true;
  return this;
};

/**
 * Initiate request, invoking callback `fn(res)`
 * with an instanceof `Response`.
 *
 * @param {Function} fn
 * @return {Request} for chaining
 * @api public
 */

Request.prototype.end = function(fn){
  var self = this;
  var xhr = this.xhr = request.getXHR();
  var query = this._query.join('&');
  var timeout = this._timeout;
  var data = this._formData || this._data;

  // store callback
  this._callback = fn || noop;

  // state change
  xhr.onreadystatechange = function(){
    if (4 != xhr.readyState) return;

    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
    // result in the error "Could not complete the operation due to error c00c023f"
    var status;
    try { status = xhr.status } catch(e) { status = 0; }

    if (0 == status) {
      if (self.timedout) return self.timeoutError();
      if (self.aborted) return;
      return self.crossDomainError();
    }
    self.emit('end');
  };

  // progress
  var handleProgress = function(e){
    if (e.total > 0) {
      e.percent = e.loaded / e.total * 100;
    }
    self.emit('progress', e);
  };
  if (this.hasListeners('progress')) {
    xhr.onprogress = handleProgress;
  }
  try {
    if (xhr.upload && this.hasListeners('progress')) {
      xhr.upload.onprogress = handleProgress;
    }
  } catch(e) {
    // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
    // Reported here:
    // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
  }

  // timeout
  if (timeout && !this._timer) {
    this._timer = setTimeout(function(){
      self.timedout = true;
      self.abort();
    }, timeout);
  }

  // querystring
  if (query) {
    query = request.serializeObject(query);
    this.url += ~this.url.indexOf('?')
      ? '&' + query
      : '?' + query;
  }

  // initiate request
  xhr.open(this.method, this.url, true);

  // CORS
  if (this._withCredentials) xhr.withCredentials = true;

  // body
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
    // serialize stuff
    var contentType = this.getHeader('Content-Type');
    var serialize = this._parser || request.serialize[contentType ? contentType.split(';')[0] : ''];
    if (serialize) data = serialize(data);
  }

  // set header fields
  for (var field in this.header) {
    if (null == this.header[field]) continue;
    xhr.setRequestHeader(field, this.header[field]);
  }

  // send stuff
  this.emit('request', this);

  // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
  // We need null here if data is undefined
  xhr.send(typeof data !== 'undefined' ? data : null);
  return this;
};

/**
 * Faux promise support
 *
 * @param {Function} fulfill
 * @param {Function} reject
 * @return {Request}
 */

Request.prototype.then = function (fulfill, reject) {
  return this.end(function(err, res) {
    err ? reject(err) : fulfill(res);
  });
}

/**
 * Expose `Request`.
 */

request.Request = Request;

/**
 * Issue a request:
 *
 * Examples:
 *
 *    request('GET', '/users').end(callback)
 *    request('/users').end(callback)
 *    request('/users', callback)
 *
 * @param {String} method
 * @param {String|Function} url or callback
 * @return {Request}
 * @api public
 */

function request(method, url) {
  // callback
  if ('function' == typeof url) {
    return new Request('GET', method).end(url);
  }

  // url first
  if (1 == arguments.length) {
    return new Request('GET', method);
  }

  return new Request(method, url);
}

/**
 * GET `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.get = function(url, data, fn){
  var req = request('GET', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.query(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * HEAD `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.head = function(url, data, fn){
  var req = request('HEAD', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * DELETE `url` with optional callback `fn(res)`.
 *
 * @param {String} url
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

function del(url, fn){
  var req = request('DELETE', url);
  if (fn) req.end(fn);
  return req;
};

request.del = del;
request.delete = del;

/**
 * PATCH `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.patch = function(url, data, fn){
  var req = request('PATCH', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * POST `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed} data
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.post = function(url, data, fn){
  var req = request('POST', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * PUT `url` with optional `data` and callback `fn(res)`.
 *
 * @param {String} url
 * @param {Mixed|Function} data or fn
 * @param {Function} fn
 * @return {Request}
 * @api public
 */

request.put = function(url, data, fn){
  var req = request('PUT', url);
  if ('function' == typeof data) fn = data, data = null;
  if (data) req.send(data);
  if (fn) req.end(fn);
  return req;
};

/**
 * Expose `request`.
 */

module.exports = request;

},{"emitter":2,"reduce":3}],2:[function(require,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],3:[function(require,module,exports){

/**
 * Reduce `arr` with `fn`.
 *
 * @param {Array} arr
 * @param {Function} fn
 * @param {Mixed} initial
 *
 * TODO: combatible error handling?
 */

module.exports = function(arr, fn, initial){  
  var idx = 0;
  var len = arr.length;
  var curr = arguments.length == 3
    ? initial
    : arr[idx++];

  while (idx < len) {
    curr = fn.call(null, curr, arr[idx], ++idx, arr);
  }
  
  return curr;
};
},{}],4:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.tus = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fingerprint;
/**
 * Generate a fingerprint for a file which will be used the store the endpoint
 *
 * @param {File} file
 * @return {String}
 */
function fingerprint(file) {
  return ["tus", file.name, file.type, file.size, file.lastModified].join("-");
}

},{}],2:[function(_dereq_,module,exports){
"use strict";

var _upload = _dereq_("./upload");

var _upload2 = _interopRequireDefault(_upload);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = _upload2.default.defaultOptions; /* global window */

var _window = window;
var XMLHttpRequest = _window.XMLHttpRequest;
var localStorage = _window.localStorage;
var Blob = _window.Blob;

var isSupported = XMLHttpRequest && localStorage && Blob && typeof Blob.prototype.slice === "function";

module.exports = {
  Upload: _upload2.default,
  isSupported: isSupported,
  defaultOptions: defaultOptions
};

},{"./upload":3}],3:[function(_dereq_,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /* global window, XMLHttpRequest */

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fingerprint = _dereq_("./fingerprint");

var _fingerprint2 = _interopRequireDefault(_fingerprint);

var _extend = _dereq_("extend");

var _extend2 = _interopRequireDefault(_extend);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _window = window;
var localStorage = _window.localStorage;
var btoa = _window.btoa;

var defaultOptions = {
  endpoint: "",
  fingerprint: _fingerprint2.default,
  resume: true,
  onProgress: null,
  onChunkComplete: null,
  onSuccess: null,
  onError: null,
  headers: {},
  chunkSize: Infinity,
  withCredentials: false
};

var Upload = (function () {
  function Upload(file, options) {
    _classCallCheck(this, Upload);

    this.options = (0, _extend2.default)(true, {}, defaultOptions, options);

    // The underlying File/Blob object
    this.file = file;

    // The URL against which the file will be uploaded
    this.url = null;

    // The underlying XHR object for the current PATCH request
    this._xhr = null;

    // The fingerpinrt for the current file (set after start())
    this._fingerprint = null;

    // The offset used in the current PATCH request
    this._offset = null;

    // True if the current PATCH request has been aborted
    this._aborted = false;
  }

  _createClass(Upload, [{
    key: "start",
    value: function start() {
      var file = this.file;

      if (!file) {
        this._emitError(new Error("tus: no file to upload provided"));
        return;
      }

      if (!this.options.endpoint) {
        this._emitError(new Error("tus: no endpoint provided"));
        return;
      }

      // A URL has manually been specified, so we try to resume
      if (this.url !== null) {
        this._resumeUpload();
        return;
      }

      // Try to find the endpoint for the file in the localStorage
      if (this.options.resume) {
        this._fingerprint = this.options.fingerprint(file);
        var resumedUrl = localStorage.getItem(this._fingerprint);

        if (resumedUrl != null) {
          this.url = resumedUrl;
          this._resumeUpload();
          return;
        }
      }

      // An upload has not started for the file yet, so we start a new one
      this._createUpload();
    }
  }, {
    key: "abort",
    value: function abort() {
      if (this._xhr !== null) {
        this._xhr.abort();
        this._aborted = true;
      }
    }
  }, {
    key: "_emitXhrError",
    value: function _emitXhrError(xhr, err) {
      err.originalRequest = xhr;
      this._emitError(err);
    }
  }, {
    key: "_emitError",
    value: function _emitError(err) {
      if (typeof this.options.onError === "function") {
        this.options.onError(err);
      } else {
        throw err;
      }
    }
  }, {
    key: "_emitSuccess",
    value: function _emitSuccess() {
      if (typeof this.options.onSuccess === "function") {
        this.options.onSuccess();
      }
    }

    /**
     * Publishes notification when data has been sent to the server. This
     * data may not have been accepted by the server yet.
     * @param  {number} bytesSent  Number of bytes sent to the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitProgress",
    value: function _emitProgress(bytesSent, bytesTotal) {
      if (typeof this.options.onProgress === "function") {
        this.options.onProgress(bytesSent, bytesTotal);
      }
    }

    /**
     * Publishes notification when a chunk of data has been sent to the server
     * and accepted by the server.
     * @param  {number} chunkSize  Size of the chunk that was accepted by the
     *                             server.
     * @param  {number} bytesAccepted Total number of bytes that have been
     *                                accepted by the server.
     * @param  {number} bytesTotal Total number of bytes to be sent to the server.
     */

  }, {
    key: "_emitChunkComplete",
    value: function _emitChunkComplete(chunkSize, bytesAccepted, bytesTotal) {
      if (typeof this.options.onChunkComplete === "function") {
        this.options.onChunkComplete(chunkSize, bytesAccepted, bytesTotal);
      }
    }

    /**
     * Set the headers used in the request and the withCredentials property
     * as defined in the options
     *
     * @param {XMLHttpRequest} xhr
     */

  }, {
    key: "_setupXHR",
    value: function _setupXHR(xhr) {
      xhr.setRequestHeader("Tus-Resumable", "1.0.0");
      var headers = this.options.headers;

      for (var name in headers) {
        xhr.setRequestHeader(name, headers[name]);
      }

      xhr.withCredentials = this.options.withCredentials;
    }

    /**
     * Create a new upload using the creation extension by sending a POST
     * request to the endpoint. After successful creation the file will be
     * uploaded
     *
     * @api private
     */

  }, {
    key: "_createUpload",
    value: function _createUpload() {
      var _this = this;

      var xhr = new XMLHttpRequest();
      xhr.open("POST", this.options.endpoint, true);

      xhr.onload = function () {
        if (!(xhr.status >= 200 && xhr.status < 300)) {
          _this._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"));
          return;
        }

        _this.url = xhr.getResponseHeader("Location");

        if (_this.options.resume) {
          localStorage.setItem(_this._fingerprint, _this.url);
        }

        _this._offset = 0;
        _this._startUpload();
      };

      xhr.onerror = function () {
        _this._emitXhrError(xhr, new Error("tus: failed to create upload"));
      };

      this._setupXHR(xhr);
      xhr.setRequestHeader("Upload-Length", this.file.size);

      // Add metadata if values have been added
      var metadata = encodeMetadata(this.options.metadata);
      if (metadata !== "") {
        xhr.setRequestHeader("Upload-Metadata", metadata);
      }

      xhr.send(null);
    }

    /*
     * Try to resume an existing upload. First a HEAD request will be sent
     * to retrieve the offset. If the request fails a new upload will be
     * created. In the case of a successful response the file will be uploaded.
     *
     * @api private
     */

  }, {
    key: "_resumeUpload",
    value: function _resumeUpload() {
      var _this2 = this;

      var xhr = new XMLHttpRequest();
      xhr.open("HEAD", this.url, true);

      xhr.onload = function () {
        if (!(xhr.status >= 200 && xhr.status < 300)) {
          if (_this2.options.resume) {
            // Remove stored fingerprint and corresponding endpoint,
            // since the file can not be found
            localStorage.removeItem(_this2._fingerprint);
          }

          // Try to create a new upload
          _this2.url = null;
          _this2._createUpload();
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this2._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        _this2._offset = offset;
        _this2._startUpload();
      };

      xhr.onerror = function () {
        _this2._emitXhrError(xhr, new Error("tus: failed to resume upload"));
      };

      this._setupXHR(xhr);
      xhr.send(null);
    }

    /**
     * Start uploading the file using PATCH requests. The file while be divided
     * into chunks as specified in the chunkSize option. During the upload
     * the onProgress event handler may be invoked multiple times.
     *
     * @api private
     */

  }, {
    key: "_startUpload",
    value: function _startUpload() {
      var _this3 = this;

      var xhr = this._xhr = new XMLHttpRequest();
      xhr.open("PATCH", this.url, true);

      xhr.onload = function () {
        if (!(xhr.status >= 200 && xhr.status < 300)) {
          _this3._emitXhrError(xhr, new Error("tus: unexpected response while creating upload"));
          return;
        }

        var offset = parseInt(xhr.getResponseHeader("Upload-Offset"), 10);
        if (isNaN(offset)) {
          _this3._emitXhrError(xhr, new Error("tus: invalid or missing offset value"));
          return;
        }

        _this3._emitChunkComplete(offset - _this3._offset, offset, _this3.file.size);

        _this3._offset = offset;

        if (offset == _this3.file.size) {
          // Yay, finally done :)
          // Emit a last progress event
          _this3._emitProgress(offset, offset);
          _this3._emitSuccess();
          return;
        }

        _this3._startUpload();
      };

      xhr.onerror = function () {
        // Don't emit an error if the upload was aborted manually
        if (_this3._aborted) {
          return;
        }

        _this3._emitXhrError(xhr, new Error("tus: failed to upload chunk at offset " + _this3._offset));
      };

      // Test support for progress events before attaching an event listener
      if ("upload" in xhr) {
        xhr.upload.onprogress = function (e) {
          if (!e.lengthComputable) {
            return;
          }

          _this3._emitProgress(start + e.loaded, _this3.file.size);
        };
      }

      this._setupXHR(xhr);

      xhr.setRequestHeader("Upload-Offset", this._offset);
      xhr.setRequestHeader("Content-Type", "application/offset+octet-stream");

      var start = this._offset;
      var end = this._offset + this.options.chunkSize;

      if (end === Infinity) {
        end = this.file.size;
      }

      xhr.send(this.file.slice(start, end));
    }
  }]);

  return Upload;
})();

function encodeMetadata(metadata) {
  if (!("btoa" in window)) {
    return "";
  }

  var encoded = [];

  for (var key in metadata) {
    encoded.push(key + " " + btoa(unescape(encodeURIComponent(metadata[key]))));
  }

  return encoded.join(",");
}

Upload.defaultOptions = defaultOptions;

exports.default = Upload;

},{"./fingerprint":1,"extend":4}],4:[function(_dereq_,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _coreUtils = require('../core/Utils');

var _coreUtils2 = _interopRequireDefault(_coreUtils);

/**
* Main Uppy core
*
*/

var Core = (function () {
  function Core(opts) {
    _classCallCheck(this, Core);

    // set default options
    var defaultOptions = {
      // locale: 'en_US'
    };

    // Merge default options with the ones set by user
    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    // Dictates in what order different plugin types are ran:
    this.types = ['presetter', 'selecter', 'uploader'];

    this.type = 'core';

    // Container for different types of plugins
    this.plugins = {};
  }

  /**
  * Registers a plugin with Core
  *
  * @param {Plugin} Plugin object
  * @param {opts} options object that will be passed to Plugin later
  * @returns {object} self for chaining
  */

  _createClass(Core, [{
    key: 'use',
    value: function use(Plugin, opts) {
      // Instantiate
      var plugin = new Plugin(this, opts);
      this.plugins[plugin.type] = this.plugins[plugin.type] || [];
      this.plugins[plugin.type].push(plugin);

      return this;
    }

    /**
    * Translate a string into the selected language (this.locale).
    * Return the original string if locale is undefined
    *
    * @param {string} string that needs translating
    * @returns {string} translated string
    */
  }, {
    key: 'translate',
    value: function translate(string) {
      var dictionary = this.opts.locale;

      // if locale is unspecified, return the original string
      if (!dictionary) {
        return string;
      }

      var translatedString = dictionary[string];
      return translatedString;
    }

    /**
    * Sets plugin’s progress, for uploads for example
    *
    * @param {plugin} plugin that want to set progress
    * @param {percentage} integer
    * @returns {object} self for chaining
    */
  }, {
    key: 'setProgress',
    value: function setProgress(plugin, percentage) {
      // Any plugin can call this via `this.core.setProgress(this, precentage)`
      console.log(plugin.type + ' plugin ' + plugin.name + ' set the progress to ' + percentage);
      return this;
    }

    /**
    * Runs all plugins of the same type in parallel
    */
  }, {
    key: 'runType',
    value: function runType(type, files) {
      var methods = this.plugins[type].map(function (plugin) {
        return plugin.run.call(plugin, files);
      });

      return Promise.all(methods);
    }

    /**
    * Runs a waterfall of runType plugin packs, like so:
    * All preseters(data) --> All selecters(data) --> All uploaders(data) --> done
    */
  }, {
    key: 'run',
    value: function run() {
      var _this = this;

      console.log({
        'class': 'Core',
        method: 'run'
      });

      console.log('translation is all like: ' + this.translate('Choose a file'));

      // First we select only plugins of current type,
      // then create an array of runType methods of this plugins
      var typeMethods = this.types.filter(function (type) {
        return _this.plugins[type];
      }).map(function (type) {
        return _this.runType.bind(_this, type);
      });

      _coreUtils2['default'].promiseWaterfall(typeMethods).then(function (result) {
        return console.log(result);
      })['catch'](function (error) {
        return console.error(error);
      });
    }
  }]);

  return Core;
})();

exports['default'] = Core;
module.exports = exports['default'];

},{"../core/Utils":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

function promiseWaterfall(_ref) {
  var _ref2 = _toArray(_ref);

  var resolvedPromise = _ref2[0];

  var tasks = _ref2.slice(1);

  var finalTaskPromise = tasks.reduce(function (prevTaskPromise, task) {
    return prevTaskPromise.then(task);
  }, resolvedPromise(1)); // initial value

  return finalTaskPromise;
}

// This is how we roll $('.element').toggleClass in non-jQuery world
function toggleClass(el, className) {
  if (el.classList) {
    el.classList.toggle(className);
  } else {
    var classes = el.className.split(' ');
    var existingIndex = classes.indexOf(className);

    if (existingIndex >= 0) {
      classes.splice(existingIndex, 1);
    } else {
      classes.push(className);
      el.className = classes.join(' ');
    }
  }
}

function addClass(el, className) {
  if (el.classList) {
    el.classList.add(className);
  } else {
    el.className += ' ' + className;
  }
}

function removeClass(el, className) {
  if (el.classList) {
    el.classList.remove(className);
  } else {
    el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
  }
}

// $form.on('drag dragstart dragend dragover dragenter dragleave drop');
function addListenerMulti(el, events, func) {
  var eventsArray = events.split(' ');
  for (var _event in eventsArray) {
    el.addEventListener(eventsArray[_event], func, false);
  }
}

exports['default'] = {
  promiseWaterfall: promiseWaterfall,
  toggleClass: toggleClass,
  addClass: addClass,
  removeClass: removeClass,
  addListenerMulti: addListenerMulti
};
module.exports = exports['default'];

},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Core = require('./Core');

var _Core2 = _interopRequireDefault(_Core);

exports['default'] = _Core2['default'];
module.exports = exports['default'];

},{"./Core":5}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _core = require('./core');

var _core2 = _interopRequireDefault(_core);

var _plugins = require('./plugins');

var _plugins2 = _interopRequireDefault(_plugins);

var locale = {};

exports['default'] = {
  Core: _core2['default'],
  plugins: _plugins2['default'],
  locale: locale
};
module.exports = exports['default'];

},{"./core":7,"./plugins":16}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreUtils = require('../core/Utils');

var _coreUtils2 = _interopRequireDefault(_coreUtils);

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

/**
* Drag & Drop plugin
*
*/

var DragDrop = (function (_Plugin) {
  _inherits(DragDrop, _Plugin);

  function DragDrop(core, opts) {
    _classCallCheck(this, DragDrop);

    _get(Object.getPrototypeOf(DragDrop.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'selecter';

    // set default options
    var defaultOptions = {
      bla: 'blabla',
      autoSubmit: true,
      modal: true
    };

    // merge default options with the ones set by user
    this.opts = defaultOptions;
    Object.assign(this.opts, opts);

    // get the element where Drag & Drop event will occur
    this.dropzone = document.querySelector(this.opts.selector);
    this.dropzoneInput = document.querySelector('.UppyDragDrop-input');

    this.status = document.querySelectorAll('.UppyDragDrop-status')[0];

    this.isDragDropSupported = this.checkDragDropSupport();

    // crazy stuff so that ‘this’ will behave in class
    this.listenForEvents = this.listenForEvents.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.checkDragDropSupport = this.checkDragDropSupport.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  /**
  * Checks if the browser supports Drag & Drop
  * @returns {object} true if Drag & Drop is supported, false otherwise
  */

  _createClass(DragDrop, [{
    key: 'checkDragDropSupport',
    value: function checkDragDropSupport() {
      var div = document.createElement('div');

      if (!('draggable' in div) || !('ondragstart' in div && 'ondrop' in div)) {
        return false;
      }

      if (!('FormData' in window)) {
        return false;
      }

      if (!('FileReader' in window)) {
        return false;
      }

      return true;
    }
  }, {
    key: 'listenForEvents',
    value: function listenForEvents() {
      var _this = this;

      console.log('waiting for some files to be dropped on ' + this.opts.selector);

      if (this.isDragDropSupported) {
        _coreUtils2['default'].addClass(this.dropzone, 'is-dragdrop-supported');
      }

      // prevent default actions for all drag & drop events
      _coreUtils2['default'].addListenerMulti(this.dropzone, 'drag dragstart dragend dragover dragenter dragleave drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });

      // Toggle is-dragover state when files are dragged over or dropped
      _coreUtils2['default'].addListenerMulti(this.dropzone, 'dragover dragenter', function (e) {
        _coreUtils2['default'].addClass(_this.dropzone, 'is-dragover');
      });

      _coreUtils2['default'].addListenerMulti(this.dropzone, 'dragleave dragend drop', function (e) {
        _coreUtils2['default'].removeClass(_this.dropzone, 'is-dragover');
      });

      var onDrop = new Promise(function (resolve, reject) {
        _this.dropzone.addEventListener('drop', function (e) {
          resolve(_this.handleDrop.bind(null, e));
        });
      });

      var onInput = new Promise(function (resolve, reject) {
        _this.dropzoneInput.addEventListener('change', function (e) {
          resolve(_this.handleInputChange.bind(null, e));
        });
      });

      return Promise.race([onDrop, onInput]).then(function (handler) {
        return handler();
      });

      // this.dropzone.addEventListener('drop', this.handleDrop);
      // this.dropzoneInput.addEventListener('change', this.handleInputChange);
    }
  }, {
    key: 'displayStatus',
    value: function displayStatus(status) {
      this.status.innerHTML = status;
    }
  }, {
    key: 'handleDrop',
    value: function handleDrop(e) {
      console.log('all right, someone dropped something here...');
      var files = e.dataTransfer.files;
      console.log(files);

      // const formData = new FormData(this.dropzone);
      // console.log('pizza', formData);

      // for (var i = 0; i < files.length; i++) {
      //   formData.append('file', files[i]);
      //   console.log('pizza', files[i]);
      // }

      return Promise.resolve({ from: 'DragDrop', files: files });
    }
  }, {
    key: 'handleInputChange',
    value: function handleInputChange() {
      // const fileInput = document.querySelectorAll('.UppyDragDrop-input')[0];
      var formData = new FormData(this.dropzone);

      console.log('@todo: No support for formData yet', formData);
      var files = [];

      return Promise.resolve(files);
    }
  }, {
    key: 'run',
    value: function run(results) {
      console.log({
        'class': 'DragDrop',
        method: 'run',
        results: results
      });

      return this.listenForEvents();
    }
  }]);

  return DragDrop;
})(_Plugin3['default']);

exports['default'] = DragDrop;
module.exports = exports['default'];

},{"../core/Utils":6,"./Plugin":13}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _coreUtils = require('../core/Utils');

var _coreUtils2 = _interopRequireDefault(_coreUtils);

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var Dropbox = (function (_Plugin) {
  _inherits(Dropbox, _Plugin);

  function Dropbox(core, opts) {
    _classCallCheck(this, Dropbox);

    _get(Object.getPrototypeOf(Dropbox.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'selecter';
    this.authenticate = this.authenticate.bind(this);
    this.connect = this.connect.bind(this);
    this.render = this.render.bind(this);
    this.files = [];
    this.currentDir = '/';
  }

  _createClass(Dropbox, [{
    key: 'connect',
    value: function connect(target) {
      this._target = document.getElementById(target);

      this.client = new Dropbox.Client({ key: 'b7dzc9ei5dv5hcv', token: '' });
      this.client.authDriver(new Dropbox.AuthDriver.Redirect());
      this.authenticate();

      if (this.client.credentials().token) {
        this.getDirectory();
      }
    }
  }, {
    key: 'authenticate',
    value: function authenticate() {
      this.client.authenticate();
    }
  }, {
    key: 'addFile',
    value: function addFile() {}
  }, {
    key: 'getDirectory',
    value: function getDirectory() {
      var _this = this;

      _superagent2['default'].get('https://api18.dropbox.com/1/metadata/auto').query({
        client_id: 'b7dzc9ei5dv5hcv',
        token: this.client.credentials().token
      }).set('Content-Type', 'application/json').end(function (err, res) {
        console.log(res);
      });

      return this.client.readdir(this.currentDir, function (error, entries, stat, statFiles) {
        if (error) {
          return showError(error); // Something went wrong.
        }
        return _this.render(statFiles);
      });
    }
  }, {
    key: 'run',
    value: function run(results) {}
  }, {
    key: 'render',
    value: function render(files) {
      var _this2 = this;

      // for each file in the directory, create a list item element
      var elems = files.map(function (file, i) {
        var icon = file.isFolder ? 'folder' : 'file';
        return '<li data-type="' + icon + '" data-name="' + file.name + '"><span>' + icon + ' : </span><span> ' + file.name + '</span></li>';
      });

      // appends the list items to the target
      this._target.innerHTML = elems.sort().join('');

      if (this.currentDir.length > 1) {
        var _parent = document.createElement('LI');
        _parent.setAttribute('data-type', 'parent');
        _parent.innerHTML = '<span>...</span>';
        this._target.appendChild(_parent);
      }

      // add an onClick to each list item
      var fileElems = this._target.querySelectorAll('li');

      Array.prototype.forEach.call(fileElems, function (element) {
        var type = element.getAttribute('data-type');

        if (type === 'file') {
          element.addEventListener('click', function () {
            _this2.files.push(element.getAttribute('data-name'));
            console.log('files: ' + _this2.files);
          });
        } else {
          element.addEventListener('dblclick', function () {
            var length = _this2.currentDir.split('/').length;

            if (type === 'folder') {
              _this2.currentDir = '' + _this2.currentDir + element.getAttribute('data-name') + '/';
            } else if (type === 'parent') {
              _this2.currentDir = _this2.currentDir.split('/').slice(0, length - 2).join('/') + '/';
            }
            console.log(_this2.currentDir);
            _this2.getDirectory();
          });
        }
      });
    }
  }]);

  return Dropbox;
})(_Plugin3['default']);

exports['default'] = Dropbox;
module.exports = exports['default'];

},{"../core/Utils":6,"./Plugin":13,"superagent":1}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

var Formtag = (function (_Plugin) {
  _inherits(Formtag, _Plugin);

  function Formtag(core, opts) {
    _classCallCheck(this, Formtag);

    _get(Object.getPrototypeOf(Formtag.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'selecter';
  }

  _createClass(Formtag, [{
    key: 'run',
    value: function run(results) {
      console.log({
        'class': 'Formtag',
        method: 'run',
        results: results
      });

      this.setProgress(0);

      var button = document.querySelector(this.opts.doneButtonSelector);
      var self = this;

      return new Promise(function (resolve, reject) {
        button.addEventListener('click', function (e) {
          var fields = document.querySelectorAll(self.opts.selector);
          var files = [];
          var selected = [];

          [].forEach.call(fields, function (field, i) {
            [].forEach.call(field.files, function (file, j) {
              selected.push({
                from: 'Formtag',
                file: file
              });
            });
          });

          // console.log(fields.length);
          // for (var i in fields) {
          //   console.log('i');
          //   // console.log('i: ', i);
          //   for (var j in fields[i].files) {
          //     console.log('j');
          //     // console.log('i, j', i, j);
          //     console.log(fields[i].files);
          //     var file = fields[i].files.item(j);
          //     if (file) {
          //       selected.push({
          //         from: 'Formtag',
          //         file: fields[i].files.item(j)
          //       });
          //     }
          //   }
          // }
          self.setProgress(100);
          console.log({
            selected: selected,
            fields: fields
          });
          resolve(selected);
        });
      });
    }
  }]);

  return Formtag;
})(_Plugin3['default']);

exports['default'] = Formtag;
module.exports = exports['default'];

},{"./Plugin":13}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

var Multipart = (function (_Plugin) {
  _inherits(Multipart, _Plugin);

  function Multipart(core, opts) {
    _classCallCheck(this, Multipart);

    _get(Object.getPrototypeOf(Multipart.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'uploader';
    if (!this.opts.fieldName === undefined) {
      this.opts.fieldName = 'files[]';
    }
    if (this.opts.bundle === undefined) {
      this.opts.bundle = true;
    }
  }

  _createClass(Multipart, [{
    key: 'run',
    value: function run(results) {
      console.log({
        'class': 'Multipart',
        method: 'run',
        results: results
      });

      var files = this.extractFiles(results);

      this.setProgress(0);
      var uploaders = [];

      if (this.opts.bundle) {
        uploaders.push(this.upload(files, 0, files.length));
      } else {
        for (var i in files) {
          uploaders.push(this.upload(files, i, files.length));
        }
      }

      return Promise.all(uploaders);
    }
  }, {
    key: 'upload',
    value: function upload(files, current, total) {
      var _this = this;

      var formPost = new FormData();

      // turn file into an array so we can use bundle
      if (!this.opts.bundle) {
        files = [files[current]];
      }

      for (var i in files) {
        formPost.append(this.opts.fieldName, files[i]);
      }

      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.opts.endpoint, true);

      xhr.addEventListener('progress', function (e) {
        var percentage = (e.loaded / e.total * 100).toFixed(2);
        _this.setProgress(percentage, current, total);
      });

      xhr.addEventListener('load', function () {
        var upload = {};
        if (_this.opts.bundle) {
          upload = { files: files };
        } else {
          upload = { file: files[current] };
        }
        return Promise.resolve(upload);
      });

      xhr.addEventListener('error', function () {
        return Promise.reject('fucking error!');
      });

      xhr.send(formPost);
    }
  }]);

  return Multipart;
})(_Plugin3['default']);

exports['default'] = Multipart;
module.exports = exports['default'];

},{"./Plugin":13}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Plugin = (function () {
  // This contains boilerplate that all Plugins share - and should not be used
  // directly. It also shows which methods final plugins should implement/override,
  // this deciding on structure.

  function Plugin(core, opts) {
    _classCallCheck(this, Plugin);

    this.core = core;
    this.opts = opts;
    this.type = 'none';
    this.name = this.constructor.name;
  }

  _createClass(Plugin, [{
    key: 'setProgress',
    value: function setProgress(percentage, current, total) {
      var finalPercentage = percentage;

      if (current !== undefined && total !== undefined) {
        var percentageOfTotal = percentage / total;
        finalPercentage = percentageOfTotal;
        if (current > 0) {
          finalPercentage = percentage + 100 / total * current;
        } else {
          finalPercentage = current * percentage;
        }
      }

      this.core.setProgress(this, finalPercentage);
    }
  }, {
    key: 'extractFiles',
    value: function extractFiles(results) {
      console.log({
        'class': 'Plugin',
        method: 'extractFiles',
        results: results
      });

      var files = [];
      for (var i in results) {
        for (var j in results[i].files) {
          files.push(results[i].files.item(j));
        }
      }

      return files;
    }
  }, {
    key: 'run',
    value: function run(results) {
      return results;
    }
  }]);

  return Plugin;
})();

exports['default'] = Plugin;
module.exports = exports['default'];

},{}],14:[function(require,module,exports){
'use strict';

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

var TransloaditBasic = (function (_Plugin) {
  _inherits(TransloaditBasic, _Plugin);

  function TransloaditBasic(core, opts) {
    _classCallCheck(this, TransloaditBasic);

    _get(Object.getPrototypeOf(TransloaditBasic.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'presetter';
    this.core.use(DragDrop, { modal: true, wait: true }).use(Tus10, { endpoint: 'http://master.tus.io:8080' });
  }

  return TransloaditBasic;
})(_Plugin3['default']);

},{"./Plugin":13}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Plugin2 = require('./Plugin');

var _Plugin3 = _interopRequireDefault(_Plugin2);

var _tusJsClient = require('tus-js-client');

var _tusJsClient2 = _interopRequireDefault(_tusJsClient);

var Tus10 = (function (_Plugin) {
  _inherits(Tus10, _Plugin);

  function Tus10(core, opts) {
    _classCallCheck(this, Tus10);

    _get(Object.getPrototypeOf(Tus10.prototype), 'constructor', this).call(this, core, opts);
    this.type = 'uploader';
  }

  _createClass(Tus10, [{
    key: 'run',
    value: function run(results) {
      console.log({
        'class': 'Tus10',
        method: 'run',
        results: results
      });

      var files = this.extractFiles(results);

      this.setProgress(0);
      var uploaded = [];
      var uploaders = [];
      for (var i in files) {
        var file = files[i];
        uploaders.push(this.upload(file, i, files.length));
      }

      return Promise.all(uploaders);
    }
  }, {
    key: 'upload',
    value: function upload(file, current, total) {
      // Create a new tus upload
      var self = this;
      var upload = new _tusJsClient2['default'].Upload(file, {
        endpoint: this.opts.endpoint,
        onError: function onError(error) {
          return Promise.reject('Failed because: ' + error);
        },
        onProgress: function onProgress(bytesUploaded, bytesTotal) {
          var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
          self.setProgress(percentage, current, total);
        },
        onSuccess: function onSuccess() {
          console.log('Download ' + upload.file.name + ' from ' + upload.url);
          return Promise.resolve(upload);
        }
      });
      // Start the upload
      upload.start();
    }
  }]);

  return Tus10;
})(_Plugin3['default']);

exports['default'] = Tus10;
module.exports = exports['default'];

},{"./Plugin":13,"tus-js-client":4}],16:[function(require,module,exports){
// Parent
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Plugin = require('./Plugin');

var _Plugin2 = _interopRequireDefault(_Plugin);

// Selecters

var _DragDrop = require('./DragDrop');

var _DragDrop2 = _interopRequireDefault(_DragDrop);

var _Dropbox = require('./Dropbox');

var _Dropbox2 = _interopRequireDefault(_Dropbox);

var _Formtag = require('./Formtag');

var _Formtag2 = _interopRequireDefault(_Formtag);

// Uploaders

var _Tus10 = require('./Tus10');

var _Tus102 = _interopRequireDefault(_Tus10);

var _Multipart = require('./Multipart');

var _Multipart2 = _interopRequireDefault(_Multipart);

// Presetters

var _TransloaditBasic = require('./TransloaditBasic');

var _TransloaditBasic2 = _interopRequireDefault(_TransloaditBasic);

exports['default'] = {
  Plugin: _Plugin2['default'],
  DragDrop: _DragDrop2['default'],
  Dropbox: _Dropbox2['default'],
  Formtag: _Formtag2['default'],
  Tus10: _Tus102['default'],
  Multipart: _Multipart2['default'],
  TransloaditBasic: _TransloaditBasic2['default']
};
module.exports = exports['default'];

},{"./DragDrop":9,"./Dropbox":10,"./Formtag":11,"./Multipart":12,"./Plugin":13,"./TransloaditBasic":14,"./Tus10":15}]},{},[8])(8)
});