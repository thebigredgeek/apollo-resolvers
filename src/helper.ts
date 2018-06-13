import { createResolver, ResultFunction, ErrorFunction, Resolver } from "./resolver";
import * as merge from "deepmerge";
import { isFunction } from "./util";

// Helper function to combine multiple resolver definition hashes into a single hash for consumption by Apollostack's graphql-server
export const combineResolvers = (resolvers = []) => resolvers
  .reduce((combined, resolver) => merge(combined, resolver));

// Accepts multiple authentication resolvers and returns a function which will be called
// if all of the authentication resolvers succeed, or throw an error if one of them fails
export const and = (...conditions) => resolver => {
  return conditions.reduceRight((p, c) => {
    return c.createResolver(p);
  }, resolver)
}

// Accepts multiple authentication resolvers and returns a function which will be called
// if any of the authentication resolvers succeed, or throw an error if all of them fail
export const or = (...conditions) => resolver => (...query) => {
  return new Promise((resolve, reject) => {
    let limit = conditions.length - 1;
    const attempt = (i) =>
      conditions[i].createResolver(resolver)(...query)
        .then(res => resolve(res))
        .catch(err => {
          if(i === limit) reject(err);
          else attempt(i + 1);
        });
    attempt(0);
  });
}

/**
 * Constructs a composable resolver with the same arguments as createResolver.
 * The composable resolver provides the compose method which takes an object of named resolver functions.
 * The resolvers object can contain, constructed resolver functions or { resolve: fn, error: fn } params 
 * to construct a new resolver. Compose returns an object of resolvers who inherit from the baseResolver
 * on which compose was called.
 * 
 * @param resFn: resolver function
 * @param errFn: error handler
 * @returns resolverFn: { createResolver(resFn, errFn), compose({ resolvers }): { composed resolvers } ...}
 */
// export const composable = <R,E>(resFn: ResultFunction<R>, errFn:  ErrorFunction<E>) => {
//   const baseResolver = createResolver(resFn, errFn);

//   baseResolver['compose'] = ( resolvers: {} ) => {
//     const composed = {};
//     Object.keys(resolvers).forEach(key => {
//       const _resolver = resolvers[key];
//       composed[key] = (_resolver.resolve || _resolver.error)
//         // supports syntax: compose( { myResolver: { resolve: resFn, error: errFn } } )
//         ? baseResolver.createResolver(_resolver.resolve, _resolver.error)
//         // supports syntax: compose( { myResolver: resolver } )
//         : baseResolver.createResolver(_resolver);
//     });
//     return composed;
//   }

//   return baseResolver;
// }
