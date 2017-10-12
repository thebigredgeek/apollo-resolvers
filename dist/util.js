"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = require("./promise");
exports.isFunction = fn => typeof fn === 'function';
exports.Promisify = fn => {
    const Promise = promise_1.getPromise();
    return (...args) => new Promise((resolve, reject) => {
        try {
            return Promise.resolve(fn(...args)).then(r => resolve(r), e => reject(e));
        }
        catch (e) {
            return reject(e);
        }
    });
};
exports.isNotNullOrUndefined = val => val !== null && val !== undefined;
//# sourceMappingURL=util.js.map