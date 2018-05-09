"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("deepmerge");
// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
exports.combineResolvers = (resolvers = []) => resolvers
    .reduce((combined, resolver) => merge(combined, resolver));
// Accepts multiple authentication resolvers and returns a function which will be called
// if all of the authentication resolvers succeed, or throw an error if one of them fails
exports.and = (...conditions) => resolver => {
    return conditions.reduceRight((p, c) => {
        return c.createResolver(p);
    }, resolver);
};
// Accepts multiple authentication resolvers and returns a function which will be called
// if any of the authentication resolvers succeed, or throw an error if all of them fail
exports.or = (...conditions) => resolver => (...query) => {
    return new Promise((resolve, reject) => {
        let limit = conditions.length - 1;
        const attempt = (i) => conditions[i].createResolver(resolver)(...query)
            .then(res => resolve(res))
            .catch(err => {
            if (i === limit)
                reject(err);
            else
                attempt(i + 1);
        });
        attempt(0);
    });
};
//# sourceMappingURL=helper.js.map