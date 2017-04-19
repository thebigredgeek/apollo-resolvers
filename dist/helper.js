'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineResolvers = undefined;

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
var combineResolvers = exports.combineResolvers = function combineResolvers() {
  var resolvers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return resolvers.reduce(function (combined, resolver) {
    return (0, _deepmerge2.default)(combined, resolver);
  });
};
//# sourceMappingURL=helper.js.map