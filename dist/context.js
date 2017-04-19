'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Context = exports.createExpressContext = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var createExpressContext = exports.createExpressContext = function createExpressContext(data, res) {
  data = data || {};
  data.user = data.user || null;
  data.models = data.models || {};
  var context = new Context(data);
  if (res) {
    (0, _assert2.default)(typeof res.once === 'function', 'createExpressContext takes response as second parameter that implements "res.once"');
    // Bind the response finish event to the context disposal method
    res.once('finish', function () {
      return context && context.dispose ? context.dispose() : null;
    });
  }
  return context;
};

var Context = exports.Context = function () {
  function Context(data) {
    var _this = this;

    _classCallCheck(this, Context);

    Object.keys(data).forEach(function (key) {
      _this[key] = data[key];
    });
  }

  _createClass(Context, [{
    key: 'dispose',
    value: function dispose() {
      var models = this.models;
      var user = this.user;
      this.models = null;
      this.user = null;
      // Call dispose on every attached model that contains a dispose method
      Object.keys(models).forEach(function (key) {
        return models[key].dispose ? models[key].dispose() : null;
      });
    }
  }]);

  return Context;
}();
//# sourceMappingURL=context.js.map