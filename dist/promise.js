'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPromise = exports.usePromise = undefined;

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Expose the Promise constructor so that it can be overwritten by a different lib like Bluebird
var p = Promise;

// Allow overload with compliant promise lib
var usePromise = exports.usePromise = function usePromise(pLib) {
  (0, _assert2.default)(pLib && pLib.prototype, 'apollo-errors#usePromise expects a valid Promise library');
  (0, _assert2.default)(!!pLib.resolve, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.resolve"');
  (0, _assert2.default)(!!pLib.reject, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.reject"');
  (0, _assert2.default)(!!pLib.all, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.all"');
  (0, _assert2.default)(!!pLib.prototype.then, 'apollo-errors#usePromise expects a Promise library that implements method "promise.then" on the constructor prototype');
  (0, _assert2.default)(!!pLib.prototype.catch, 'apollo-errors#usePromise expects a Promise library that implements method "promise.catch" on the constructor prototype');
  p = pLib;
};

// Return the currently selected promise lib
var getPromise = exports.getPromise = function getPromise() {
  return p;
};
//# sourceMappingURL=promise.js.map