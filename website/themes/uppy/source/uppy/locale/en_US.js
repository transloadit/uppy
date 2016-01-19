(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var en_US = {};

en_US.strings = {
  'choose_file': 'Choose a file',
  'you_have_chosen': 'You have chosen: %{file_name}',
  'or_drag_drop': 'or drag it here',
  'files_chosen': {
    0: '%{smart_count} file selected',
    1: '%{smart_count} files selected'
  }
};

en_US.pluralize = function (n) {
  if (n === 1) {
    return 0;
  }
  return 1;
};

if (typeof Uppy !== 'undefined') {
  Uppy.locale.en_US = en_US;
}

exports['default'] = en_US;
module.exports = exports['default'];

},{}]},{},[1]);
