"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = require("./promise");
const util_1 = require("./util");
exports.createResolver = (resFn, errFn) => {
    const Promise = promise_1.getPromise();
    const baseResolver = (root, args = {}, context = {}) => {
        // Return resolving promise with `null` if the resolver function param is not a function
        if (!util_1.isFunction(resFn))
            return Promise.resolve(null);
        return util_1.Promisify(resFn)(root, args, context).catch(e => {
            // On error, check if there is an error handler.  If not, throw the original error
            if (!util_1.isFunction(errFn))
                throw e;
            // Call the error handler.
            return util_1.Promisify(errFn)(root, args, context, e).then(parsedError => {
                // If it resolves, throw the resolving value or the original error.
                throw parsedError || e;
            }, parsedError => {
                // If it rejects, throw the rejecting value or the original error
                throw parsedError || e;
            });
        });
    };
    baseResolver['createResolver'] = (cResFn, cErrFn) => {
        const Promise = promise_1.getPromise();
        const childResFn = (root, args, context) => {
            // Start with either the parent resolver function or a no-op (returns null)
            const entry = util_1.isFunction(resFn) ? util_1.Promisify(resFn)(root, args, context) : Promise.resolve(null);
            return entry.then(r => {
                // If the parent returns a value, continue
                if (util_1.isNotNullOrUndefined(r))
                    return r;
                // Call the child resolver function or a no-op (returns null)
                return util_1.isFunction(cResFn) ? util_1.Promisify(cResFn)(root, args, context) : Promise.resolve(null);
            });
        };
        const childErrFn = (root, args, context, err) => {
            // Start with either the child error handler or a no-op (returns null)
            const entry = util_1.isFunction(cErrFn) ? util_1.Promisify(cErrFn)(root, args, context, err) : Promise.resolve(null);
            return entry.then(r => {
                // If the child returns a value, throw it
                if (util_1.isNotNullOrUndefined(r))
                    throw r;
                // Call the parent error handler or a no-op (returns null)
                return util_1.isFunction(errFn) ? util_1.Promisify(errFn)(root, args, context, err).then(e => {
                    // If it resolves, throw the resolving value or the original error
                    throw e || err;
                }, e => {
                    // If it rejects, throw the rejecting value or the original error
                    throw e || err;
                }) : Promise.resolve(null);
            });
        };
        // Create the child resolver and return it
        return exports.createResolver(childResFn, childErrFn);
    };
    return baseResolver;
};
//# sourceMappingURL=resolver.js.map