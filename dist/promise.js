"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
// Expose the Promise constructor so that it can be overwritten by a different lib like Bluebird
let p = Promise;
// Allow overload with compliant promise lib
exports.usePromise = pLib => {
    assert(pLib && pLib.prototype, 'apollo-errors#usePromise expects a valid Promise library');
    assert(!!pLib.resolve, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.resolve"');
    assert(!!pLib.reject, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.reject"');
    assert(!!pLib.all, 'apollo-errors#usePromise expects a Promise library that implements static method "Promise.all"');
    assert(!!pLib.prototype.then, 'apollo-errors#usePromise expects a Promise library that implements method "promise.then" on the constructor prototype');
    assert(!!pLib.prototype.catch, 'apollo-errors#usePromise expects a Promise library that implements method "promise.catch" on the constructor prototype');
    p = pLib;
};
// Return the currently selected promise lib
exports.getPromise = () => p;
//# sourceMappingURL=promise.js.map