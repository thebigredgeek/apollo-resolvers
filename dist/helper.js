"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const merge = require("deepmerge");
// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
exports.combineResolvers = (resolvers = []) => resolvers
    .reduce((combined, resolver) => merge(combined, resolver));
//# sourceMappingURL=helper.js.map