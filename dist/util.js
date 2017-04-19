'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNotNullOrUndefined = exports.Promisify = exports.isFunction = undefined;

var _promise = require('./promise');

var isFunction = exports.isFunction = function isFunction(fn) {
  return typeof fn === 'function';
};

var Promisify = exports.Promisify = function Promisify(fn) {
  var Promise = (0, _promise.getPromise)();
  return function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return new Promise(function (resolve, reject) {
      try {
        return Promise.resolve(fn.apply(undefined, args)).then(function (r) {
          return resolve(r);
        }, function (e) {
          return reject(e);
        });
      } catch (e) {
        return reject(e);
      }
    });
  };
};

var isNotNullOrUndefined = exports.isNotNullOrUndefined = function isNotNullOrUndefined(val) {
  return val !== null && val !== undefined;
};
//# sourceMappingURL=util.js.map