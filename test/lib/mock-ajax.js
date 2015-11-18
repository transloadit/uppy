/*

Jasmine-Ajax - v3.1.0: a set of helpers for testing AJAX requests under the Jasmine
BDD framework for JavaScript.

http://github.com/jasmine/jasmine-ajax

Jasmine Home page: http://jasmine.github.io/

Copyright (c) 2008-2015 Pivotal Labs

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

getJasmineRequireObj().ajax = function(jRequire) {
  var $ajax = {};

  $ajax.RequestStub = jRequire.AjaxRequestStub();
  $ajax.RequestTracker = jRequire.AjaxRequestTracker();
  $ajax.StubTracker = jRequire.AjaxStubTracker();
  $ajax.ParamParser = jRequire.AjaxParamParser();
  $ajax.eventBus = jRequire.AjaxEventBus();
  $ajax.fakeRequest = jRequire.AjaxFakeRequest($ajax.eventBus);
  $ajax.MockAjax = jRequire.MockAjax($ajax);

  return $ajax.MockAjax;
};

getJasmineRequireObj().AjaxEventBus = function() {
  function EventBus() {
    this.eventList = {};
  }

  function ensureEvent(eventList, name) {
    eventList[name] = eventList[name] || [];
    return eventList[name];
  }

  function findIndex(list, thing) {
    if (list.indexOf) {
      return list.indexOf(thing);
    }

    for(var i = 0; i < list.length; i++) {
      if (thing === list[i]) {
        return i;
      }
    }

    return -1;
  }

  EventBus.prototype.addEventListener = function(event, callback) {
    ensureEvent(this.eventList, event).push(callback);
  };

  EventBus.prototype.removeEventListener = function(event, callback) {
    var index = findIndex(this.eventList[event], callback);

    if (index >= 0) {
      this.eventList[event].splice(index, 1);
    }
  };

  EventBus.prototype.trigger = function(event) {
    var eventListeners = this.eventList[event];

    if(eventListeners){
      for(var i = 0; i < eventListeners.length; i++){
        eventListeners[i]();
      }
    }
  };

  return function() {
    return new EventBus();
  };
};
getJasmineRequireObj().AjaxFakeRequest = function(eventBusFactory) {
  function extend(destination, source, propertiesToSkip) {
    propertiesToSkip = propertiesToSkip || [];
    for (var property in source) {
      if (!arrayContains(propertiesToSkip, property)) {
        destination[property] = source[property];
      }
    }
    return destination;
  }

  function arrayContains(arr, item) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] === item) {
        return true;
      }
    }
    return false;
  }

  function wrapProgressEvent(xhr, eventName) {
    return function() {
      if (xhr[eventName]) {
        xhr[eventName]();
      }
    };
  }

  function initializeEvents(xhr) {
    xhr.eventBus.addEventListener('loadstart', wrapProgressEvent(xhr, 'onloadstart'));
    xhr.eventBus.addEventListener('load', wrapProgressEvent(xhr, 'onload'));
    xhr.eventBus.addEventListener('loadend', wrapProgressEvent(xhr, 'onloadend'));
    xhr.eventBus.addEventListener('progress', wrapProgressEvent(xhr, 'onprogress'));
    xhr.eventBus.addEventListener('error', wrapProgressEvent(xhr, 'onerror'));
    xhr.eventBus.addEventListener('abort', wrapProgressEvent(xhr, 'onabort'));
    xhr.eventBus.addEventListener('timeout', wrapProgressEvent(xhr, 'ontimeout'));
  }

  function unconvertibleResponseTypeMessage(type) {
    var msg = [
      "Can't build XHR.response for XHR.responseType of '",
      type,
      "'.",
      "XHR.response must be explicitly stubbed"
    ];
    return msg.join(' ');
  }

  function fakeRequest(global, requestTracker, stubTracker, paramParser) {
    function FakeXMLHttpRequest() {
      requestTracker.track(this);
      this.eventBus = eventBusFactory();
      initializeEvents(this);
      this.requestHeaders = {};
      this.overriddenMimeType = null;
    }

    function findHeader(name, headers) {
      name = name.toLowerCase();
      for (var header in headers) {
        if (header.toLowerCase() === name) {
          return headers[header];
        }
      }
    }

    function normalizeHeaders(rawHeaders, contentType) {
      var headers = [];

      if (rawHeaders) {
        if (rawHeaders instanceof Array) {
          headers = rawHeaders;
        } else {
          for (var headerName in rawHeaders) {
            if (rawHeaders.hasOwnProperty(headerName)) {
              headers.push({ name: headerName, value: rawHeaders[headerName] });
            }
          }
        }
      } else {
        headers.push({ name: "Content-Type", value: contentType || "application/json" });
      }

      return headers;
    }

    function parseXml(xmlText, contentType) {
      if (global.DOMParser) {
        return (new global.DOMParser()).parseFromString(xmlText, 'text/xml');
      } else {
        var xml = new global.ActiveXObject("Microsoft.XMLDOM");
        xml.async = "false";
        xml.loadXML(xmlText);
        return xml;
      }
    }

    var xmlParsables = ['text/xml', 'application/xml'];

    function getResponseXml(responseText, contentType) {
      if (arrayContains(xmlParsables, contentType.toLowerCase())) {
        return parseXml(responseText, contentType);
      } else if (contentType.match(/\+xml$/)) {
        return parseXml(responseText, 'text/xml');
      }
      return null;
    }

    var iePropertiesThatCannotBeCopied = ['responseBody', 'responseText', 'responseXML', 'status', 'statusText', 'responseTimeout'];
    extend(FakeXMLHttpRequest.prototype, new global.XMLHttpRequest(), iePropertiesThatCannotBeCopied);
    extend(FakeXMLHttpRequest.prototype, {
      open: function() {
        this.method = arguments[0];
        this.url = arguments[1];
        this.username = arguments[3];
        this.password = arguments[4];
        this.readyState = 1;
        this.onreadystatechange();
      },

      setRequestHeader: function(header, value) {
        if(this.requestHeaders.hasOwnProperty(header)) {
          this.requestHeaders[header] = [this.requestHeaders[header], value].join(', ');
        } else {
          this.requestHeaders[header] = value;
        }
      },

      overrideMimeType: function(mime) {
        this.overriddenMimeType = mime;
      },

      abort: function() {
        this.readyState = 0;
        this.status = 0;
        this.statusText = "abort";
        this.onreadystatechange();
        this.eventBus.trigger('progress');
        this.eventBus.trigger('abort');
        this.eventBus.trigger('loadend');
      },

      readyState: 0,

      onloadstart: null,
      onprogress: null,
      onabort: null,
      onerror: null,
      onload: null,
      ontimeout: null,
      onloadend: null,

      onreadystatechange: function(isTimeout) {
      },

      addEventListener: function() {
        this.eventBus.addEventListener.apply(this.eventBus, arguments);
      },

      removeEventListener: function(event, callback) {
        this.eventBus.removeEventListener.apply(this.eventBus, arguments);
      },

      status: null,

      send: function(data) {
        this.params = data;
        this.readyState = 2;
        this.eventBus.trigger('loadstart');
        this.onreadystatechange();

        var stub = stubTracker.findStub(this.url, data, this.method);
        if (stub) {
          this.respondWith(stub);
        }
      },

      contentType: function() {
        return findHeader('content-type', this.requestHeaders);
      },

      data: function() {
        if (!this.params) {
          return {};
        }

        return paramParser.findParser(this).parse(this.params);
      },

      getResponseHeader: function(name) {
        name = name.toLowerCase();
        var resultHeader;
        for(var i = 0; i < this.responseHeaders.length; i++) {
          var header = this.responseHeaders[i];
          if (name === header.name.toLowerCase()) {
            if (resultHeader) {
              resultHeader = [resultHeader, header.value].join(', ');
            } else {
              resultHeader = header.value;
            }
          }
        }
        return resultHeader;
      },

      getAllResponseHeaders: function() {
        var responseHeaders = [];
        for (var i = 0; i < this.responseHeaders.length; i++) {
          responseHeaders.push(this.responseHeaders[i].name + ': ' +
            this.responseHeaders[i].value);
        }
        return responseHeaders.join('\r\n') + '\r\n';
      },

      responseText: null,
      response: null,
      responseType: null,

      responseValue: function() {
        switch(this.responseType) {
          case null:
          case "":
          case "text":
            return this.readyState >= 3 ? this.responseText : "";
          case "json":
            return JSON.parse(this.responseText);
          case "arraybuffer":
            throw unconvertibleResponseTypeMessage('arraybuffer');
          case "blob":
            throw unconvertibleResponseTypeMessage('blob');
          case "document":
            return this.responseXML;
        }
      },


      respondWith: function(response) {
        if (this.readyState === 4) {
          throw new Error("FakeXMLHttpRequest already completed");
        }
        this.status = response.status;
        this.statusText = response.statusText || "";
        this.responseText = response.responseText || "";
        this.responseType = response.responseType || "";
        this.readyState = 4;
        this.responseHeaders = normalizeHeaders(response.responseHeaders, response.contentType);
        this.responseXML = getResponseXml(response.responseText, this.getResponseHeader('content-type') || '');
        if (this.responseXML) {
          this.responseType = 'document';
        }

        if ('response' in response) {
          this.response = response.response;
        } else {
          this.response = this.responseValue();
        }

        this.onreadystatechange();
        this.eventBus.trigger('progress');
        this.eventBus.trigger('load');
        this.eventBus.trigger('loadend');
      },

      responseTimeout: function() {
        if (this.readyState === 4) {
          throw new Error("FakeXMLHttpRequest already completed");
        }
        this.readyState = 4;
        jasmine.clock().tick(30000);
        this.onreadystatechange('timeout');
        this.eventBus.trigger('progress');
        this.eventBus.trigger('timeout');
        this.eventBus.trigger('loadend');
      },

      responseError: function() {
        if (this.readyState === 4) {
          throw new Error("FakeXMLHttpRequest already completed");
        }
        this.readyState = 4;
        this.onreadystatechange();
        this.eventBus.trigger('progress');
        this.eventBus.trigger('error');
        this.eventBus.trigger('loadend');
      }
    });

    return FakeXMLHttpRequest;
  }

  return fakeRequest;
};

getJasmineRequireObj().MockAjax = function($ajax) {
  function MockAjax(global) {
    var requestTracker = new $ajax.RequestTracker(),
      stubTracker = new $ajax.StubTracker(),
      paramParser = new $ajax.ParamParser(),
      realAjaxFunction = global.XMLHttpRequest,
      mockAjaxFunction = $ajax.fakeRequest(global, requestTracker, stubTracker, paramParser);

    this.install = function() {
      if (global.XMLHttpRequest === mockAjaxFunction) {
        throw "MockAjax is already installed.";
      }

      global.XMLHttpRequest = mockAjaxFunction;
    };

    this.uninstall = function() {
      global.XMLHttpRequest = realAjaxFunction;

      this.stubs.reset();
      this.requests.reset();
      paramParser.reset();
    };

    this.stubRequest = function(url, data, method) {
      var stub = new $ajax.RequestStub(url, data, method);
      stubTracker.addStub(stub);
      return stub;
    };

    this.withMock = function(closure) {
      this.install();
      try {
        closure();
      } finally {
        this.uninstall();
      }
    };

    this.addCustomParamParser = function(parser) {
      paramParser.add(parser);
    };

    this.requests = requestTracker;
    this.stubs = stubTracker;
  }

  return MockAjax;
};

getJasmineRequireObj().AjaxParamParser = function() {
  function ParamParser() {
    var defaults = [
      {
        test: function(xhr) {
          return (/^application\/json/).test(xhr.contentType());
        },
        parse: function jsonParser(paramString) {
          return JSON.parse(paramString);
        }
      },
      {
        test: function(xhr) {
          return true;
        },
        parse: function naiveParser(paramString) {
          var data = {};
          var params = paramString.split('&');

          for (var i = 0; i < params.length; ++i) {
            var kv = params[i].replace(/\+/g, ' ').split('=');
            var key = decodeURIComponent(kv[0]);
            data[key] = data[key] || [];
            data[key].push(decodeURIComponent(kv[1]));
          }
          return data;
        }
      }
    ];
    var paramParsers = [];

    this.add = function(parser) {
      paramParsers.unshift(parser);
    };

    this.findParser = function(xhr) {
        for(var i in paramParsers) {
          var parser = paramParsers[i];
          if (parser.test(xhr)) {
            return parser;
          }
        }
    };

    this.reset = function() {
      paramParsers = [];
      for(var i in defaults) {
        paramParsers.push(defaults[i]);
      }
    };

    this.reset();
  }

  return ParamParser;
};

getJasmineRequireObj().AjaxRequestStub = function() {
  function RequestStub(url, stubData, method) {
    var normalizeQuery = function(query) {
      return query ? query.split('&').sort().join('&') : undefined;
    };

    if (url instanceof RegExp) {
      this.url = url;
      this.query = undefined;
    } else {
      var split = url.split('?');
      this.url = split[0];
      this.query = split.length > 1 ? normalizeQuery(split[1]) : undefined;
    }

    this.data = normalizeQuery(stubData);
    this.method = method;

    this.andReturn = function(options) {
      this.status = options.status || 200;

      this.contentType = options.contentType;
      this.response = options.response;
      this.responseText = options.responseText;
      this.responseHeaders = options.responseHeaders;
    };

    this.matches = function(fullUrl, data, method) {
      var matches = false;
      fullUrl = fullUrl.toString();
      if (this.url instanceof RegExp) {
        matches = this.url.test(fullUrl);
      } else {
        var urlSplit = fullUrl.split('?'),
            url = urlSplit[0],
            query = urlSplit[1];
        matches = this.url === url && this.query === normalizeQuery(query);
      }
      return matches && (!this.data || this.data === normalizeQuery(data)) && (!this.method || this.method === method);
    };
  }

  return RequestStub;
};

getJasmineRequireObj().AjaxRequestTracker = function() {
  function RequestTracker() {
    var requests = [];

    this.track = function(request) {
      requests.push(request);
    };

    this.first = function() {
      return requests[0];
    };

    this.count = function() {
      return requests.length;
    };

    this.reset = function() {
      requests = [];
    };

    this.mostRecent = function() {
      return requests[requests.length - 1];
    };

    this.at = function(index) {
      return requests[index];
    };

    this.filter = function(url_to_match) {
      var matching_requests = [];

      for (var i = 0; i < requests.length; i++) {
        if (url_to_match instanceof RegExp &&
            url_to_match.test(requests[i].url)) {
            matching_requests.push(requests[i]);
        } else if (url_to_match instanceof Function &&
            url_to_match(requests[i])) {
            matching_requests.push(requests[i]);
        } else {
          if (requests[i].url === url_to_match) {
            matching_requests.push(requests[i]);
          }
        }
      }

      return matching_requests;
    };
  }

  return RequestTracker;
};

getJasmineRequireObj().AjaxStubTracker = function() {
  function StubTracker() {
    var stubs = [];

    this.addStub = function(stub) {
      stubs.push(stub);
    };

    this.reset = function() {
      stubs = [];
    };

    this.findStub = function(url, data, method) {
      for (var i = stubs.length - 1; i >= 0; i--) {
        var stub = stubs[i];
        if (stub.matches(url, data, method)) {
          return stub;
        }
      }
    };
  }

  return StubTracker;
};

(function() {
  var jRequire = getJasmineRequireObj(),
      MockAjax = jRequire.ajax(jRequire);
  if (typeof window === "undefined" && typeof exports === "object") {
    exports.MockAjax = MockAjax;
    jasmine.Ajax = new MockAjax(exports);
  } else {
    window.MockAjax = MockAjax;
    jasmine.Ajax = new MockAjax(window);
  }
}());