'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createResolver = undefined;

var _promise = require('./promise');

var _util = require('./util');

var createResolver = exports.createResolver = function createResolver(resFn, errFn) {
  var Promise = (0, _promise.getPromise)();
  var baseResolver = function baseResolver(root) {
    var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var context = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    // Return resolving promise with `null` if the resolver function param is not a function
    if (!(0, _util.isFunction)(resFn)) return Promise.resolve(null);
    return (0, _util.Promisify)(resFn)(root, args, context).catch(function (e) {
      // On error, check if there is an error handler.  If not, throw the original error
      if (!(0, _util.isFunction)(errFn)) throw e;
      // Call the error handler.
      return (0, _util.Promisify)(errFn)(root, args, context, e).then(function (parsedError) {
        // If it resolves, throw the resolving value or the original error.
        throw parsedError || e;
      }, function (parsedError) {
        // If it rejects, throw the rejecting value or the original error
        throw parsedError || e;
      });
    });
  };

  baseResolver.createResolver = function (cResFn, cErrFn) {
    var Promise = (0, _promise.getPromise)();

    var childResFn = function childResFn(root, args, context) {
      // Start with either the parent resolver function or a no-op (returns null)
      var entry = (0, _util.isFunction)(resFn) ? (0, _util.Promisify)(resFn)(root, args, context) : Promise.resolve(null);
      return entry.then(function (r) {
        // If the parent returns a value, continue
        if ((0, _util.isNotNullOrUndefined)(r)) return r;
        // Call the child resolver function or a no-op (returns null)
        return (0, _util.isFunction)(cResFn) ? (0, _util.Promisify)(cResFn)(root, args, context) : Promise.resolve(null);
      });
    };

    var childErrFn = function childErrFn(root, args, context, err) {
      // Start with either the child error handler or a no-op (returns null)
      var entry = (0, _util.isFunction)(cErrFn) ? (0, _util.Promisify)(cErrFn)(root, args, context, err) : Promise.resolve(null);

      return entry.then(function (r) {
        // If the child returns a value, throw it
        if ((0, _util.isNotNullOrUndefined)(r)) throw r;
        // Call the parent error handler or a no-op (returns null)
        return (0, _util.isFunction)(errFn) ? (0, _util.Promisify)(errFn)(root, args, context, err).then(function (e) {
          // If it resolves, throw the resolving value or the original error
          throw e || err;
        }, function (e) {
          // If it rejects, throw the rejecting value or the original error
          throw e || err;
        }) : Promise.resolve(null);
      });
    };

    // Create the child resolver and return it
    return createResolver(childResFn, childErrFn);
  };

  return baseResolver;
};
//# sourceMappingURL=resolver.js.map